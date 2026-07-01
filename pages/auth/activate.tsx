import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Spinner from '@/components/ui/Spinner';
import { useAppDispatch } from '@/store/hooks';
import { activateAccount } from '@/store/slices/auth/authSlice';

const ActivatePage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!router.isReady) return;
        const token = typeof router.query.token === 'string' ? router.query.token : '';
        if (!token) {
            setStatus('error');
            setMessage('No activation token found. Please use the link from your invitation email.');
            return;
        }

        dispatch(activateAccount(token))
            .unwrap()
            .then(() => {
                setStatus('success');
                setMessage('Your account has been activated. You can now log in with your temporary password.');
            })
            .catch((err: { message?: string }) => {
                setStatus('error');
                setMessage(err?.message || 'This activation link is invalid or has expired. Please contact your administrator.');
            });
    }, [router.isReady, router.query.token, dispatch]);

    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            <div className="relative hidden w-full flex-col items-center justify-center bg-primary px-10 py-16 text-center text-white lg:flex lg:w-1/2">
                <span className="inline-flex items-center rounded-md bg-white p-2">
                    <img src="/assets/images/smoothsurf-logo.png" alt="SmoothSurf IT Consulting" className="h-16 w-auto" />
                </span>
                <h2 className="mt-10 text-3xl font-bold">SmoothSurf Sacco</h2>
                <p className="mt-3 max-w-sm text-white/80">Staff Portal Activation</p>
            </div>

            <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
                <div className="mx-auto w-full max-w-sm text-center">
                    <span className="mb-8 inline-flex items-center rounded-md bg-white p-1.5 shadow-sm lg:hidden">
                        <img src="/assets/images/smoothsurf-logo.png" alt="SmoothSurf IT Consulting" className="h-9 w-auto" />
                    </span>

                    {status === 'loading' && (
                        <>
                            <Spinner className="mx-auto mb-4 h-10 w-10 text-primary" />
                            <h1 className="text-2xl font-extrabold text-black dark:text-white-light">Activating your account…</h1>
                            <p className="mt-2 text-white-dark">Please wait while we verify your activation link.</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                                <svg className="h-8 w-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-extrabold text-black dark:text-white-light">Account Activated!</h1>
                            <p className="mt-2 text-white-dark">{message}</p>
                            <Link
                                href="/auth/login"
                                className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
                            >
                                Go to Login
                            </Link>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
                                <svg className="h-8 w-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-extrabold text-black dark:text-white-light">Activation Failed</h1>
                            <p className="mt-2 text-white-dark">{message}</p>
                            <Link
                                href="/auth/login"
                                className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
                            >
                                Back to Login
                            </Link>
                        </>
                    )}

                    <p className="mt-10 text-center text-xs text-white-dark">© {new Date().getFullYear()} @SmoothSurf Sacco.</p>
                </div>
            </div>
        </div>
    );
};

ActivatePage.getLayout = (page: React.ReactElement) => <BlankLayout>{page}</BlankLayout>;

export default ActivatePage;
