import { useState } from 'react';
import { useRouter } from 'next/router';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { changeTemporaryPassword, clearAuthError } from '@/store/slices/auth/authSlice';

const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'One number', test: (p: string) => /\d/.test(p) },
    { label: 'One special character (!@#$%…)', test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

const ChangePasswordPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmError, setConfirmError] = useState('');

    const passesAll = PASSWORD_RULES.every((r) => r.test(newPassword));

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        dispatch(clearAuthError());
        setConfirmError('');

        if (newPassword !== confirmPassword) {
            setConfirmError('Passwords do not match');
            return;
        }

        try {
            await dispatch(changeTemporaryPassword({ currentPassword, newPassword, confirmPassword })).unwrap();
            router.push('/dashboard');
        } catch {
            // captured in auth.error
        }
    };

    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            <div className="relative hidden w-full flex-col items-center justify-center bg-primary px-10 py-16 text-center text-white lg:flex lg:w-1/2">
                <span className="inline-flex items-center rounded-md bg-white p-2">
                    <img src="/assets/images/smoothsurf-logo.png" alt="SmoothSurf IT Consulting" className="h-16 w-auto" />
                </span>
                <h2 className="mt-10 text-3xl font-bold">SmoothSurf Sacco</h2>
                <p className="mt-3 max-w-sm text-white/80">Create your permanent password to get started.</p>
            </div>

            <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
                <div className="mx-auto w-full max-w-sm">
                    <span className="mb-8 inline-flex items-center rounded-md bg-white p-1.5 shadow-sm lg:hidden">
                        <img src="/assets/images/smoothsurf-logo.png" alt="SmoothSurf IT Consulting" className="h-9 w-auto" />
                    </span>

                    <h1 className="text-3xl font-extrabold text-black dark:text-white-light">Set New Password</h1>
                    <p className="mt-2 text-white-dark">
                        You&apos;re logged in with a temporary password. Create a permanent one to access the dashboard.
                    </p>

                    {error && (
                        <div className="mt-6">
                            <Alert variant="danger">{error}</Alert>
                        </div>
                    )}

                    <form className="mt-8 space-y-5" onSubmit={submit}>
                        <Input
                            id="currentPassword"
                            label="Temporary password"
                            type="password"
                            placeholder="Enter your temporary password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />

                        <Input
                            id="newPassword"
                            label="New password"
                            type="password"
                            placeholder="Create a strong password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />

                        {/* Password strength checklist */}
                        {newPassword && (
                            <ul className="space-y-1">
                                {PASSWORD_RULES.map((rule) => (
                                    <li key={rule.label} className={`flex items-center gap-2 text-xs ${rule.test(newPassword) ? 'text-success' : 'text-white-dark'}`}>
                                        <span>{rule.test(newPassword) ? '✓' : '○'}</span>
                                        {rule.label}
                                    </li>
                                ))}
                            </ul>
                        )}

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

                        <Button type="submit" size="lg" fullWidth disabled={loading || !passesAll}>
                            {loading && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            {loading ? 'Saving…' : 'Set Password & Continue'}
                        </Button>
                    </form>

                    <p className="mt-10 text-center text-xs text-white-dark">© {new Date().getFullYear()} @SmoothSurf Sacco.</p>
                </div>
            </div>
        </div>
    );
};

ChangePasswordPage.getLayout = (page: React.ReactElement) => <BlankLayout>{page}</BlankLayout>;

export default ChangePasswordPage;
