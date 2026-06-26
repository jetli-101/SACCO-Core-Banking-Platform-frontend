import { useState } from 'react';
import Button from '@/components/ui/Button';
import IconBolt from '@/components/Icon/IconBolt';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';

type Stage = 'idle' | 'thinking' | 'done';

const factors = ['12-month repayment history: excellent', 'Savings-to-loan ratio: healthy at 1.8x', 'Income stability: consistent M-Pesa inflows'];

const AIDemo = () => {
    const [stage, setStage] = useState<Stage>('idle');

    const runAssessment = () => {
        setStage('thinking');
        setTimeout(() => setStage('done'), 1800);
    };

    return (
        <section id="ai-demo" className="bg-white-light/30 py-16 dark:bg-dark dark:bg-opacity-[0.08]">
            <div className="container mx-auto px-5">
                <div className="mx-auto max-w-2xl text-center">
                    <span className="badge badge-outline-primary !text-xs uppercase tracking-wide">Most differentiated feature</span>
                    <h2 className="mt-3 text-3xl font-extrabold text-black dark:text-white-light">A loan decision in under 3 seconds.</h2>
                    <p className="mt-3 text-white-dark">Your credit committee submits an application. The AI returns a risk score, a recommendation, and the reasons behind it — instantly.</p>
                </div>

                <div className="mx-auto mt-10 max-w-xl panel">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white-light pb-4 dark:border-white/10">
                        <div>
                            <p className="text-sm text-white-dark">Loan application</p>
                            <p className="font-bold text-black dark:text-white-light">Mary Achieng &middot; Requesting KES 60,000</p>
                        </div>
                        <Button onClick={runAssessment} disabled={stage === 'thinking'}>
                            <IconBolt className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                            {stage === 'thinking' ? 'Assessing…' : 'Run AI Assessment'}
                        </Button>
                    </div>

                    <div className="pt-5">
                        {stage === 'idle' && <p className="text-center text-sm text-white-dark">Click “Run AI Assessment” to see the output.</p>}

                        {stage === 'thinking' && (
                            <div className="flex flex-col items-center gap-3 py-6">
                                <div className="h-1.5 w-full max-w-[260px] overflow-hidden rounded-full bg-white-light dark:bg-[#1b2e4b]">
                                    <div className="h-full w-full animate-pulse rounded-full bg-primary" />
                                </div>
                                <p className="text-sm text-white-dark">Analyzing repayment history, savings ratio, and income stability…</p>
                            </div>
                        )}

                        {stage === 'done' && (
                            <div className="animate__animated animate__fadeIn space-y-4">
                                <div className="flex items-center justify-between rounded-lg bg-success-light px-4 py-3 dark:bg-success/20">
                                    <span className="font-semibold text-success">Risk Score</span>
                                    <span className="text-2xl font-extrabold text-success">82 / 100 · Low Risk</span>
                                </div>
                                <div className="rounded-lg border border-dashed border-white-light p-4 dark:border-white/10">
                                    <p className="font-semibold text-black dark:text-white-light">Recommendation</p>
                                    <p className="mt-1 text-sm text-white-dark">Approve up to KES 60,000 at standard terms.</p>
                                </div>
                                <div>
                                    <p className="mb-2 font-semibold text-black dark:text-white-light">Key factors</p>
                                    <ul className="space-y-2">
                                        {factors.map((factor) => (
                                            <li key={factor} className="flex items-start gap-2 text-sm text-white-dark">
                                                <IconCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                                {factor}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AIDemo;
