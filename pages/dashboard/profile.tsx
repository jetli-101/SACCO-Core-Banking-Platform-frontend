import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyProfile, updateMyProfile, clearProfileError, UpdateMemberPayload } from '@/store/slices/profile/profileSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import IconUser from '@/components/Icon/IconUser';

const emptyForm: UpdateMemberPayload = {
    occupation: '',
    employer: '',
    county: '',
    constituency: '',
    ward: '',
    postalAddress: '',
    physicalAddress: '',
};

const ProfilePage = () => {
    const dispatch = useAppDispatch();
    const { profile, loading, saving, error } = useAppSelector((state) => state.profile);
    const authUser = useAppSelector((state) => state.auth.user);
    const isMember = !!authUser?.roles?.includes('ROLE_MEMBER');

    const [form, setForm] = useState<UpdateMemberPayload>(emptyForm);

    useEffect(() => {
        if (isMember) dispatch(fetchMyProfile());
    }, [dispatch, isMember]);

    useEffect(() => {
        if (!profile) return;
        setForm({
            occupation: profile.occupation || '',
            employer: profile.employer || '',
            county: profile.county || '',
            constituency: profile.constituency || '',
            ward: profile.ward || '',
            postalAddress: profile.postalAddress || '',
            physicalAddress: profile.physicalAddress || '',
        });
    }, [profile]);

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await dispatch(updateMyProfile(form)).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Profile updated successfully' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update profile' }));
        }
    };

    const fullName = profile ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ') : '';

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]} />

            <div className="mt-4">
                <h1 className="text-2xl font-bold">My Profile</h1>
                <p className="text-white-dark">View your membership details and update your contact information</p>
            </div>

            {!isMember ? (
                <div className="mt-5">
                    <Alert variant="info">
                        Staff accounts ({authUser?.roles?.join(', ') || 'this role'}) don&apos;t have a SACCO member profile — this page only applies to member accounts.
                    </Alert>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="mt-5">
                            <Alert variant="danger" onClose={() => dispatch(clearProfileError())}>
                                {error}
                            </Alert>
                        </div>
                    )}

                    {loading && !profile ? (
                        <div className="panel mt-5">Loading profile…</div>
                    ) : profile ? (
                        <div className="mt-5 grid gap-5 lg:grid-cols-3">
                            <div className="panel lg:col-span-1">
                                <div className="flex flex-col items-center text-center">
                                    <div className="grid h-20 w-20 place-content-center rounded-full bg-primary-light text-primary dark:bg-primary dark:text-primary-light">
                                        <IconUser className="h-10 w-10" />
                                    </div>
                                    <h5 className="mt-4 text-lg font-semibold">{fullName}</h5>
                                    <p className="text-white-dark">{profile.user.email}</p>
                                    {profile.memberNumber && <span className="badge mt-2 bg-primary/80">Member No. {profile.memberNumber}</span>}
                                </div>

                                <div className="mt-5 space-y-3 border-t border-white-light pt-5 dark:border-white/10">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white-dark">National ID</span>
                                        <span className="font-semibold">{profile.nationalId}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white-dark">Date of Birth</span>
                                        <span className="font-semibold">{profile.dateOfBirth || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white-dark">Gender</span>
                                        <span className="font-semibold">{profile.gender || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white-dark">KRA PIN</span>
                                        <span className="font-semibold">{profile.kraPin || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white-dark">Phone</span>
                                        <span className="font-semibold">{profile.user.phone || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white-dark">Status</span>
                                        <span className="font-semibold">{profile.user.status || '—'}</span>
                                    </div>
                                </div>

                                <p className="mt-4 text-xs text-white-dark">
                                    Identity details above are KYC data set at registration. Contact support if any of it needs correcting.
                                </p>
                            </div>

                            <div className="panel lg:col-span-2">
                                <div className="mb-5">
                                    <h5 className="text-lg font-semibold">Contact &amp; Employment Details</h5>
                                    <p className="text-sm text-white-dark">Keep this information up to date — it&apos;s used for correspondence and statements</p>
                                </div>

                                <form onSubmit={submitForm} className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        id="occupation"
                                        label="Occupation *"
                                        value={form.occupation}
                                        onChange={(e) => setForm((prev) => ({ ...prev, occupation: e.target.value }))}
                                        required
                                    />
                                    <Input id="employer" label="Employer" value={form.employer} onChange={(e) => setForm((prev) => ({ ...prev, employer: e.target.value }))} />
                                    <Input id="county" label="County" value={form.county} onChange={(e) => setForm((prev) => ({ ...prev, county: e.target.value }))} placeholder="e.g. Nairobi" />
                                    <Input
                                        id="constituency"
                                        label="Constituency *"
                                        value={form.constituency}
                                        onChange={(e) => setForm((prev) => ({ ...prev, constituency: e.target.value }))}
                                        required
                                    />
                                    <Input id="ward" label="Ward *" value={form.ward} onChange={(e) => setForm((prev) => ({ ...prev, ward: e.target.value }))} required />
                                    <Input
                                        id="postalAddress"
                                        label="Postal Address"
                                        value={form.postalAddress}
                                        onChange={(e) => setForm((prev) => ({ ...prev, postalAddress: e.target.value }))}
                                    />
                                    <div className="sm:col-span-2">
                                        <Input
                                            id="physicalAddress"
                                            label="Physical Address *"
                                            value={form.physicalAddress}
                                            onChange={(e) => setForm((prev) => ({ ...prev, physicalAddress: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="flex items-center justify-end pt-2 sm:col-span-2">
                                        <Button type="submit" disabled={saving}>
                                            {saving ? 'Saving…' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>

                                {profile.nextOfKin && (
                                    <div className="mt-6 border-t border-white-light pt-5 dark:border-white/10">
                                        <h5 className="text-lg font-semibold">Next of Kin</h5>
                                        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                                            <div>
                                                <span className="text-white-dark">Name</span>
                                                <p className="font-semibold">{profile.nextOfKin.name}</p>
                                            </div>
                                            <div>
                                                <span className="text-white-dark">Relationship</span>
                                                <p className="font-semibold">{profile.nextOfKin.relationship}</p>
                                            </div>
                                            <div>
                                                <span className="text-white-dark">Phone</span>
                                                <p className="font-semibold">{profile.nextOfKin.phone}</p>
                                            </div>
                                            <div>
                                                <span className="text-white-dark">ID Number</span>
                                                <p className="font-semibold">{profile.nextOfKin.idNumber}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
};

export default ProfilePage;
