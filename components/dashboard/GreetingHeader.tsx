import Badge from '@/components/ui/Badge';

interface GreetingHeaderProps {
    username?: string;
    roleLabel: string;
    roleVariant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark';
    subtitle?: string;
}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

const today = () => new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const GreetingHeader = ({ username, roleLabel, roleVariant = 'secondary', subtitle = 'Electronic Member & Savings Management System' }: GreetingHeaderProps) => (
    <div className="rounded-md bg-primary-light p-4 dark:bg-primary/10 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <h1 className="text-xl font-extrabold text-black dark:text-white-light sm:text-2xl">
                    {getGreeting()}, {username || 'there'}!
                </h1>
                <p className="mt-1 text-white-dark">{subtitle}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
                <Badge variant={roleVariant}>{roleLabel}</Badge>
                <span className="text-xs text-white-dark">{today()}</span>
            </div>
        </div>
    </div>
);

export default GreetingHeader;
