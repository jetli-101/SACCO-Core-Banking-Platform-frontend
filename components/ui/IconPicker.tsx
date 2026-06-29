import { useEffect, useRef, useState } from 'react';
import { ICON_REGISTRY } from '@/components/Icon/iconRegistry';
import IconCaretDown from '@/components/Icon/IconCaretDown';

interface IconPickerProps {
    id?: string;
    label?: string;
    value: string;
    onChange: (iconName: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

// Searchable icon picker for the module "icon" field — lists every component under
// components/Icon (see iconRegistry.ts) with a live preview, so whatever an admin picks
// is guaranteed to render. Stores the exact component name (e.g. "IconUser"), which
// moduleIcons.ts resolves back to the component for sidebar rendering.
const IconPicker = ({ id, label, value, onChange, placeholder = 'Select…', required, disabled }: IconPickerProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const selected = ICON_REGISTRY.find((entry) => entry.name === value);
    const filtered = search.trim() ? ICON_REGISTRY.filter((entry) => entry.name.toLowerCase().includes(search.trim().toLowerCase())) : ICON_REGISTRY;

    return (
        <div className="w-full" ref={containerRef}>
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    id={id}
                    type="button"
                    disabled={disabled}
                    className="form-input flex items-center justify-between disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => setOpen((isOpen) => !isOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                >
                    <span className="flex items-center gap-2">
                        {selected ? (
                            <>
                                <selected.Component className="h-4 w-4 text-primary" />
                                <span>{selected.name}</span>
                            </>
                        ) : (
                            <span className="text-white-dark">{placeholder}</span>
                        )}
                    </span>
                    <IconCaretDown className="h-4 w-4 shrink-0 text-white-dark" />
                </button>
                {required && <input tabIndex={-1} className="sr-only" required value={value} onChange={() => undefined} aria-hidden />}

                {open && (
                    <div className="absolute z-20 mt-1 w-full rounded-md border border-white-light bg-white shadow-lg dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                        <div className="border-b border-white-light p-2 dark:border-[#253b5c]">
                            <input
                                type="text"
                                autoFocus
                                className="form-input form-input-sm"
                                placeholder="Search icons..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <ul className="max-h-60 overflow-y-auto p-1" role="listbox">
                            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-white-dark">No icons match &quot;{search}&quot;</li>}
                            {filtered.map((entry) => (
                                <li key={entry.name}>
                                    <button
                                        type="button"
                                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-primary-light hover:text-primary dark:hover:bg-primary/10 ${
                                            entry.name === value ? 'bg-primary-light text-primary dark:bg-primary/10' : ''
                                        }`}
                                        onClick={() => {
                                            onChange(entry.name);
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                    >
                                        <entry.Component className="h-4 w-4 shrink-0" />
                                        {entry.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IconPicker;
