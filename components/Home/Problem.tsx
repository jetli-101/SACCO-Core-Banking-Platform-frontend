import IconXCircle from '@/components/Icon/IconXCircle';
import IconClock from '@/components/Icon/IconClock';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';

const problems = [
    {
        icon: IconXCircle,
        number: '01',
        title: 'Spreadsheet errors cost you money',
        copy: 'One broken formula and a member’s balance is wrong — or your books don’t reconcile at month-end. Excel was never built to be a ledger.',
    },
    {
        icon: IconClock,
        number: '02',
        title: 'SASRA reports take weeks',
        copy: 'Your finance team spends days re-entering numbers across six different prudential returns, every single quarter, by hand.',
    },
    {
        icon: IconCashBanknotes,
        number: '03',
        title: 'Loan delays push members to shylocks',
        copy: 'If your loan committee takes two weeks to approve a loan, your members go to a shylock today and pay 20% interest by Friday.',
    },
];

const Problem = () => {
    return (
        <section className="bg-white-light/30 py-16 dark:bg-dark dark:bg-opacity-[0.08]">
            <div className="container mx-auto px-5">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-extrabold text-black dark:text-white-light">You already know the problem.</h2>
                    <p className="mt-3 text-white-dark">It’s the same one every SACCO board meeting comes back to — we hear it from finance managers every week.</p>
                </div>

                <div className="mx-auto mt-10 max-w-3xl divide-y divide-white-light overflow-hidden rounded-xl bg-white shadow dark:divide-white/10 dark:bg-black">
                    {problems.map((problem) => (
                        <div key={problem.title} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                            <span className="select-none text-5xl font-black text-white-light dark:text-white/10">{problem.number}</span>
                            <span className="grid h-12 w-12 shrink-0 place-content-center rounded-full bg-white-light text-black dark:bg-white/10 dark:text-white-light">
                                <problem.icon className="h-6 w-6" />
                            </span>
                            <div>
                                <h3 className="text-lg font-bold text-black dark:text-white-light">{problem.title}</h3>
                                <p className="mt-1 text-sm text-white-dark">{problem.copy}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Problem;
