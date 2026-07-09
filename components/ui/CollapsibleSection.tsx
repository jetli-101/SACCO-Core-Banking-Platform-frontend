import { ReactNode, useState } from 'react';
import IconCaretDown from '@/components/Icon/IconCaretDown';
import Badge from './Badge';

interface CollapsibleSectionProps {
    title: string;
    count: number;
    countLabel?: string;
    badgeVariant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark';
    defaultOpen?: boolean;
    children: ReactNode;
    className?: string;
}

// Panel-level accordion — a titled section with a count badge that expands to reveal its
// body (e.g. a DataGrid). Distinct from ModulePermissionsAccordion, which nests many small
// toggle rows rather than one big collapsible body.
const CollapsibleSection = ({ title, count, countLabel, badgeVariant = 'primary', defaultOpen = false, children, className = '' }: CollapsibleSectionProps) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className={`panel !p-0 ${className}`.trim()}>
            <button type="button" onClick={() => setOpen((prev) => !prev)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
                <span className="flex items-center gap-2">
                    <span className="font-semibold">{title}</span>
                    <Badge variant={badgeVariant}>
                        {count} {countLabel || (count === 1 ? 'user' : 'users')}
                    </Badge>
                </span>
                <IconCaretDown className={`h-4 w-4 shrink-0 text-white-dark transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="border-t border-white-light px-4 pb-4 pt-3 dark:border-white/10">{children}</div>}
        </div>
    );
};

export default CollapsibleSection;
