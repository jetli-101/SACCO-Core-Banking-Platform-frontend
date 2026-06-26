import IconClipboardText from '@/components/Icon/IconClipboardText';
import IconPhoneCall from '@/components/Icon/IconPhoneCall';
import IconBolt from '@/components/Icon/IconBolt';
import IconFile from '@/components/Icon/IconFile';
import IconCloudDownload from '@/components/Icon/IconCloudDownload';
import IconRefresh from '@/components/Icon/IconRefresh';

const features = [
    {
        icon: IconClipboardText,
        name: 'Double-Entry Ledger',
        copy: 'Every transaction balances automatically, so your books are always audit-ready. No more month-end reconciliation marathons.',
    },
    {
        icon: IconPhoneCall,
        name: 'M-Pesa Integration',
        copy: 'Members deposit, repay loans, and withdraw straight from M-Pesa. Money lands in the right account instantly, with no manual entry.',
    },
    {
        icon: IconBolt,
        name: 'AI Loan Underwriting',
        copy: 'Every application gets a risk score and recommendation in seconds, so your credit committee approves good loans faster — and catches bad ones earlier.',
    },
    {
        icon: IconFile,
        name: 'SASRA Auto-Reports',
        copy: 'All six prudential returns generate themselves from your live ledger. Review, sign off, submit — done in one sitting, not one fortnight.',
    },
    {
        icon: IconCloudDownload,
        name: 'Offline Member Portal',
        copy: 'Members check balances and apply for loans even on a patchy connection. What they do offline syncs the moment signal returns.',
    },
    {
        icon: IconRefresh,
        name: 'Data Migration from Excel',
        copy: 'We move your historical records in, reconcile every shilling against your old books, and only switch you over once your CFO signs off.',
    },
];

const Solutions = () => {
    return (
        <section id="solution" className="bg-white py-16 dark:bg-[#0e1726]">
            <div className="container mx-auto px-5">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-extrabold text-black dark:text-white-light">One platform. Every problem solved.</h2>
                    <p className="mt-3 text-white-dark">Six pillars that take you from spreadsheets to a real core banking system.</p>
                </div>

                <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div key={feature.name} className="panel">
                            <span className="grid h-12 w-12 place-content-center rounded-full bg-primary-light text-primary dark:bg-primary dark:text-primary-light">
                                <feature.icon className="h-6 w-6" />
                            </span>
                            <h3 className="mt-4 text-lg font-bold text-black dark:text-white-light">{feature.name}</h3>
                            <p className="mt-2 text-sm text-white-dark">{feature.copy}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Solutions;
