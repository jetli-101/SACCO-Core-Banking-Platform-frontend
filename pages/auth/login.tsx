import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import IconEye from '@/components/Icon/IconEye';
import IconMail from '@/components/Icon/IconMail';
import IconLockDots from '@/components/Icon/IconLockDots';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, clearAuthError } from '@/store/slices/auth/authSlice';

const Login = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);
    const justVerified = router.query.verified === '1';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        dispatch(clearAuthError());

        try {
            await dispatch(loginUser({ email, password })).unwrap();
            router.push('/dashboard');
        } catch {
            // error is already captured in auth.error via the rejected case
        }
    };

    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            <div className="relative hidden w-full flex-col items-center justify-center bg-primary px-10 py-16 text-center text-white lg:flex lg:w-1/2">
                <span className="inline-flex items-center rounded-md bg-white p-2">
                    <img src="/assets/images/smoothsurf-logo.png" alt="SmoothSurf IT Consulting" className="h-16 w-auto" />
                </span>
                <h2 className="mt-10 text-3xl font-bold">SmoothSurf Sacco</h2>
                <p className="mt-3 max-w-sm text-white/80">Member &amp; Staff Portal</p>
            </div>

            <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
                <div className="mx-auto w-full max-w-sm">
                    <span className="mb-8 inline-flex items-center rounded-md bg-white p-1.5 shadow-sm lg:hidden">
                        <img src="/assets/images/smoothsurf-logo.png" alt="SmoothSurf IT Consulting" className="h-9 w-auto" />
                    </span>

                    <h1 className="text-3xl font-extrabold text-black dark:text-white-light">SIGN IN</h1>
                    <p className="mt-2 text-white-dark">Enter your email and password to login</p>

                    {justVerified && !error && (
                        <div className="mt-6">
                            <Alert variant="success">Email verified — you can now log in.</Alert>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6">
                            <Alert variant="danger">{error}</Alert>
                        </div>
                    )}

                    <form className="mt-8 space-y-5" onSubmit={submitForm}>
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
                                Email
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white-dark">
                                    <IconMail className="h-5 w-5" />
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-input bg-primary-light pl-10 dark:bg-primary/10"
                                    placeholder="name@smoothsurfsacco.co.ke"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-semibold">
                                    Password
                                </label>
                                <Link href="/auth/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white-dark">
                                    <IconLockDots className="h-5 w-5" />
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input bg-primary-light pl-10 pr-10 dark:bg-primary/10"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowPassword((show) => !show)}
                                    className={`absolute inset-y-0 right-0 pr-3 ${showPassword ? 'text-primary' : 'text-white-dark'}`}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <IconEye className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <label htmlFor="rememberMe" className="flex items-center text-white-dark">
                            <input id="rememberMe" type="checkbox" className="form-checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                            <span className="ltr:ml-2 rtl:mr-2">Remember me</span>
                        </label>

                        <Button type="submit" size="lg" fullWidth disabled={loading}>
                            {loading ? 'SIGNING IN…' : 'SIGN IN'}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-white-dark">
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                            SIGN UP
                        </Link>
                    </p>

                    <p className="mt-10 text-center text-xs text-white-dark">© {new Date().getFullYear()} @SmoothSurf Sacco.</p>
                </div>
            </div>
        </div>
    );
};

Login.getLayout = (page: React.ReactElement) => <BlankLayout>{page}</BlankLayout>;

export default Login;
