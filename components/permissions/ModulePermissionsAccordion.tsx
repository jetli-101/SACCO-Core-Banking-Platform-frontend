import { useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { buildModuleTree, ModuleNode } from '@/store/slices/modules/modulesSlice';
import IconCaretsDown from '@/components/Icon/IconCaretsDown';

interface ModulePermissionsAccordionProps {
    grantedIds: Set<string>;
    onToggle: (moduleId: string, granted: boolean) => void;
    disabled?: boolean;
}

// Shared by the Role and UserGroup detail pages' "Permissions" tab — one accordion
// section per ModuleType, each listing its modules (indented for nested ones) with a
// Yes/No toggle controlling whether that module shows up in the sidebar for anyone
// granted via this Role/UserGroup.
const ModulePermissionsAccordion = ({ grantedIds, onToggle, disabled }: ModulePermissionsAccordionProps) => {
    const { items, moduleTypes } = useAppSelector((state) => state.modules);
    const tree = useMemo(() => buildModuleTree(items, moduleTypes), [items, moduleTypes]);

    const [openTypes, setOpenTypes] = useState<Set<string>>(() => new Set(tree.map((group) => group.moduleTypeId)));

    const toggleSection = (moduleTypeId: string) => {
        setOpenTypes((prev) => {
            const next = new Set(prev);
            if (next.has(moduleTypeId)) next.delete(moduleTypeId);
            else next.add(moduleTypeId);
            return next;
        });
    };

    const renderModuleRow = (module: ModuleNode, depth: number) => {
        const granted = grantedIds.has(module.id);
        return (
            <div key={module.id}>
                <div className="flex items-center justify-between py-2" style={{ paddingLeft: `${depth * 20}px` }}>
                    <span className="text-sm">
                        {depth > 0 && <span className="text-white-dark">↳ </span>}
                        {module.name}
                    </span>
                    <div className="flex shrink-0 overflow-hidden rounded-md border border-white-light dark:border-white/10">
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onToggle(module.id, true)}
                            className={`px-3 py-1 text-xs font-semibold transition-colors ${granted ? 'bg-success text-white' : 'bg-transparent text-white-dark hover:bg-success/10'}`}
                        >
                            Yes
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onToggle(module.id, false)}
                            className={`px-3 py-1 text-xs font-semibold transition-colors ${!granted ? 'bg-danger text-white' : 'bg-transparent text-white-dark hover:bg-danger/10'}`}
                        >
                            No
                        </button>
                    </div>
                </div>
                {module.children?.map((child) => renderModuleRow(child, depth + 1))}
            </div>
        );
    };

    if (tree.length === 0) {
        return <p className="text-sm text-white-dark">No modules exist yet — create some under Modules first.</p>;
    }

    return (
        <div className="space-y-3">
            {tree.map((group) => {
                const isOpen = openTypes.has(group.moduleTypeId);
                return (
                    <div key={group.moduleTypeId} className="overflow-hidden rounded-md border border-white-light dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => toggleSection(group.moduleTypeId)}
                            className="flex w-full items-center justify-between bg-white-light/40 px-4 py-3 text-left font-semibold dark:bg-dark/40"
                        >
                            {group.moduleTypeName}
                            <IconCaretsDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                        </button>
                        {isOpen && <div className="divide-y divide-white-light px-4 dark:divide-white/10">{group.modules.map((module) => renderModuleRow(module, 0))}</div>}
                    </div>
                );
            })}
        </div>
    );
};

export default ModulePermissionsAccordion;
