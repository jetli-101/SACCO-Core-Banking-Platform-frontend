interface AmountSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    formatValue?: (value: number) => string;
    helperText?: string;
}

// A labeled range input with the live value shown above the track — shared by the amount
// and term steps of the loan application wizard so both use identical interaction/styling.
const AmountSlider = ({ label, value, min, max, step = 1, onChange, formatValue, helperText }: AmountSliderProps) => {
    const display = formatValue ? formatValue(value) : value.toLocaleString();
    const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

    return (
        <div className="w-full">
            <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold">{label}</label>
                <span className="text-lg font-bold text-primary">{display}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white-light outline-none dark:bg-[#1b2e4b]
                    [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
                style={{ background: `linear-gradient(to right, #f97316 ${percent}%, transparent ${percent}%)` }}
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-white-dark">
                <span>{formatValue ? formatValue(min) : min.toLocaleString()}</span>
                {helperText && <span>{helperText}</span>}
                <span>{formatValue ? formatValue(max) : max.toLocaleString()}</span>
            </div>
        </div>
    );
};

export default AmountSlider;
