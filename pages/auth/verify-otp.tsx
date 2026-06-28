import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { verifyOtp, resendOtp, resetPassword, clearAuthError } from '@/store/slices/auth/authSlice';

const RESEND_COOLDOWN_SECONDS = 30;

const VerifyOtp = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);

    const purpose = router.query.purpose === 'reset' ? 'reset' : 'register';
    const email = typeof router.query.email === 'string' ? router.query.email : '';

    const [code, setCode] = useState('');
    const [codeVerified, setCodeVerified] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

    useEffect(() => {
        if (cooldown === 0) return;
        const timer = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const submitCode = async (event: React.FormEvent) => {
        event.preventDefault();
        dispatch(clearAuthError());

        try {
            await dispatch(verifyOtp({ email, code, purpose })).unwrap();
            if (purpose === 'register') {
                router.push('/auth/login?verified=1');
            } else {
                setCodeVerified(true);
            }
        } catch {
            // error is already captured in auth.error via the rejected case
        }
    };

    const submitNewPassword = async (event: React.FormEvent) => {
        event.preventDefault();
        dispatch(clearAuthError());

        if (newPassword !== confirmPassword) {
            setConfirmError('Passwords do not match');
            return;
        }
        setConfirmError('');

        try {
            await dispatch(resetPassword({ email, code, password: newPassword })).unwrap();
            router.push('/auth/login');
        } catch {
            // error is already captured in auth.error via the rejected case
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        dispatch(clearAuthError());
        await dispatch(resendOtp({ email, purpose }));
        setCooldown(RESEND_COOLDOWN_SECONDS);
    };

    return (
        <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0e1726] px-4 py-3">
            <img src="/assets/images/auth/bg-gradient.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
            <img src="/assets/images/auth/map.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-10" />

            <div className="relative max-h-full w-full max-w-[420px] overflow-y-auto rounded-2xl bg-white/95 p-5 shadow-2xl backdrop-blur-lg dark:bg-black/80 sm:p-8">
                <div className="flex flex-col items-center">
                    <span className="inline-flex shrink-0 items-center rounded-md bg-white p-1.5 shadow-sm sm:p-2">
                        <img src="/assets/images/smoothsurf-logo.png" alt="SmoothSurf IT Consulting" className="h-9 w-auto sm:h-11" />
                    </span>
                    <h1 className="mt-4 text-2xl font-extrabold text-primary">{codeVerified ? 'Set a new password' : 'Verify your email'}</h1>
                    <p className="mt-2 text-center text-sm text-white-dark">
                        {codeVerified ? 'Choose a new password for your account' : <>We sent a 6-digit code to {email || 'your email'}</>}
                    </p>
                </div>

                {error && (
                    <div className="mt-6">
                        <Alert variant="danger">{error}</Alert>
                    </div>
                )}

                {!codeVerified ? (
                    <form className="mt-4 space-y-3 sm:mt-6 sm:space-y-4" onSubmit={submitCode}>
                        <Input
                            id="code"
                            label="Verification code"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="123456"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            required
                        />

                        <Button type="submit" size="lg" fullWidth disabled={loading || code.length < 6}>
                            {loading ? 'Verifying…' : 'Verify code'}
                        </Button>

                        <p className="text-center text-sm text-white-dark">
                            Didn’t get a code?{' '}
                            <Button variant="ghost" type="button" onClick={handleResend} disabled={cooldown > 0} className={cooldown > 0 ? 'text-white-dark' : 'font-semibold text-primary hover:underline'}>
                                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                            </Button>
                        </p>
                    </form>
                ) : (
                    <form className="mt-4 space-y-3 sm:mt-6 sm:space-y-4" onSubmit={submitNewPassword}>
                        <Input
                            id="newPassword"
                            label="New password"
                            type="password"
                            placeholder="Create a new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                        <Input
                            id="confirmPassword"
                            label="Confirm new password"
                            type="password"
                            placeholder="Re-enter your new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            error={confirmError}
                        />

                        <Button type="submit" size="lg" fullWidth disabled={loading}>
                            {loading ? 'Saving…' : 'Save new password'}
                        </Button>
                    </form>
                )}

                <div className="mt-4 text-center text-sm text-white-dark sm:mt-6">
                    <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
};

VerifyOtp.getLayout = (page: React.ReactElement) => <BlankLayout>{page}</BlankLayout>;

export default VerifyOtp;
