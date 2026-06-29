import { useEffect, useRef, useState } from 'react';
import IconCalendar from '@/components/Icon/IconCalendar';

export interface DateInputProps {
    id?: string;
    label?: string;
    error?: string;
    helperText?: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'date' | 'datetime';
    required?: boolean;
    placeholder?: string;
    minDate?: string;
    maxDate?: string;
    disabled?: boolean;
    className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n: number) => String(n).padStart(2, '0');

const parseDatePart = (value: string) => {
    const [datePart] = value.split('T');
    const [year, month, day] = (datePart || '').split('-').map(Number);
    if (!year || !month || !day) return null;
    return { year, month: month - 1, day };
};

const parseTimePart = (value: string) => {
    const [, timePart] = value.split('T');
    const [hour, minute] = (timePart || '00:00').split(':').map(Number);
    return { hour: hour || 0, minute: minute || 0 };
};

const toComparableNumber = (year: number, month: number, day: number) => year * 10000 + month * 100 + day;

const formatDisplay = (value: string, type: 'date' | 'datetime') => {
    const datePart = parseDatePart(value);
    if (!datePart) return '';
    const formatted = `${pad(datePart.day)} ${MONTHS[datePart.month].slice(0, 3)} ${datePart.year}`;
    if (type !== 'datetime') return formatted;
    const { hour, minute } = parseTimePart(value);
    return `${formatted}, ${pad(hour)}:${pad(minute)}`;
};

