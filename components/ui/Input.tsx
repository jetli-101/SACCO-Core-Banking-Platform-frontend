import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    helperText?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'form-input-sm',
    md: '',
    lg: 'form-input-lg',
};

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, helperText, size = 'md', id, className = '', ...rest }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
                    {label}
                </label>
            )}
            <input ref={ref} id={id} className={`form-input ${sizeClasses[size]} ${error ? '!border-danger' : ''} ${className}`.trim()} {...rest} />
            {error ? <div className="mt-1 text-xs text-danger">{error}</div> : helperText ? <div className="mt-1 text-xs text-white-dark">{helperText}</div> : null}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
