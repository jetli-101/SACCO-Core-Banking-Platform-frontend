import { PropsWithChildren, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { IRootState } from './store';
import { toggleRTL, toggleTheme, toggleLocale, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark } from './store/themeConfigSlice';
import { hydrateAuth, logout } from './store/slices/auth/authSlice';
import { SESSION_EXPIRED_EVENT } from './urlhelper/apiClient';
import ToastContainer from './components/ui/ToastContainer';

function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const router = useRouter();
    const { i18n } = useTranslation();

    useEffect(() => {
        dispatch(hydrateAuth());
    }, [dispatch]);

    useEffect(() => {
        // No accessToken at all (never logged in, a previous session was already
        // cleared, or it was wiped in another tab) — keep dashboard routes from
        // rendering a shell where every request fails silently; send the user
        // straight to login instead. Re-checked on every client-side navigation,
        // not just the initial load.
        if (router.pathname.startsWith('/dashboard') && !localStorage.getItem('accessToken')) {
            router.replace('/auth/login');
        }
    }, [router.pathname]);

    useEffect(() => {
        const handleSessionExpired = () => {
            dispatch(logout());
            if (!router.pathname.startsWith('/auth')) {
                router.replace('/auth/login');
            }
        };
        window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    }, [dispatch, router]);

    useEffect(() => {
        // This app never registers a service worker. If one is still active on this
        // origin (e.g. left over from a different project that previously ran on the
        // same port), it can intercept requests and redirect/serve stale cached pages.
        // Unregister anything found so a fresh load always hits this app's server.
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                registrations.forEach((registration) => registration.unregister());
            });
        }
        if ('caches' in window) {
            caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
        }
    }, []);

    useEffect(() => {
        dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
        dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
        dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
        dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
        dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
        dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
        dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
        // locale
        const locale = localStorage.getItem('i18nextLng') || themeConfig.locale;
        dispatch(toggleLocale(locale));
        i18n.changeLanguage(locale);
    }, [dispatch, themeConfig.theme, themeConfig.menu, themeConfig.layout, themeConfig.rtlClass, themeConfig.animation, themeConfig.navbar, themeConfig.locale, themeConfig.semidark]);

    return (
        <div
            className={`${(themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${
                themeConfig.rtlClass
            } main-section relative font-nunito text-sm font-normal antialiased`}
        >
            {children}
            <ToastContainer />
        </div>
    );
}

export default App;
