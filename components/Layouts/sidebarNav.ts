import { FC } from 'react';
import IconMenuUsers from '@/components/Icon/Menu/IconMenuUsers';
import IconMenuPages from '@/components/Icon/Menu/IconMenuPages';
import IconMenuAuthentication from '@/components/Icon/Menu/IconMenuAuthentication';

export interface SidebarLink {
    label: string;
    href: string;
    external?: boolean;
}

export interface SidebarSection {
    key: string;
    label: string;
    icon: FC<{ className?: string }>;
    links: SidebarLink[];
}

// Each section maps to a folder under pages/dashboard/. Add a new section (or links
// to an existing one) as soon as its folder exists — Sidebar.tsx just renders this list.
export const sidebarSections: SidebarSection[] = [
    {
        key: 'users',
        label: 'users',
        icon: IconMenuUsers,
        links: [
            { label: 'profile', href: '/users/profile' },
            { label: 'account_settings', href: '/users/user-account-settings' },
        ],
    },
    {
        key: 'page',
        label: 'pages',
        icon: IconMenuPages,
        links: [
            { label: '404', href: '/pages/error404', external: true },
            { label: '500', href: '/pages/error500', external: true },
            { label: '503', href: '/pages/error503', external: true },
            { label: 'maintenence', href: '/pages/maintenence', external: true },
        ],
    },
    {
        key: 'auth',
        label: 'authentication',
        icon: IconMenuAuthentication,
        links: [
            { label: 'login_boxed', href: '/auth/boxed-signin', external: true },
            { label: 'register_boxed', href: '/auth/boxed-signup', external: true },
            { label: 'unlock_boxed', href: '/auth/boxed-lockscreen', external: true },
            { label: 'recover_id_boxed', href: '/auth/boxed-password-reset', external: true },
            { label: 'login_cover', href: '/auth/cover-login', external: true },
            { label: 'register_cover', href: '/auth/cover-register', external: true },
            { label: 'unlock_cover', href: '/auth/cover-lockscreen', external: true },
            { label: 'recover_id_cover', href: '/auth/cover-password-reset', external: true },
        ],
    },
];
