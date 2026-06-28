import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import IconMenu from '@/components/Icon/IconMenu';
import IconX from '@/components/Icon/IconX';

const navLinks = [
    { label: 'Features', href: '#solution' },
    { label: 'AI Underwriting', href: '#ai-demo' },
    { label: 'Compliance', href: '#compliance' },
    { label: 'Pricing', href: '#pricing' },
];

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header className={`sticky top-0 z-50 w-full transition-all ${scrolled ? 'bg-white/90 shadow-sm backdrop-blur dark:bg-[#060818]/90' : 'bg-transparent'}`}>
            <nav className="container mx-auto flex items-center justify-between px-5 py-4">
                <Link href="/" className="flex shrink-0 items-center">
                    <span className="inline-flex items-center rounded-md bg-white p-1">
                        <img src="/assets/images/smoothsurf-logo.png" alt="SmoothSurf IT Consulting" className="h-9 w-auto" />
                    </span>
                </Link>

                <ul className="hidden items-center gap-8 font-semibold text-black/70 dark:text-white-dark md:flex">
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <a href={link.href} className="transition hover:text-primary">
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>

                <div className="hidden items-center gap-3 md:flex">
                    <Button href="/auth/login" variant="outline-primary" size="sm">
                        Login
                    </Button>
                    <Button href="/auth/register" size="sm">
                        Register
                    </Button>
                </div>

                <button type="button" className="text-black dark:text-white-light md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle menu">
                    {mobileOpen ? <IconX /> : <IconMenu />}
                </button>
            </nav>

            {mobileOpen && (
                <div className="border-t border-white-light bg-white px-5 pb-5 dark:border-white/10 dark:bg-[#060818] md:hidden">
                    <ul className="space-y-3 py-4 font-semibold text-black/70 dark:text-white-dark">
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <a href={link.href} onClick={() => setMobileOpen(false)} className="block">
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-3">
                        <Button href="/auth/login" variant="outline-primary" size="sm" fullWidth>
                            Login
                        </Button>
                        <Button href="/auth/register" size="sm" fullWidth>
                            Register
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
