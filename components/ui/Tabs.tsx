export interface TabItem {
    key: string;
    label: string;
}

interface TabsProps {
    items: TabItem[];
    active: string;
    onChange: (key: string) => void;
}

const Tabs = ({ items, active, onChange }: TabsProps) => {
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
