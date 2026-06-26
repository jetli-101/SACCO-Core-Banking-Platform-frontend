import IconCircleCheck from '@/components/Icon/IconCircleCheck';

const badges = ['AWS Hosting', 'TLS 1.3 Encryption', 'SASRA-Aligned', 'Kenya Data Protection Act Compliant', 'BCrypt-Encrypted Passwords', 'Daily Backups'];

const SecurityTrust = () => {
    return (
        <section className="bg-white py-12 dark:bg-[#0e1726]">
            <div className="container mx-auto px-5">
                <p className="text-center text-sm font-semibold uppercase tracking-wide text-white-dark">Built for boards who are personally liable for member savings</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {badges.map((badge) => (
                        <span key={badge} className="flex items-center gap-1.5 rounded-full border border-white-light px-4 py-2 text-sm font-semibold text-black dark:border-white/10 dark:text-white-light">
                            <IconCircleCheck className="h-4 w-4 text-success" />
                            {badge}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SecurityTrust;
