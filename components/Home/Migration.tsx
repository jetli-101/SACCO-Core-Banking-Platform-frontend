import IconClipboardText from '@/components/Icon/IconClipboardText';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconUsersGroup from '@/components/Icon/IconUsersGroup';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';

const phases = [
    { icon: IconClipboardText, title: 'Discovery & Data Audit', copy: 'We pull your existing spreadsheets and registers and map every field to the new ledger.' },
    { icon: IconRefresh, title: 'Cleanup & Reconciliation', copy: 'Duplicate records, broken formulas, and mismatched balances get fixed before anything goes live.' },
    { icon: IconUsersGroup, title: 'Parallel Run', copy: 'Your team runs SmoothSurf Sacco alongside Excel for a full cycle, so nothing is trusted blindly.' },
    { icon: IconCircleCheck, title: 'Go-Live & Sign-off', copy: 'We switch over only after your CFO has reconciled every shilling and signed off.' },
];

const Migration = () => {
    return (
        <section className="bg-white py-16 dark:bg-[#0e1726]">
            <div className="container mx-auto px-5">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-extrabold text-black dark:text-white-light">“But all our data is in Excel.”</h2>
                    <p className="mt-3 text-white-dark">That’s exactly why we built a migration process around it.</p>
                </div>

                <div className="relative mt-12 grid gap-8 md:grid-cols-4">
                    <div className="absolute left-0 right-0 top-6 hidden h-0.5 bg-white-light dark:bg-white/10 md:block" />
                    {phases.map((phase, index) => (
                        <div key={phase.title} className="relative text-center">
                            <span className="relative z-10 mx-auto grid h-12 w-12 place-content-center rounded-full bg-primary text-white">
                                <phase.icon className="h-6 w-6" />
                            </span>
                            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-primary">Phase {index + 1}</p>
                            <h3 className="mt-1 font-bold text-black dark:text-white-light">{phase.title}</h3>
                            <p className="mt-2 text-sm text-white-dark">{phase.copy}</p>
                        </div>
                    ))}
                </div>

                <div className="mx-auto mt-10 max-w-2xl rounded-lg border-2 border-dashed border-primary/40 bg-primary-light p-6 text-center dark:bg-primary/10">
                    <p className="text-lg font-semibold text-black dark:text-white-light">
                        “We migrate your historical data, reconcile every shilling, and go live only when your CFO signs off.”
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Migration;