// Drop-in replacement for native <input type="date"|"datetime-local"> built without a
// third-party picker library. Value/onChange use the same 'YYYY-MM-DD' /
// 'YYYY-MM-DDTHH:mm' format the native inputs produce, so swapping this in anywhere
// in the app doesn't change what's stored or sent to the backend.
const DateInput = ({ id, label, error, helperText, value, onChange, type = 'date', required, placeholder, minDate, maxDate, disabled, className = '' }: DateInputProps) => {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<'days' | 'years'>('days');
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = parseDatePart(value);
    const time = parseTimePart(value);
    const today = new Date();

    const [viewYear, setViewYear] = useState(selected?.year ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(selected?.month ?? today.getMonth());
    const [yearPageStart, setYearPageStart] = useState(Math.floor((selected?.year ?? today.getFullYear()) / 12) * 12);

    useEffect(() => {
        if (open) {
            const year = selected?.year ?? today.getFullYear();
            setViewYear(year);
            setViewMonth(selected?.month ?? today.getMonth());
            setYearPageStart(Math.floor(year / 12) * 12);
            setView('days');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const minBound = minDate ? parseDatePart(minDate) : null;
    const maxBound = maxDate ? parseDatePart(maxDate) : null;

    const isDisabledDay = (year: number, month: number, day: number) => {
        const value = toComparableNumber(year, month, day);
        if (minBound && value < toComparableNumber(minBound.year, minBound.month, minBound.day)) return true;
        if (maxBound && value > toComparableNumber(maxBound.year, maxBound.month, maxBound.day)) return true;
        return false;
    };

    const commitDate = (year: number, month: number, day: number) => {
        const datePart = `${year}-${pad(month + 1)}-${pad(day)}`;
        const next = type === 'datetime' ? `${datePart}T${pad(time.hour)}:${pad(time.minute)}` : datePart;
        onChange(next);
        if (type !== 'datetime') setOpen(false);
    };

    const commitTime = (hour: number, minute: number) => {
        const datePart = selected ? `${selected.year}-${pad(selected.month + 1)}-${pad(selected.day)}` : `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
        onChange(`${datePart}T${pad(hour)}:${pad(minute)}`);
    };

    const goToMonth = (offset: number) => {
        let nextMonth = viewMonth + offset;
        let nextYear = viewYear;
        if (nextMonth < 0) {
            nextMonth = 11;
            nextYear -= 1;
        } else if (nextMonth > 11) {
            nextMonth = 0;
            nextYear += 1;
        }
        setViewMonth(nextMonth);
        setViewYear(nextYear);
    };

    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<number | null> = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    return (
        <div className={`w-full ${className}`.trim()} ref={containerRef}>
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    id={id}
                    type="text"
                    readOnly
                    required={required}
                    disabled={disabled}
                    value={formatDisplay(value, type)}
                    placeholder={placeholder || (type === 'datetime' ? 'Select date & time' : 'Select date')}
                    onClick={() => !disabled && setOpen((isOpen) => !isOpen)}
                    className={`form-input cursor-pointer pr-9 ${error ? '!border-danger' : ''}`}
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-white-dark">
                    <IconCalendar className="h-4.5 w-4.5" />
                </span>

                {open && (
                    <div className="absolute z-20 mt-1 w-[280px] rounded-md border border-white-light bg-white p-3 shadow-lg dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                        {view === 'days' ? (
                            <div className="flex items-center justify-between">
                                <button type="button" className="rounded p-1 hover:bg-white-light/60 dark:hover:bg-dark/40" onClick={() => goToMonth(-1)} aria-label="Previous month">
                                    «
                                </button>
                                <span className="text-sm font-semibold">
                                    {MONTHS[viewMonth]}{' '}
                                    <button
                                        type="button"
                                        className="rounded px-1.5 py-0.5 hover:bg-primary/10 hover:text-primary"
                                        onClick={() => {
                                            setYearPageStart(Math.floor(viewYear / 12) * 12);
                                            setView('years');
                                        }}
                                    >
                                        {viewYear}
                                    </button>
                                </span>
                                <button type="button" className="rounded p-1 hover:bg-white-light/60 dark:hover:bg-dark/40" onClick={() => goToMonth(1)} aria-label="Next month">
                                    »
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    className="rounded p-1 hover:bg-white-light/60 dark:hover:bg-dark/40"
                                    onClick={() => setYearPageStart((start) => start - 12)}
                                    aria-label="Previous years"
                                >
                                    «
                                </button>
                                <span className="text-sm font-semibold">
                                    {yearPageStart} – {yearPageStart + 11}
                                </span>
                                <button
                                    type="button"
                                    className="rounded p-1 hover:bg-white-light/60 dark:hover:bg-dark/40"
                                    onClick={() => setYearPageStart((start) => start + 12)}
                                    aria-label="Next years"
                                >
                                    »
                                </button>
                            </div>
                        )}

                        {view === 'years' ? (
                            <div className="mt-2 grid grid-cols-3 gap-1 text-center text-sm">
                                {Array.from({ length: 12 }, (_, i) => yearPageStart + i).map((year) => (
                                    <button
                                        key={year}
                                        type="button"
                                        onClick={() => {
                                            setViewYear(year);
                                            setView('days');
                                        }}
                                        className={`rounded p-1.5 hover:bg-primary/10 ${
                                            year === viewYear ? 'bg-primary text-white hover:bg-primary' : ''
                                        } ${year === today.getFullYear() && year !== viewYear ? 'font-bold text-primary' : ''}`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs text-white-dark">
                                    {WEEKDAYS.map((day) => (
                                        <span key={day}>{day}</span>
                                    ))}
                                </div>

                                <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm">
                                    {cells.map((day, index) => {
                                        if (!day) return <span key={`blank-${index}`} />;
                                        const isSelected = !!selected && selected.year === viewYear && selected.month === viewMonth && selected.day === day;
                                        const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
                                        const disabledDay = isDisabledDay(viewYear, viewMonth, day);
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                disabled={disabledDay}
                                                onClick={() => commitDate(viewYear, viewMonth, day)}
                                                className={`rounded-full p-1.5 hover:bg-primary/10 ${isSelected ? 'bg-primary text-white hover:bg-primary' : ''} ${
                                                    isToday && !isSelected ? 'font-bold text-primary' : ''
                                                } ${disabledDay ? 'cursor-not-allowed opacity-30 hover:bg-transparent' : ''}`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {view === 'days' && type === 'datetime' && (
                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-white-light pt-3 dark:border-[#253b5c]">
                                <div className="flex items-center gap-1">
                                    <select className="form-select form-select-sm" value={time.hour} onChange={(e) => commitTime(Number(e.target.value), time.minute)}>
                                        {Array.from({ length: 24 }, (_, hour) => (
                                            <option key={hour} value={hour}>
                                                {pad(hour)}
                                            </option>
                                        ))}
                                    </select>
                                    <span>:</span>
                                    <select className="form-select form-select-sm" value={time.minute} onChange={(e) => commitTime(time.hour, Number(e.target.value))}>
                                        {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                            <option key={minute} value={minute}>
                                                {pad(minute)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {error ? <div className="mt-1 text-xs text-danger">{error}</div> : helperText ? <div className="mt-1 text-xs text-white-dark">{helperText}</div> : null}
        </div>
    );
};

export default DateInput;
