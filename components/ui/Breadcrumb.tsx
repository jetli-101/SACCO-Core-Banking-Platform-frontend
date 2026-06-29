import { ReactNode } from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
    label: ReactNode;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

// Single source of truth for the "Dashboard / Section / Current page" trail used at the
// top of every dashboard page — import this instead of hand-rolling the <ul>/<Link> markup.
const Breadcrumb = ({ items }: BreadcrumbProps) => (
    <ul className="flex space-x-2 rtl:space-x-reverse">
        {items.map((item, index) => (
            <li key={index} className={index > 0 ? "before:content-['/'] ltr:before:mr-2 rtl:before:ml-2" : undefined}>
                {item.href ? (
                    <Link href={item.href} className="text-primary hover:underline">
                        {item.label}
                    </Link>
                ) : (
                    <span>{item.label}</span>
                )}
            </li>
        ))}
    </ul>
);

export default Breadcrumb;
