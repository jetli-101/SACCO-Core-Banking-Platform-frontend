import { useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { buildModuleTree, ModuleNode } from '@/store/slices/modules/modulesSlice';
import IconSearch from '@/components/Icon/IconSearch';
import IconCaretDown from '@/components/Icon/IconCaretDown';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconXCircle from '@/components/Icon/IconXCircle';

interface ModulePermissionsAccordionProps {
    grantedIds: Set<string>;
    onToggle: (moduleId: string, granted: boolean) => void;
    disabled?: boolean;
}

const nameMatches = (module: ModuleNode, term: string): boolean => module.name.toLowerCase().includes(term) || module.children.some((child) => nameMatches(child, term));

// Shared by the Role and UserGroup detail pages' "Permissions" tab — a flat, searchable
// list of top-level modules (module-type grouping only drives the sidebar, not this
// table), each expandable to reveal its children, with a single Yes/No Access toggle
// controlling whether that module shows up in the sidebar for anyone granted via this
// Role/UserGroup.
const ModulePermissionsAccordion = ({ grantedIds, onToggle, disabled }: ModulePermissionsAccordionProps) => {
    const { items, moduleTypes } = useAppSelector((state) => state.modules);
    const topLevelModules = useMemo(() => buildModuleTree(items, moduleTypes).flatMap((group) => group.modules), [items, moduleTypes]);

    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const term = search.trim().toLowerCase();
    const filtered = term ? topLevelModules.filter((module) => nameMatches(module, term)) : topLevelModules;

    const toggleExpand = (moduleId: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    };

    const renderRow = (module: ModuleNode, depth: number) => {
        const hasChildren = module.children.length > 0;
        const isOpen = expanded.has(module.id) || !!term;
        const granted = grantedIds.has(module.id);

        return (
            <div key={module.id}>
                <div
                    className="flex items-center justify-between border-b border-white-light py-2.5 last:border-0 dark:border-white/10"
                    style={{ paddingLeft: `${depth * 20}px` }}
                >
                    <button
                        type="button"
                        onClick={() => hasChildren && toggleExpand(module.id)}
                        className={`flex items-center gap-2 text-left text-sm ${hasChildren ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                        {hasChildren ? (
                            <IconCaretDown className={`h-3.5 w-3.5 shrink-0 text-white-dark transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                        ) : (
                            <span className="inline-block w-3.5" />
                        )}
                        {module.name}
                    </button>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onToggle(module.id, !granted)}
                        className={`badge flex shrink-0 items-center gap-1 ${granted ? 'bg-success-light text-success' : 'bg-white-light text-white-dark dark:bg-dark/40'}`}
                    >
                        {granted ? <IconCircleCheck className="h-3.5 w-3.5" /> : <IconXCircle className="h-3.5 w-3.5" />}
                        {granted ? 'Yes' : 'No'}
                    </button>
                </div>
                {hasChildren && isOpen && module.children.map((child) => renderRow(child, depth + 1))}
            </div>
        );
    };

    if (topLevelModules.length === 0) {
        return <p className="text-sm text-white-dark">No modules exist yet — create some under Modules first.</p>;
    }

    return (
        <div>
            <div className="relative mb-3 max-w-md">
                <input type="text" className="form-input pr-10" placeholder="Search modules..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-white-dark">
                    <IconSearch className="h-4 w-4" />
                </span>
            </div>
            <div className="overflow-hidden rounded-md border border-white-light dark:border-white/10">
                <div className="flex items-center justify-between bg-white-light/40 px-4 py-2 text-xs font-semibold uppercase text-white-dark dark:bg-dark/40">
                    <span>Name</span>
                    <span>Access</span>
                </div>
                <div className="px-4">
                    {filtered.length === 0 ? <p className="py-3 text-sm text-white-dark">No modules match your search</p> : filtered.map((module) => renderRow(module, 0))}
                </div>
            </div>
        </div>
    );
};

export default ModulePermissionsAccordion;
