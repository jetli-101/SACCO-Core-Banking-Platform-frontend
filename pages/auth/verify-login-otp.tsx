import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { verifyLoginOtp, clearAuthError } from '@/store/slices/auth/authSlice';

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyLoginOtpPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error, requiresPasswordChange } = useAppSelector((state) => state.auth);

    const email = typeof router.query.email === 'string' ? router.query.email : '';

    const [otp, setOtp] = useState('');
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (!email) router.replace('/auth/login');
    }, [email, router]);

    useEffect(() => {
        if (cooldown === 0) return;
        const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        dispatch(clearAuthError());
        try {
            await dispatch(verifyLoginOtp({ email, otp })).unwrap();
            // requiresPasswordChange is now set in Redux state — redirect accordingly
            if (requiresPasswordChange) {
                router.push('/auth/change-password');
            } else {
                router.push('/dashboard');
            }
        } catch {
            // captured in auth.error
        }
    };

    return (
        <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0e1726] px-4 py-3">
            <div className="relative max-h-full w-full max-w-[420px] overflow-y-auto rounded-2xl bg-white/95 p-5 shadow-2xl backdrop-blur-lg dark:bg-black/80 sm:p-8">
                <div className="flex flex-col items-center">
                    <span className="inline-flex shrink-0 items-center rounded-md bg-white p-1.5 shadow-sm sm:p-2">
                        <img src="/assets/images/smoothsurf-logo.png" alt="SmoothSurf IT Consulting" className="h-9 w-auto sm:h-11" />
                    </span>
                    <h1 className="mt-4 text-2xl font-extrabold text-primary">Check your email</h1>
                    <p className="mt-2 text-center text-sm text-white-dark">
                        We sent a 6-digit verification code to <strong>{email}</strong>
                    </p>
                </div>

                {error && (
                    <div className="mt-6">
                        <Alert variant="danger">{error}</Alert>
                    </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={submit}>
                    <Input
                        id="otp"
                        label="Verification code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        required
                    />

                    <Button type="submit" size="lg" fullWidth disabled={loading || otp.length < 6}>
                        {loading && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                        {loading ? 'Verifying…' : 'Verify code'}
                    </Button>

                    <p className="text-center text-sm text-white-dark">
                        Didn&apos;t get a code?{' '}
                        <Button
                            variant="ghost"
                            type="button"
                            disabled={cooldown > 0}
                            className={cooldown > 0 ? 'text-white-dark' : 'font-semibold text-primary hover:underline'}
                            onClick={() => {
                                /* resend not implemented yet — user can log in again */
                                setCooldown(RESEND_COOLDOWN_SECONDS);
                            }}
                        >
                            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                        </Button>
                    </p>
                </form>

                <div className="mt-4 text-center text-sm text-white-dark">
                    <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
};

VerifyLoginOtpPage.getLayout = (page: React.ReactElement) => <BlankLayout>{page}</BlankLayout>;

export default VerifyLoginOtpPage;
