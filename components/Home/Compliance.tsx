import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconFile from '@/components/Icon/IconFile';

const returns = [
    'Statement of Financial Position',
    'Statement of Comprehensive Income',
    'Liquidity Statement',
    'Capital Adequacy Return',
    'Large Exposures Return',
    'Asset Quality & Provisioning Return',
];

const calendar = [
    { quarter: 'Q1', deadline: '31 Jan', status: 'Auto-generated' },
    { quarter: 'Q2', deadline: '30 Apr', status: 'Auto-generated' },
    { quarter: 'Q3', deadline: '31 Jul', status: 'Auto-generated' },
    { quarter: 'Q4', deadline: '31 Oct', status: 'Auto-generated' },
];

const Compliance = () => {
    return (
        <section id="compliance" className="bg-white py-16 dark:bg-[#0e1726]">
            <div className="container mx-auto px-5">
                <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
                    <div>
                        <span className="badge badge-outline-success !text-xs uppercase tracking-wide">SASRA Compliance</span>
                        <h2 className="mt-3 text-3xl font-extrabold text-black dark:text-white-light">Your quarterly returns, ready in one click.</h2>
                        <p className="mt-3 text-white-dark">
                            SmartSurf Sacco auto-generates every prudential return SASRA requires, straight from your live ledger — no re-typing numbers, no last-minute scramble.
                        </p>

                        <ul className="mt-6 space-y-2">
                            {returns.map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm font-medium text-black dark:text-white-light">
                                    <IconCircleCheck className="h-5 w-5 shrink-0 text-success" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 grid grid-cols-4 gap-2">
                            {calendar.map((entry) => (
                                <div key={entry.quarter} className="rounded-md border border-dashed border-white-light p-2 text-center dark:border-white/10">
                                    <p className="text-xs font-bold text-primary">{entry.quarter}</p>
                                    <p className="text-xs text-white-dark">{entry.deadline}</p>
                                    <p className="mt-1 text-[10px] font-semibold text-success">{entry.status}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* sample SASRA return PDF mock */}
                    <div className="mx-auto w-full max-w-[320px] rounded-lg border border-white-light bg-white p-5 shadow-xl dark:border-white/10 dark:bg-black">
                        <div className="flex items-center gap-2 border-b border-white-light pb-3 dark:border-white/10">
                            <IconFile className="h-6 w-6 text-danger" />
                            <div>
                                <p className="text-sm font-bold text-black dark:text-white-light">Liquidity_Statement_Q2.pdf</p>
                                <p className="text-xs text-white-dark">Generated automatically</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="h-2 w-3/4 rounded bg-white-light dark:bg-[#1b2e4b]" />
                            <div className="h-2 w-full rounded bg-white-light dark:bg-[#1b2e4b]" />
                            <div className="h-2 w-5/6 rounded bg-white-light dark:bg-[#1b2e4b]" />
                            <div className="h-2 w-2/3 rounded bg-white-light dark:bg-[#1b2e4b]" />
                            <div className="mt-4 h-20 rounded bg-primary-light dark:bg-primary/10" />
                            <div className="h-2 w-1/2 rounded bg-white-light dark:bg-[#1b2e4b]" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Compliance;
