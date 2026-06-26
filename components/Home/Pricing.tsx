import Button from '@/components/ui/Button';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';

interface Tier {
    name: string;
    members: string;
    price: string;
    period?: string;
    features: string[];
    cta: { label: string; href: string };
    highlighted?: boolean;
}

const tiers: Tier[] = [
    {
        name: 'Starter',
        members: 'Up to 1,000 members',
        price: 'KES 50,000',
        period: '/year',
        features: ['Double-entry ledger', 'M-Pesa integration', 'SASRA auto-reports', 'Member self-service portal', 'Email support'],
        cta: { label: 'Book a Demo', href: '#book-demo' },
    },
    {
        name: 'Growth',
        members: 'Up to 10,000 members',
        price: 'KES 85,000',
        period: '/year',
        features: ['Everything in Starter', 'AI loan underwriting', 'Offline member portal', 'Priority support', 'Multi-branch access'],
        cta: { label: 'Book a Demo', href: '#book-demo' },
        highlighted: true,
    },
    {
        name: 'Enterprise',
        members: 'Up to 50,000 members',
        price: 'KES 120,000',
        period: '/year',
        features: ['Everything in Growth', 'Dedicated success manager', 'Custom SASRA workflows', 'API access', 'Quarterly business reviews'],
        cta: { label: 'Book a Demo', href: '#book-demo' },
    },
    {
        name: 'National',
        members: '50,000+ members',
        price: 'Custom',
        features: ['Everything in Enterprise', 'On-premise / hybrid hosting option', 'Custom integrations', 'SLA-backed uptime', 'White-label member app'],
        cta: { label: 'Contact us', href: '#book-demo' },
    },
];

const Pricing = () => {
    return (
        <section id="pricing" className="bg-white-light/30 py-16 dark:bg-dark dark:bg-opacity-[0.08]">
            <div className="container mx-auto px-5">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-extrabold text-black dark:text-white-light">Simple pricing, real value.</h2>
                    <p className="mt-3 text-white-dark">Less than one staff member’s monthly salary — for the whole year, for the whole SACCO.</p>
                </div>

                <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {tiers.map((tier) => (
                        <div key={tier.name} className={`panel flex flex-col ${tier.highlighted ? 'border-2 border-primary' : ''}`}>
                            {tier.highlighted && <span className="badge mb-2 self-start bg-primary text-white">Most popular</span>}
                            <h3 className="text-lg font-bold text-black dark:text-white-light">{tier.name}</h3>
                            <p className="text-xs text-white-dark">{tier.members}</p>
                            <p className="mt-3">
                                <span className="text-2xl font-extrabold text-primary">{tier.price}</span>
                                {tier.period && <span className="text-sm text-white-dark">{tier.period}</span>}
                            </p>
                            <ul className="mt-4 flex-1 space-y-2">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2 text-sm text-white-dark">
                                        <IconCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button href={tier.cta.href} variant={tier.highlighted ? 'primary' : 'outline-primary'} className="mt-6" fullWidth>
                                {tier.cta.label}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
