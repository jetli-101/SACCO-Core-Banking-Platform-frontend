import Avatar from '@/components/ui/Avatar';

const numbers = [
    { value: '4,200', label: 'members onboarded' },
    { value: '3 weeks → 1 day', label: 'on SASRA reporting' },
    { value: '80% faster', label: 'loan processing time' },
];

const Testimonial = () => {
    return (
        <section className="bg-white-light/30 py-16 dark:bg-dark dark:bg-opacity-[0.08]">
            <div className="container mx-auto px-5">
                <div className="mx-auto max-w-3xl panel text-center">
                    <div className="grid grid-cols-1 gap-6 border-b border-white-light pb-6 dark:border-white/10 sm:grid-cols-3">
                        {numbers.map((number) => (
                            <div key={number.label}>
                                <p className="text-2xl font-extrabold text-primary">{number.value}</p>
                                <p className="text-xs text-white-dark">{number.label}</p>
                            </div>
                        ))}
                    </div>

                    <p className="mt-6 text-lg italic text-black dark:text-white-light">
                        "We went from dreading every quarter-end to generating our SASRA returns the same afternoon. Our members can finally see their balances on their phones — something we never thought we'd be able to offer."
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-3">
                        <Avatar name="Pilot SACCO" size="lg" />
                        <div className="text-left">
                            <p className="font-bold text-black dark:text-white-light">Finance Manager</p>
                            <p className="text-sm text-white-dark">Pilot SACCO, Nairobi</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonial;
