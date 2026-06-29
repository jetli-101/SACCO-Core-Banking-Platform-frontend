import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useAppSelector } from '@/store/hooks';
import IconMenuDashboard from '@/components/Icon/Menu/IconMenuDashboard';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';
import IconBellBing from '@/components/Icon/IconBellBing';
import IconListCheck from '@/components/Icon/IconListCheck';
import IconMenuUsers from '@/components/Icon/Menu/IconMenuUsers';
import IconClipboardText from '@/components/Icon/IconClipboardText';
import IconBox from '@/components/Icon/IconBox';

const quickAccessItems = [
    { label: 'Dashboard', href: '/dashboard', icon: IconMenuDashboard },
    { label: 'Alert', href: '/dashboard/alert', icon: IconInfoTriangle },
    { label: 'Notifications', href: '/dashboard/notifications', icon: IconBellBing },
    { label: 'Task Tray', href: '/dashboard/task-tray', icon: IconListCheck },
    { label: 'Unapproved Users', href: '/dashboard/users/unapproved', icon: IconMenuUsers },
    { label: 'Contract Import', href: '/dashboard/data-import/contracts', icon: IconClipboardText },
    { label: 'Supplier Import', href: '/dashboard/data-import/suppliers', icon: IconBox },
];

const Dashboard = () => {
    const dispatch = useDispatch();
    const user = useAppSelector((state) => state.auth.user);

    useEffect(() => {
        dispatch(setPageTitle('Dashboard'));
    });

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <span className="text-primary">Dashboard</span>
                </li>
            </ul>

            <div className="pt-5">
                <div className="rounded-md bg-primary-light p-8 text-center dark:bg-primary/10 sm:p-12">
                    <h1 className="text-2xl font-extrabold text-black dark:text-white-light sm:text-4xl">
                        Welcome to SmoothSurf Sacco, {user?.username || 'Member'}!
                    </h1>
                    <p className="mt-2 text-white-dark">Electronic Member &amp; Savings Management System</p>
                </div>

                <div className="mt-5 rounded-md bg-primary-light p-6 dark:bg-primary/10">
                    <h2 className="text-center text-lg font-extrabold uppercase tracking-wide text-black dark:text-white-light">Quick Access Menu</h2>

                    <div className="mt-6 flex gap-6 overflow-x-auto pb-2">
                        {quickAccessItems.map((item) => (
                            <Link key={item.label} href={item.href} className="flex shrink-0 flex-col items-center gap-2 text-center hover:text-primary">
                                <span className="grid h-12 w-12 place-content-center rounded-full bg-white text-black shadow-sm dark:bg-black dark:text-white-light">
                                    <item.icon className="h-6 w-6" />
                                </span>
                                <span className="w-20 text-sm font-semibold text-black dark:text-white-light">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
