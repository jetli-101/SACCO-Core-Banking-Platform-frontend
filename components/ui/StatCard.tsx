import { ReactNode } from 'react';

interface StatCardProps {
    label: string;
    value: ReactNode;
    helperText?: string;
    icon?: ReactNode;
    iconClassName?: string;
}

// Small KPI tile used in admin list-page headers (e.g. "Total Records", "Active").
const StatCard = ({ label, value, helperText, icon, iconClassName = 'bg-primary-light text-primary' }: StatCardProps) => {
    return (
        <div className="panel">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white-dark">{label}</span>
                {icon && <span className={`grid h-7 w-7 place-content-center rounded-full ${iconClassName}`}>{icon}</span>}
            </div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
            {helperText && <p className="mt-1 text-xs text-white-dark">{helperText}</p>}
        </div>
    );
};

export default StatCard;
