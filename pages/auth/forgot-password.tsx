import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { forgotPassword, clearAuthError } from '@/store/slices/auth/authSlice';

const ForgotPassword = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);
    const [email, setEmail] = useState('');

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        dispatch(clearAuthError());

        try {
            await dispatch(forgotPassword({ email })).unwrap();
            router.push(`/auth/verify-otp?purpose=reset&email=${encodeURIComponent(email)}`);
        } catch {
            // error is already captured in auth.error via the rejected case
        }
    };

    return (
        <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0e1726] px-4 py-3">
            <img src="/assets/images/auth/bg-gradient.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
            <img src="/assets/images/auth/map.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-10" />

            <div className="relative max-h-full w-full max-w-[420px] overflow-y-auto rounded-2xl bg-white/95 p-5 shadow-2xl backdrop-blur-lg dark:bg-black/80 sm:p-8">
                <div className="flex flex-col items-center">
                    <span className="grid h-12 w-12 shrink-0 place-content-center overflow-hidden rounded-full bg-primary-light dark:bg-primary/20 sm:h-16 sm:w-16">
                        <img src="/assets/images/logo.svg" alt="SmoothSurf Sacco" className="h-9 w-9 sm:h-12 sm:w-12" />
                    </span>
                    <h1 className="mt-4 text-2xl font-extrabold text-primary">Forgot your password?</h1>
                    <p className="mt-2 text-center text-sm text-white-dark">Enter your email and we’ll send you a verification code to reset it</p>
                </div>

                {error && (
                    <div className="mt-6">
                        <Alert variant="danger">{error}</Alert>
                    </div>
                )}

                <form className="mt-4 space-y-3 sm:mt-6 sm:space-y-4" onSubmit={submitForm}>
                    <Input
                        id="email"
                        label="Email"
                        type="email"
                        placeholder="name@smoothsurfsacco.co.ke"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Button type="submit" size="lg" fullWidth disabled={loading}>
                        {loading ? 'Sending code…' : 'Send reset code'}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm text-white-dark sm:mt-6">
                    Remembered your password?{' '}
                    <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
};

ForgotPassword.getLayout = (page: React.ReactElement) => <BlankLayout>{page}</BlankLayout>;

export default ForgotPassword;
