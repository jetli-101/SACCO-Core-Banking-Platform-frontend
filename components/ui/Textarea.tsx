import { forwardRef, TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, helperText, id, className = '', rows = 4, ...rest }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
                    {label}
                </label>
            )}
            <textarea ref={ref} id={id} rows={rows} className={`form-textarea ${error ? '!border-danger' : ''} ${className}`.trim()} {...rest} />
            {error ? <div className="mt-1 text-xs text-danger">{error}</div> : helperText ? <div className="mt-1 text-xs text-white-dark">{helperText}</div> : null}
        </div>
    );
});

Textarea.displayName = 'Textarea';

export default Textarea;
