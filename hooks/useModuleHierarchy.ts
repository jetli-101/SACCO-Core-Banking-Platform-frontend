import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { flattenModules, ModuleNode } from '@/store/slices/modules/modulesSlice';

export interface ModuleHierarchyEntry {
    module: ModuleNode;
    depth: number;
}

// Shared by the Modules list, create, and [id] pages — /modules/all nests a module's
// children inline rather than listing them separately at the top level, so every page that
// needs to show or pick modules has to flatten first and rebuild ordering from parentId.
// Centralized here instead of copy-pasted per page.
export const useModuleHierarchy = (excludeId?: string) => {
    const { items, moduleTypes } = useAppSelector((state) => state.modules);

    const flatItems = useMemo(() => Array.from(flattenModules(items).values()), [items]);

    const hierarchy = useMemo(() => {
        const byParent = new Map<string, ModuleNode[]>();
        const topLevel: ModuleNode[] = [];
        flatItems.forEach((item) => {
            if (item.parentId && flatItems.some((other) => other.id === item.parentId)) {
                byParent.set(item.parentId, [...(byParent.get(item.parentId) || []), item]);
            } else {
                topLevel.push(item);
            }
        });

        const sortByOrder = (list: ModuleNode[]) => [...list].sort((a, b) => a.orderNo - b.orderNo);
        const result: ModuleHierarchyEntry[] = [];
        const visited = new Set<string>();
        const walk = (list: ModuleNode[], depth: number) => {
            sortByOrder(list).forEach((module) => {
                if (visited.has(module.id)) return;
                visited.add(module.id);
                result.push({ module, depth });
                walk(byParent.get(module.id) || [], depth + 1);
            });
        };
        walk(topLevel, 0);
        return result;
    }, [flatItems]);

    const depthById = useMemo(() => new Map(hierarchy.map((entry) => [entry.module.id, entry.depth])), [hierarchy]);
    const orderedModules = useMemo(() => hierarchy.map((entry) => entry.module), [hierarchy]);

    // Excludes the module currently being edited from its own "Parent Module" options.
    const parentOptions = useMemo(() => (excludeId ? hierarchy.filter((entry) => entry.module.id !== excludeId) : hierarchy), [hierarchy, excludeId]);

    const moduleTypeName = (id: string) => moduleTypes.find((type) => type.id === id)?.name || '—';
    const moduleName = (id?: string) => (id ? flatItems.find((item) => item.id === id)?.name || '—' : '—');

    // A module "has children" if any other module's parentId points at it — checked
    // against flatItems rather than module.children, since .children is only reliably
    // populated on whichever copy the API nested it under, not every reference to it.
    const moduleHasChildren = (id: string) => flatItems.some((item) => item.parentId === id);

    const stats = useMemo(
        () => ({
            total: flatItems.length,
            topLevel: flatItems.filter((item) => !item.parentId).length,
            typesUsed: new Set(flatItems.map((item) => item.moduleTypeId)).size,
        }),
        [flatItems]
    );

    return { flatItems, hierarchy, depthById, orderedModules, parentOptions, moduleTypeName, moduleName, moduleHasChildren, stats, moduleTypes };
};
