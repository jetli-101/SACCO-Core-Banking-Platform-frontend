import { FC } from 'react';
import { ICON_REGISTRY } from '@/components/Icon/iconRegistry';
import IconMenuDashboard from '@/components/Icon/Menu/IconMenuDashboard';
import IconMenuUsers from '@/components/Icon/Menu/IconMenuUsers';
import IconMenuMore from '@/components/Icon/Menu/IconMenuMore';
import IconBellBing from '@/components/Icon/IconBellBing';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';
import IconListCheck from '@/components/Icon/IconListCheck';
import IconCloudDownload from '@/components/Icon/IconCloudDownload';
import IconCreditCard from '@/components/Icon/IconCreditCard';
import IconClipboardText from '@/components/Icon/IconClipboardText';
import IconBox from '@/components/Icon/IconBox';
import IconFolder from '@/components/Icon/IconFolder';
import IconFile from '@/components/Icon/IconFile';
import IconSettings from '@/components/Icon/IconSettings';
import IconCalendar from '@/components/Icon/IconCalendar';
import IconChartSquare from '@/components/Icon/IconChartSquare';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import IconClock from '@/components/Icon/IconClock';

type IconComponent = FC<{ className?: string }>;

// Maps the free-text `icon` value an admin types in when registering a module
// (ModuleRegisterController) to an actual icon component. Unknown values fall back
// to a generic icon rather than breaking the sidebar.
const ICON_MAP: Record<string, IconComponent> = {
    dashboard: IconMenuDashboard,
    home: IconMenuDashboard,
    users: IconMenuUsers,
    user: IconMenuUsers,
    members: IconMenuUsers,
    bell: IconBellBing,
    notification: IconBellBing,
    notifications: IconBellBing,
    alert: IconInfoTriangle,
    alerts: IconInfoTriangle,
    warning: IconInfoTriangle,
    task: IconListCheck,
    tasks: IconListCheck,
    'task-tray': IconListCheck,
    checklist: IconListCheck,
    import: IconCloudDownload,
    upload: IconCloudDownload,
    download: IconCloudDownload,
    cloud: IconCloudDownload,
    'credit-card': IconCreditCard,
    card: IconCreditCard,
    loc: IconCreditCard,
    loan: IconCashBanknotes,
    loans: IconCashBanknotes,
    savings: IconCashBanknotes,
    cash: IconCashBanknotes,
    money: IconCashBanknotes,
    clipboard: IconClipboardText,
    contract: IconClipboardText,
    report: IconChartSquare,
    reports: IconChartSquare,
    chart: IconChartSquare,
    box: IconBox,
    supplier: IconBox,
    inventory: IconBox,
    folder: IconFolder,
    file: IconFile,
    document: IconFile,
    settings: IconSettings,
    config: IconSettings,
    calendar: IconCalendar,
    schedule: IconCalendar,
    clock: IconClock,
    time: IconClock,
};

const DEFAULT_ICON: IconComponent = IconMenuMore;

export const getModuleIcon = (icon?: string | null): IconComponent => {
    if (!icon) return DEFAULT_ICON;
    const trimmed = icon.trim();
    // IconPicker stores the exact registry name (e.g. "IconUser") going forward.
    const registryMatch = ICON_REGISTRY.find((entry) => entry.name === trimmed);
    if (registryMatch) return registryMatch.Component;
    // Older/manually-entered modules may use the curated lowercase keywords below, with
    // or without an "icon-"/"icon_" prefix (seen in real seeded data, e.g. "icon-users").
    const normalized = trimmed.toLowerCase().replace(/^icon[-_]/, '');
    return ICON_MAP[normalized] || DEFAULT_ICON;
};
