export interface TabItem {
    key: string;
    label: string;
}

interface TabsProps {
    items: TabItem[];
    active: string;
    onChange: (key: string) => void;
    // 'underline' is the default list-page style; 'boxed' is the bordered-pill style used
    // on record detail pages (e.g. Personal Information, Member Directory detail).
    variant?: 'underline' | 'boxed';
}

const Tabs = ({ items, active, onChange, variant = 'underline' }: TabsProps) => {
    if (variant === 'boxed') {
        return (
            <div className="mb-5 flex flex-wrap gap-2 border-b border-white-light pb-4 dark:border-white/10">
                {items.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => onChange(item.key)}
                        className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                            active === item.key
                                ? 'border-primary bg-primary-light text-primary dark:bg-primary/20'
                                : 'border-white-light text-white-dark hover:border-primary/50 hover:text-primary dark:border-white/10'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="mb-5 flex gap-6 border-b border-white-light dark:border-white/10">
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    onClick={() => onChange(item.key)}
                    className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                        active === item.key ? 'border-primary text-primary' : 'border-transparent text-white-dark hover:text-dark dark:hover:text-white-light'
                    }`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
};

export default Tabs;
