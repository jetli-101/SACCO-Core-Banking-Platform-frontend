import { ReactNode } from 'react';

interface StatCardProps {
    label: string;
    value: ReactNode;
    helperText?: string;
    icon?: ReactNode;
    iconClassName?: string;
    /** Extra classes on the outer panel — e.g. a colored border to flag an urgent tile. */
    className?: string;
}

// Small KPI tile used in admin list-page headers (e.g. "Total Records", "Active").
const StatCard = ({ label, value, helperText, icon, iconClassName = 'bg-primary-light text-primary', className = '' }: StatCardProps) => {
    return (
        <div className={`panel !p-3 ${className}`.trim()}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white-dark">{label}</span>
                {icon && <span className={`grid h-6 w-6 place-content-center rounded-full ${iconClassName}`}>{icon}</span>}
            </div>
            <div className="mt-1 text-xl font-bold">{value}</div>
            {helperText && <p className="mt-0.5 text-xs text-white-dark">{helperText}</p>}
        </div>
    );
};

export default StatCard;
