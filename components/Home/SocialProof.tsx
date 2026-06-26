const stats = [
    { value: '15,000+', label: 'SACCOs in Kenya' },
    { value: 'KES 900B', label: 'in member assets' },
    { value: '14M', label: 'members underserved by legacy software' },
];

const partnerSlots = ['Pilot SACCO A', 'Pilot SACCO B', 'Pilot SACCO C', 'Pilot SACCO D'];

const SocialProof = () => {
    return (
        <section className="border-y border-white-light bg-white py-10 dark:border-white/10 dark:bg-[#0e1726]">
            <div className="container mx-auto px-5">
                <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
                    {partnerSlots.map((name) => (
                        <span key={name} className="rounded-md border border-dashed border-white-light px-4 py-2 text-sm font-semibold text-white-dark dark:border-white/10">
                            {name}
                        </span>
                    ))}
                    <span className="badge badge-outline-success !text-xs uppercase tracking-wide">SASRA-Aligned</span>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
                    {stats.map((stat) => (
                        <div key={stat.label}>
                            <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
                            <p className="text-sm text-white-dark">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SocialProof;
