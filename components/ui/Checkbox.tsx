import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: ReactNode;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ label, id, className = '', ...rest }, ref) => {
    return (
        <label htmlFor={id} className="flex items-center gap-2">
            <input ref={ref} type="checkbox" id={id} className={`form-checkbox ${className}`.trim()} {...rest} />
            <span className="text-sm font-semibold">{label}</span>
        </label>
    );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
