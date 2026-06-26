import Link from 'next/link';
import IconMapPin from '@/components/Icon/IconMapPin';
import IconMail from '@/components/Icon/IconMail';
import IconPhone from '@/components/Icon/IconPhone';

const supportTiers = [
    { name: 'Starter & Growth', detail: 'Email support, 1 business day response' },
    { name: 'Enterprise', detail: 'Priority support, dedicated success manager' },
    { name: 'National', detail: 'SLA-backed uptime, 24/7 escalation line' },
];

const legalLinks = ['Technical Documentation', 'Privacy Policy', 'SASRA Compliance Statement'];

const Footer = () => {
    return (
        <footer className="bg-[#0e1726] py-12 text-white-dark">
            <div className="container mx-auto grid gap-10 px-5 md:grid-cols-3">
                <div>
                    <div className="flex items-center gap-2">
                        <img src="/assets/images/logo.svg" alt="logo" className="w-8" />
                        <span className="text-lg font-extrabold text-white">
                            Smart<span className="text-primary">Surf</span> Sacco
                        </span>
                    </div>
                    <p className="mt-3 max-w-xs text-sm">Cloud core banking built for Kenyan SACCOs — compliance, M-Pesa, and AI underwriting in one platform.</p>
                    <ul className="mt-4 space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <IconMapPin className="h-4 w-4 shrink-0" />
                            Westlands, Nairobi, Kenya
                        </li>
                        <li className="flex items-center gap-2">
                            <IconMail className="h-4 w-4 shrink-0" />
                            hello@smartsurfsacco.co.ke
                        </li>
                        <li className="flex items-center gap-2">
                            <IconPhone className="h-4 w-4 shrink-0" />
                            +254 700 000 000
                        </li>
                    </ul>
                </div>

                <div>
                    <p className="font-semibold text-white">Support</p>
                    <ul className="mt-3 space-y-3 text-sm">
                        {supportTiers.map((tier) => (
                            <li key={tier.name}>
                                <p className="font-medium text-white-light">{tier.name}</p>
                                <p>{tier.detail}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="font-semibold text-white">Resources</p>
                    <ul className="mt-3 space-y-2 text-sm">
                        {legalLinks.map((link) => (
                            <li key={link}>
                                <Link href="#" className="hover:text-white">
                                    {link}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="container mx-auto mt-10 border-t border-white/10 px-5 pt-6 text-center text-xs">© {new Date().getFullYear()} SmartSurf Sacco. All rights reserved.</div>
        </footer>
    );
};

export default Footer;
