import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DateInput from '@/components/ui/DateInput';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import IconEye from '@/components/Icon/IconEye';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerUser, clearAuthError, RegisterPayload } from '@/store/slices/auth/authSlice';

const steps = ['Personal Information', 'Organization & Address', 'Next of Kin', 'Security'];

type FormState = Omit<RegisterPayload, 'nextOfKin'> & {
    confirmPassword: string;
    nextOfKin: RegisterPayload['nextOfKin'];
};

const emptyForm: FormState = {
    saccoCode: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    middleName: '',
    lastName: '',
    nationalId: '',
    dateOfBirth: '',
    gender: '' as RegisterPayload['gender'],
    occupation: '',
    kraPin: '',
    employer: '',
    county: '',
    constituency: '',
    ward: '',
    postalAddress: '',
    physicalAddress: '',
    nextOfKin: { name: '', relationship: '', phone: '', idNumber: '', address: '' },
};

const Register = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);
    const formRef = useRef<HTMLFormElement>(null);

    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [showPassword, setShowPassword] = useState(false);
    const [confirmError, setConfirmError] = useState('');

    const setField = (field: keyof Omit<FormState, 'nextOfKin'>) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const setNextOfKinField = (field: keyof FormState['nextOfKin']) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, nextOfKin: { ...prev.nextOfKin, [field]: event.target.value } }));
    };

    const goNext = () => {
        if (formRef.current?.reportValidity()) {
            setStep((current) => Math.min(current + 1, steps.length - 1));
        }
    };

    const goBack = () => setStep((current) => Math.max(current - 1, 0));

    const today = new Date().toISOString().slice(0, 10);

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        dispatch(clearAuthError());

        if (form.password !== form.confirmPassword) {
            setConfirmError('Passwords do not match');
            return;
        }
        setConfirmError('');

        const { confirmPassword, ...payload } = form;

        try {
            await dispatch(registerUser(payload as RegisterPayload)).unwrap();
            router.push(`/auth/verify-otp?purpose=register&email=${encodeURIComponent(form.email)}`);
        } catch {
            // error is already captured in auth.error via the rejected case
        }
    };

    return (
        <div className="flex h-screen items-center justify-center overflow-hidden bg-white px-4 py-3">
            <div className="w-full max-w-3xl rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col items-center">
                    <span className="inline-flex shrink-0 items-center rounded-md bg-white p-1 shadow-sm">
                        <img src="/assets/images/smoothsurf-logo.png" alt="SmoothSurf IT Consulting" className="h-8 w-auto" />
                    </span>
                    <h1 className="mt-2 text-xl font-extrabold text-primary">Create an account</h1>
                    <p className="mt-1 text-center text-sm text-white-dark">Join SmoothSurf Sacco to manage your savings and loans online</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    {steps.map((label, index) => (
                        <div key={label} className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`grid h-7 w-7 shrink-0 place-content-center rounded-full text-sm font-bold ${
                                        index <= step ? 'bg-primary text-white' : 'bg-white-light text-white-dark dark:bg-dark/40'
                                    }`}
                                >
                                    {index + 1}
                                </span>
                                <span className={`text-sm font-semibold ${index === step ? 'text-primary' : 'text-white-dark'}`}>{label}</span>
                            </div>
                            {index < steps.length - 1 && <span className="text-white-dark">»</span>}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mt-3">
                        <Alert variant="danger">{error}</Alert>
                    </div>
                )}

                <form ref={formRef} className="mt-4" onSubmit={submitForm}>
                    {step === 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input id="firstName" label="First Name *" value={form.firstName} onChange={setField('firstName')} placeholder="Enter your first name" required />
                            <Input id="lastName" label="Last Name *" value={form.lastName} onChange={setField('lastName')} placeholder="Enter your last name" required />
                            <Input id="middleName" label="Middle Name" value={form.middleName} onChange={setField('middleName')} placeholder="Enter your middle name" />
                            <Input id="nationalId" label="National ID *" value={form.nationalId} onChange={setField('nationalId')} placeholder="e.g. 31234567" required />
                            <DateInput
                                id="dateOfBirth"
                                label="Date of Birth *"
                                value={form.dateOfBirth}
                                onChange={(value) => setForm((prev) => ({ ...prev, dateOfBirth: value }))}
                                maxDate={today}
                                required
                            />
                            <div className="w-full">
                                <label htmlFor="gender" className="mb-1.5 block text-sm font-semibold">
                                    Gender *
                                </label>
                                <select id="gender" className="form-select" value={form.gender} onChange={setField('gender')} required>
                                    <option value="">Select…</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <Input id="phone" label="Phone Number *" value={form.phone} onChange={setField('phone')} placeholder="0712345678" required />
                            <Input id="email" label="Email *" type="email" value={form.email} onChange={setField('email')} placeholder="name@example.com" required />
                        </div>
                    )}

                    {step === 1 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input id="saccoCode" label="Sacco Code *" value={form.saccoCode} onChange={setField('saccoCode')} placeholder="SASRA/SACCO/0001" required />
                            <Input id="occupation" label="Occupation *" value={form.occupation} onChange={setField('occupation')} placeholder="e.g. Software Engineer" required />
                            <Input id="kraPin" label="KRA PIN" value={form.kraPin} onChange={setField('kraPin')} placeholder="A123456789B" />
                            <Input id="employer" label="Employer" value={form.employer} onChange={setField('employer')} placeholder="Enter your employer" />
                            <Input id="county" label="County" value={form.county} onChange={setField('county')} placeholder="e.g. Kiambu" />
                            <Input id="constituency" label="Constituency *" value={form.constituency} onChange={setField('constituency')} placeholder="e.g. Thika Town" required />
                            <Input id="ward" label="Ward *" value={form.ward} onChange={setField('ward')} placeholder="e.g. Township" required />
                            <Input id="postalAddress" label="Postal Address" value={form.postalAddress} onChange={setField('postalAddress')} placeholder="P.O. Box 123-01000" />
                            <div className="sm:col-span-2">
                                <Input
                                    id="physicalAddress"
                                    label="Physical Address *"
                                    value={form.physicalAddress}
                                    onChange={setField('physicalAddress')}
                                    placeholder="e.g. Makongeni, Thika"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input id="nokName" label="Full Name *" value={form.nextOfKin.name} onChange={setNextOfKinField('name')} placeholder="Jane Doe" required />
                            <Input
                                id="nokRelationship"
                                label="Relationship *"
                                value={form.nextOfKin.relationship}
                                onChange={setNextOfKinField('relationship')}
                                placeholder="e.g. Sister"
                                required
                            />
                            <Input id="nokPhone" label="Phone Number *" value={form.nextOfKin.phone} onChange={setNextOfKinField('phone')} placeholder="0798765432" required />
                            <Input id="nokIdNumber" label="ID Number *" value={form.nextOfKin.idNumber} onChange={setNextOfKinField('idNumber')} placeholder="29876543" required />
                            <div className="sm:col-span-2">
                                <Input
                                    id="nokAddress"
                                    label="Address *"
                                    value={form.nextOfKin.address}
                                    onChange={setNextOfKinField('address')}
                                    placeholder="e.g. Nakuru, Kenya"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                                id="password"
                                label="Password *"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Create a password"
                                value={form.password}
                                onChange={setField('password')}
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
                                label="Confirm Password *"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Re-enter your password"
                                value={form.confirmPassword}
                                onChange={setField('confirmPassword')}
                                required
                                error={confirmError}
                            />
                        </div>
                    )}

                    <div className="mt-5 flex items-center justify-between">
                        <Button type="button" variant="outline-primary" onClick={goBack} disabled={step === 0}>
                            Back
                        </Button>

                        {step < steps.length - 1 ? (
                            <Button type="button" onClick={goNext}>
                                Next
                            </Button>
                        ) : (
                            <Button type="submit" disabled={loading}>
                                {loading && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                                {loading ? 'Creating account…' : 'Create account'}
                            </Button>
                        )}
                    </div>
                </form>

                <div className="mt-4 text-center text-sm text-white-dark">
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
