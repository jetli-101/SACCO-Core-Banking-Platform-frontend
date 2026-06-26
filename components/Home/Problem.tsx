import IconXCircle from '@/components/Icon/IconXCircle';
import IconClock from '@/components/Icon/IconClock';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';

const problems = [
    {
        icon: IconXCircle,
        title: 'Spreadsheet errors cost you money',
        copy: 'One broken formula and a member’s balance is wrong — or your books don’t reconcile at month-end. Excel was never built to be a ledger.',
    },
    {
        icon: IconClock,
        title: 'SASRA reports take weeks',
        copy: 'Your finance team spends days re-entering numbers across six different prudential returns, every single quarter, by hand.',
    },
    {
        icon: IconCashBanknotes,
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
                    <p className="mt-3 text-white-dark">It's the same one every SACCO board meeting comes back to.</p>
                </div>

                <div className="mt-10 grid gap-6 md:grid-cols-3">
                    {problems.map((problem) => (
                        <div key={problem.title} className="panel">
                            <span className="grid h-12 w-12 place-content-center rounded-full bg-danger-light text-danger dark:bg-danger dark:text-danger-light">
                                <problem.icon className="h-6 w-6" />
                            </span>
                            <h3 className="mt-4 text-lg font-bold text-black dark:text-white-light">{problem.title}</h3>
                            <p className="mt-2 text-sm text-white-dark">{problem.copy}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Problem;
