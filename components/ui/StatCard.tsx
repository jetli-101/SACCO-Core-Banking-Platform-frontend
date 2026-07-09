import { ReactNode } from 'react';

interface StatCardProps {
    label: string;
    value: ReactNode;
    helperText?: string;
    icon?: ReactNode;
    iconClassName?: string;
    /** Extra classes on the outer panel — e.g. a colored border to flag an urgent tile. */
    className?: string;
    /** 0–100 — renders a thin fill bar under the value (e.g. active/total share). */
    progress?: number;
    progressClassName?: string;
}

// Small KPI tile used in admin list-page headers (e.g. "Total Records", "Active").
const StatCard = ({ label, value, helperText, icon, iconClassName = 'bg-primary-light text-primary', className = '', progress, progressClassName = 'bg-success' }: StatCardProps) => {
    return (
        <div className={`panel !p-3 ${className}`.trim()}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white-dark">{label}</span>
                {icon && <span className={`grid h-6 w-6 place-content-center rounded-full ${iconClassName}`}>{icon}</span>}
            </div>
            <div className="mt-1 text-xl font-bold">{value}</div>
            {progress !== undefined && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white-light dark:bg-dark/40">
                    <div className={`h-full rounded-full ${progressClassName}`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                </div>
            )}
            {helperText && <p className="mt-0.5 text-xs text-white-dark">{helperText}</p>}
        </div>
    );
};

export default StatCard;
