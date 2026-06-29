import { useState } from 'react';
import Link from 'next/link';
import AnimateHeight from 'react-animate-height';
import IconCaretDown from '@/components/Icon/IconCaretDown';
import { ModuleNode } from '@/store/slices/modules/modulesSlice';
import { getModuleIcon } from './moduleIcons';

interface SidebarMenuItemProps {
    module: ModuleNode;
    collapsed: boolean;
    depth?: number;
    onExpandSidebar?: () => void;
}

// Renders one node from the backend's module tree. Modules are self-referencing
// (parent/children) to an arbitrary depth, so this renders itself recursively rather
// than assuming a fixed two-level menu.
const SidebarMenuItem = ({ module, collapsed, depth = 0, onExpandSidebar }: SidebarMenuItemProps) => {
    const [expanded, setExpanded] = useState(false);
    const Icon = getModuleIcon(module.icon);
    const hasChildren = module.children && module.children.length > 0;
    // The CSS already indents one level (.sub-menu li a gets px-9); only nudge further for depth 2+.
    const indent = depth >= 2 ? { paddingLeft: `${(depth - 1) * 16 + 36}px` } : undefined;

    if (!hasChildren) {
        // Nested rows (depth > 0) live inside .sub-menu, which already renders the small
        // dash/bar marker via CSS (see .sidebar ul.sub-menu li a::before) — skip the icon
        // there so children read like "- Child Name" rather than duplicating an icon per row.
        return (
            <div className="menu nav-item">
                <Link href={module.urlPath || '#'} className={`group ${collapsed ? 'justify-center' : ''}`} style={indent} title={collapsed ? module.name : undefined}>
                    <div className="flex items-center">
                        {depth === 0 && <Icon className="shrink-0 group-hover:!text-primary" />}
                        {!collapsed && (
                            <span className={`text-black dark:text-[#506690] dark:group-hover:text-white-dark ${depth === 0 ? 'ltr:pl-3 rtl:pr-3' : ''}`}>{module.name}</span>
                        )}
                    </div>
                </Link>
            </div>
        );
    }

    return (
        <div className="menu nav-item">
            <button
                type="button"
                className={`nav-link group w-full ${collapsed ? 'justify-center' : ''} ${expanded ? '!bg-primary-light dark:!bg-primary/10' : ''}`}
                style={indent}
                onClick={() => (collapsed ? onExpandSidebar?.() : setExpanded((value) => !value))}
                title={collapsed ? module.name : undefined}
            >
                <div className="flex items-center">
                    {depth === 0 && <Icon className={`shrink-0 group-hover:!text-primary ${expanded ? '!text-primary' : ''}`} />}
                    {!collapsed && (
                        <span
                            className={`${depth === 0 ? 'ltr:pl-3 rtl:pr-3' : ''} ${expanded ? 'text-primary' : 'text-black dark:text-[#506690]'} dark:group-hover:text-white-dark`}
                        >
                            {module.name}
                        </span>
                    )}
                </div>

                {!collapsed && (
                    <div className={`${expanded ? 'text-primary' : ''} ${!expanded ? '-rotate-90 rtl:rotate-90' : ''}`}>
                        <IconCaretDown />
                    </div>
                )}
            </button>

            {!collapsed && (
                <AnimateHeight duration={300} height={expanded ? 'auto' : 0}>
                    <ul className="sub-menu text-gray-500">
                        {module.children.map((child) => (
                            <li key={child.id}>
                                <SidebarMenuItem module={child} collapsed={collapsed} depth={depth + 1} onExpandSidebar={onExpandSidebar} />
                            </li>
                        ))}
                    </ul>
                </AnimateHeight>
            )}
        </div>
    );
};

export default SidebarMenuItem;
