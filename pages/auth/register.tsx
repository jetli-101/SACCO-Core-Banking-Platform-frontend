import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import IconEye from '@/components/Icon/IconEye';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerUser, clearAuthError } from '@/store/slices/auth/authSlice';

const Register = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmError, setConfirmError] = useState('');

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        dispatch(clearAuthError());

        if (password !== confirmPassword) {
            setConfirmError('Passwords do not match');
            return;
        }
        setConfirmError('');

        try {
            await dispatch(registerUser({ name, email, password })).unwrap();
            router.push(`/auth/verify-otp?purpose=register&email=${encodeURIComponent(email)}`);
        } catch {
            // error is already captured in auth.error via the rejected case
        }
    };

    return (
        <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0e1726] px-4 py-3">
            <img src="/assets/images/auth/bg-gradient.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
            <img src="/assets/images/auth/map.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-10" />

            <div className="relative max-h-full w-full max-w-[440px] overflow-y-auto rounded-2xl bg-white/95 p-5 shadow-2xl backdrop-blur-lg dark:bg-black/80 sm:p-8">
                <div className="flex flex-col items-center">
                    <span className="grid h-12 w-12 shrink-0 place-content-center overflow-hidden rounded-full bg-primary-light dark:bg-primary/20 sm:h-16 sm:w-16">
                        <img src="/assets/images/logo.svg" alt="SmoothSurf Sacco" className="h-9 w-9 sm:h-12 sm:w-12" />
                    </span>
                    <h1 className="mt-4 text-2xl font-extrabold text-primary">Create your account</h1>
                    <p className="mt-2 text-center text-sm text-white-dark">Join SmoothSurf Sacco to manage your savings and loans online</p>
                </div>

                {error && (
                    <div className="mt-6">
                        <Alert variant="danger">{error}</Alert>
                    </div>
                )}

                <form className="mt-4 space-y-3 sm:mt-6 sm:space-y-4" onSubmit={submitForm}>
                    <Input id="name" label="Full name" type="text" placeholder="Jane Wanjiku" value={name} onChange={(e) => setName(e.target.value)} required />

                    <Input
                        id="email"
                        label="Email"
                        type="email"
                        placeholder="name@smoothsurfsacco.co.ke"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        id="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        rightElement={
                            <Button
                                variant="ghost"
                                onClick={() => setShowPassword((show) => !show)}
                                className={showPassword ? 'text-primary' : 'text-white-dark'}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <IconEye className="h-5 w-5" />
                            </Button>
                        }
                    />

                    <Input
                        id="confirmPassword"
                        label="Confirm password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        error={confirmError}
                    />

                    <Button type="submit" size="lg" fullWidth disabled={loading}>
                        {loading ? 'Creating account…' : 'Create account'}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm text-white-dark sm:mt-6">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
};

Register.getLayout = (page: React.ReactElement) => <BlankLayout>{page}</BlankLayout>;

export default Register;
