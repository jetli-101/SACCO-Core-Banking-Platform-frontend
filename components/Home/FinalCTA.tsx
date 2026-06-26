import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import IconDownload from '@/components/Icon/IconDownload';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';

const QUARTER_DEADLINES: Array<[number, number]> = [
    [0, 31], // 31 Jan
    [3, 30], // 30 Apr
    [6, 31], // 31 Jul
    [9, 31], // 31 Oct
];

const weeksUntilNextDeadline = () => {
    const today = new Date();
    const candidates = [today.getFullYear(), today.getFullYear() + 1].flatMap((year) => QUARTER_DEADLINES.map(([month, day]) => new Date(year, month, day)));
    const next = candidates.filter((date) => date.getTime() >= today.getTime()).sort((a, b) => a.getTime() - b.getTime())[0];
    return Math.max(1, Math.ceil((next.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)));
};

const FinalCTA = () => {
    const [proposalOpen, setProposalOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const weeks = weeksUntilNextDeadline();

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
    };

    return (
        <section id="book-demo" className="bg-gradient-to-r from-primary to-[#c2410c] py-16 text-white">
            <div className="container mx-auto px-5 text-center">
                <h2 className="text-3xl font-extrabold md:text-4xl">Your next SASRA quarterly return is due in {weeks} weeks. Be ready.</h2>
                <p className="mx-auto mt-3 max-w-xl text-white/90">Book a demo and see your own ledger, loans, and compliance reports running on SmartSurf Sacco before your next board meeting.</p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <Button href="/auth/boxed-signup" variant="dark" size="lg" className="!border-white !bg-white !text-primary hover:!bg-white/90">
                        Book a Demo
                    </Button>
                    <Button variant="outline-primary" size="lg" className="!border-white !text-white hover:!bg-white hover:!text-primary" onClick={() => setProposalOpen(true)}>
                        <IconDownload className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        Download the Technical Proposal
                    </Button>
                </div>
            </div>

            <Modal isOpen={proposalOpen} onClose={() => setProposalOpen(false)} title="Get the Technical Proposal">
                {submitted ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                        <IconCircleCheck className="h-10 w-10 text-success" />
                        <p className="font-semibold text-black dark:text-white-light">Thanks — we'll email the technical proposal shortly.</p>
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <Input label="Work email" type="email" placeholder="you@yoursacco.co.ke" required />
                        <Input label="SACCO name" type="text" placeholder="Your SACCO" required />
                        <Button type="submit" fullWidth>
                            Send me the proposal
                        </Button>
                    </form>
                )}
            </Modal>
        </section>
    );
};

export default FinalCTA;
