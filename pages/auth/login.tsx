import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import IconEye from '@/components/Icon/IconEye';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, clearAuthError } from '@/store/slices/auth/authSlice';

const Login = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0e1726] px-4 py-3">
            <img src="/assets/images/auth/bg-gradient.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
            <img src="/assets/images/auth/map.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-10" />

            <div className="relative max-h-full w-full max-w-[420px] overflow-y-auto rounded-2xl bg-white/95 p-5 shadow-2xl backdrop-blur-lg dark:bg-black/80 sm:p-8">
                <div className="flex flex-col items-center">
                    <span className="grid h-12 w-12 shrink-0 place-content-center overflow-hidden rounded-full bg-primary-light dark:bg-primary/20 sm:h-16 sm:w-16">
                        <img src="/assets/images/logo.svg" alt="SmoothSurf Sacco" className="h-9 w-9 sm:h-12 sm:w-12" />
                    </span>
                    <h1 className="mt-4 text-2xl font-extrabold text-primary">SmoothSurf Sacco Login</h1>
                    <p className="mt-2 text-center text-sm text-white-dark">Access your SmoothSurf Sacco member or staff account</p>
                </div>

                {error && (
                    <div className="mt-6">
                        <Alert variant="danger">{error}</Alert>
                    </div>
                )}

                <form className="mt-4 space-y-3 sm:mt-6 sm:space-y-4" onSubmit={submitForm}>
                    <Input id="email" label="Email" type="email" placeholder="name@smoothsurfsacco.co.ke" value={email} onChange={(e) => setEmail(e.target.value)} required />

                    <Input
                        id="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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

                    <Link href="/auth/forgot-password" className="inline-block text-sm font-semibold text-primary hover:underline">
                        Forgot password?
                    </Link>

                    <Button type="submit" size="lg" fullWidth disabled={loading}>
                        {loading ? 'Logging in…' : 'Login'}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm text-white-dark sm:mt-6">
                    <p>
                        Don’t have an account?{' '}
                        <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                            Create one
                        </Link>
                    </p>
                    <p className="mt-3">Need help? Contact SmoothSurf Support</p>
                    <p>
                        Access{' '}
                        <Link href="#" className="font-semibold text-primary hover:underline">
                            SmoothSurf Helpdesk
                        </Link>
                    </p>
                    <p className="mt-4 text-xs">© {new Date().getFullYear()} SmoothSurf Sacco. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

Login.getLayout = (page: React.ReactElement) => <BlankLayout>{page}</BlankLayout>;

export default Login;
