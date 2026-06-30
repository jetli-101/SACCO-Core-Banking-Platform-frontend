import { ReactNode, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export interface BreadcrumbItem {
    label: ReactNode;
    href?: string;
}

interface BreadcrumbProps {
    // Full manual override — only needed when a page's trail can't be expressed by its
    // own route (rare). Prefer trailingLabel for the common case below.
    items?: BreadcrumbItem[];
    // Swaps the label of the last path segment — e.g. a record's name instead of its
    // raw [id] value on a detail page (pages/dashboard/admin/roles/[id]/index.tsx).
    trailingLabel?: ReactNode;
}

const humanize = (segment: string) =>
    segment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

const isDynamicSegment = (segment: string) => segment.startsWith('[') && segment.endsWith(']');

// Derives "Dashboard / Section / Page" straight from the current route — which mirrors
// the pages/dashboard/** folder structure — instead of every page hand-typing its own
// labels. Renaming or moving a page's folder updates the breadcrumb everywhere for free.
const Breadcrumb = ({ items, trailingLabel }: BreadcrumbProps) => {
    const router = useRouter();

    const autoItems = useMemo<BreadcrumbItem[]>(() => {
        const routeSegments = router.pathname.split('/').filter(Boolean); // e.g. ['dashboard','admin','roles','[id]']
        const urlSegments = router.asPath.split('?')[0].split('/').filter(Boolean); // e.g. ['dashboard','admin','roles','abc123']

        const crumbs: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/dashboard' }];

        let href = '';
        routeSegments.forEach((segment, index) => {
            href += `/${urlSegments[index] ?? segment}`;
            if (segment === 'dashboard') return; // already represented by the root crumb above

            const isLast = index === routeSegments.length - 1;
            const label = isLast && trailingLabel !== undefined ? trailingLabel : isDynamicSegment(segment) ? urlSegments[index] ?? segment : humanize(segment);

            crumbs.push({ label, href: isLast ? undefined : href });
        });

        return crumbs;
    }, [router.pathname, router.asPath, trailingLabel]);

    const finalItems = items ?? autoItems;

    return (
        <ul className="flex space-x-2 rtl:space-x-reverse">
            {finalItems.map((item, index) => (
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
};

export default Breadcrumb;
