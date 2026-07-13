import PerfectScrollbar from 'react-perfect-scrollbar';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { toggleSidebar, toggleSidebarCollapsed } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import { useAppDispatch } from '@/store/hooks';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchMyMenu } from '@/store/slices/modules/modulesSlice';
import SidebarMenuItem from './SidebarMenuItem';
import IconMenuDashboard from '@/components/Icon/Menu/IconMenuDashboard';
import IconCaretsDown from '@/components/Icon/IconCaretsDown';

const Sidebar = () => {
    const router = useRouter();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const { menuGroups, menuLoading, menuError } = useSelector((state: IRootState) => state.modules);
    const dispatch = useAppDispatch();

    // Accordion behavior at the top level — shared across every module-type group, so
    // opening a parent module under one section closes whichever was open elsewhere.
    const [openModuleId, setOpenModuleId] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchMyMenu());
    }, [dispatch]);

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        setActiveRoute();
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
    }, [router.pathname]);

    const setActiveRoute = () => {
        let allLinks = document.querySelectorAll('.sidebar ul a.active');
        for (let i = 0; i < allLinks.length; i++) {
            const element = allLinks[i];
            element?.classList.remove('active');
        }
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        selector?.classList.add('active');
    };

    const collapsed = themeConfig.sidebarCollapsed;
    const expandSidebar = () => dispatch(toggleSidebarCollapsed());

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen ${collapsed ? 'w-[80px]' : 'w-[260px]'} shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300 ${
                    semidark ? 'text-white-dark' : ''
                }`}
            >
                <div className="h-full bg-white dark:bg-black">
                    {collapsed ? (
                        <div className="flex justify-center py-3">
                            <button
                                type="button"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary shadow-sm transition hover:bg-primary/20 dark:bg-primary/10 dark:hover:bg-primary/20"
                                onClick={() => dispatch(toggleSidebarCollapsed())}
                                aria-label="Expand sidebar"
                            >
                                <IconCaretsDown className="h-4 w-4 -rotate-90" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between px-4 py-3">
                            <Link href="/dashboard" className="main-logo flex shrink-0 items-center">
                                <span className="inline-flex items-center rounded-md bg-white p-1">
                                    <img className="h-9 w-auto" src="/assets/images/smoothsurf-logo.png" alt="SmoothSurf IT Consulting" />
                                </span>
                            </Link>

                            <button
                                type="button"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary shadow-sm transition hover:bg-primary/20 dark:bg-primary/10 dark:hover:bg-primary/20"
                                onClick={() => dispatch(toggleSidebarCollapsed())}
                                aria-label="Collapse sidebar"
                            >
                                <IconCaretsDown className="h-4 w-4 rotate-90" />
                            </button>
                        </div>
                    )}

                    <PerfectScrollbar className="relative h-[calc(100vh-80px)]">
                        <ul className="relative space-y-0.5 p-4 py-0 font-semibold">
                            <li className="menu nav-item">
                                <Link href="/dashboard" className={`group ${collapsed ? 'justify-center' : ''}`} title={collapsed ? 'Dashboard' : undefined}>
                                    <div className="flex items-center">
                                        <IconMenuDashboard className="shrink-0 group-hover:!text-primary" />
                                        {!collapsed && <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Dashboard</span>}
                                    </div>
                                </Link>
                            </li>

                            {menuLoading && !collapsed && (
                                <li className="mt-4 space-y-2 px-1">
                                    {[1, 2, 3].map((key) => (
                                        <div key={key} className="h-8 animate-pulse rounded-md bg-white/60 dark:bg-dark/20" />
                                    ))}
                                </li>
                            )}

                            {!menuLoading && menuError && !collapsed && (
                                <li className="mt-4 px-1">
                                    <p className="text-xs text-danger">Unable to load menu: {menuError}</p>
                                </li>
                            )}

                            {menuGroups.map((group) => (
                                <li key={group.moduleTypeId} className="border-t border-white-light pt-3 first:border-t-0 first:pt-0 dark:border-white/10">
                                    {!collapsed && (
                                        <h6 className="-mx-4 mb-1 mt-3 px-7 text-xs font-extrabold uppercase tracking-wide text-black/60 first:mt-0 dark:text-white-dark">{group.moduleTypeName}</h6>
                                    )}
                                    {group.modules.map((module) => (
                                        <SidebarMenuItem
                                            key={module.id}
                                            module={module}
                                            collapsed={collapsed}
                                            onExpandSidebar={expandSidebar}
                                            isOpen={openModuleId === module.id}
                                            onToggle={() => setOpenModuleId((prev) => (prev === module.id ? null : module.id))}
                                        />
                                    ))}
                                </li>
                            ))}
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
