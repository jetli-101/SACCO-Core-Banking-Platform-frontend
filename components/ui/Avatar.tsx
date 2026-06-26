interface AvatarProps {
    src?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    status?: 'online' | 'offline' | 'busy' | 'away';
    className?: string;
}

// Written out as full class names (not built with template strings) so Tailwind's
// content scanner can detect and generate them.
const sizeClasses: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
};

const statusClasses: Record<'online' | 'offline' | 'busy' | 'away', string> = {
    online: 'bg-success',
    offline: 'bg-white-dark',
    busy: 'bg-danger',
    away: 'bg-warning',
};

const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

const Avatar = ({ src, name, size = 'md', status, className = '' }: AvatarProps) => {
    return (
        <span className={`relative inline-flex shrink-0 ${className}`.trim()}>
            {src ? (
                <img className={`rounded-full object-cover ${sizeClasses[size]}`} src={src} alt={name ?? 'avatar'} />
            ) : (
                <span className={`grid place-content-center rounded-full bg-primary-light font-semibold text-primary dark:bg-primary dark:text-primary-light ${sizeClasses[size]}`}>
                    {name ? getInitials(name) : ''}
                </span>
            )}
            {status && <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-black ${statusClasses[status]}`} />}
        </span>
    );
};

export default Avatar;
