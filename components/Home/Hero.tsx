import Button from '@/components/ui/Button';
import IconTrendingUp from '@/components/Icon/IconTrendingUp';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import WaveDivider from './WaveDivider';

const Hero = () => {
    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 to-white dark:from-[#0e1726] dark:to-[#060818]">
            {/* soft hand-placed blobs, not a perfect grid */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-1/3 h-56 w-56 rounded-full bg-success/10 blur-3xl" />

            <div className="container relative mx-auto grid items-center gap-10 px-5 py-16 md:py-24 lg:grid-cols-2">
                <div>
                    <span className="badge badge-outline-primary mb-4 inline-block -rotate-1 !text-xs uppercase tracking-wide">Built for Kenyan SACCOs</span>
                    <h1 className="text-4xl font-extrabold leading-tight text-black dark:text-white-light md:text-5xl">
                        Stop Running Your SACCO on{' '}
                        <span className="relative inline-block text-primary">
                            Excel.
                            <svg viewBox="0 0 120 14" className="absolute -bottom-2 left-0 h-3 w-full text-primary" preserveAspectRatio="none" aria-hidden="true">
                                <path d="M2 9 C 20 2, 35 12, 55 6 C 75 1, 90 11, 118 5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
                            </svg>
                        </span>
                    </h1>
                    <p className="mt-6 max-w-lg text-lg text-white-dark">
                        SmoothSurf Sacco is the cloud banking platform built for Kenyan SACCOs — give your members the real bank experience they deserve, with the compliance and control your board demands.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Button href="#book-demo" size="lg">
                            Book a Free Demo
                        </Button>
                        <a href="#solution" className="font-semibold text-primary hover:underline">
                            See how it works →
                        </a>
                    </div>
                </div>

                {/* CSS-built phone mockup of the member dashboard */}
                <div className="relative mx-auto w-full max-w-[300px] rotate-1">
                    <div className="relative rounded-[2.5rem] border-[10px] border-black bg-black p-2 shadow-2xl dark:border-white-dark/40">
                        <div className="absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/60" />
                        <div className="overflow-hidden rounded-[1.8rem] bg-white dark:bg-[#0e1726]">
                            <div className="bg-primary px-4 pb-6 pt-8 text-white">
                                <p className="text-xs opacity-80">Good afternoon,</p>
                                <p className="font-bold">Jane Wanjiku</p>
                                <p className="mt-4 text-2xl font-extrabold">KES 184,250</p>
                                <p className="text-xs opacity-80">Savings balance</p>
                            </div>
                            <div className="space-y-3 p-4">
                                <div className="flex items-center justify-between rounded-lg bg-success-light px-3 py-2 dark:bg-success/20">
                                    <div className="flex items-center gap-2">
                                        <span className="grid h-7 w-7 place-content-center rounded-full bg-success text-white">
                                            <IconCashBanknotes className="h-4 w-4" />
                                        </span>
                                        <span className="text-xs font-semibold">Loan repayment</span>
                                    </div>
                                    <span className="text-xs font-bold text-success">+KES 5,000</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-primary-light px-3 py-2 dark:bg-primary/20">
                                    <div className="flex items-center gap-2">
                                        <span className="grid h-7 w-7 place-content-center rounded-full bg-primary text-white">
                                            <IconTrendingUp className="h-4 w-4" />
                                        </span>
                                        <span className="text-xs font-semibold">Loan eligibility</span>
                                    </div>
                                    <span className="text-xs font-bold text-primary">KES 60,000</span>
                                </div>
                                <div className="rounded-lg border border-dashed border-white-light p-3 dark:border-white/10">
                                    <p className="mb-2 text-xs font-semibold text-white-dark">Savings growth</p>
                                    <div className="flex items-end gap-1.5">
                                        {[40, 55, 35, 70, 60, 90, 75].map((height, index) => (
                                            <div key={index} className="flex-1 rounded-sm bg-primary/70" style={{ height: `${height}px` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-6 top-10 hidden rounded-xl bg-white p-3 shadow-lg dark:bg-black sm:block">
                        <p className="text-xs font-semibold text-white-dark">AI Risk Score</p>
                        <p className="text-lg font-extrabold text-success">82 · Low Risk</p>
                    </div>
                </div>
            </div>

            <WaveDivider className="relative text-white dark:text-[#0e1726]" />
        </section>
    );
};

export default Hero;
