import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyProfile, updateMyProfile, clearProfileError, UpdateMemberPayload } from '@/store/slices/profile/profileSlice';
import { fetchMyAccount, updateMyAccount, uploadMyPhoto, UpdateAccountPayload } from '@/store/slices/auth/authSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import ProfilePhotoUpload from '@/components/ui/ProfilePhotoUpload';

const emptyForm: UpdateMemberPayload = {
    occupation: '',
    employer: '',
    county: '',
    constituency: '',
    ward: '',
    postalAddress: '',
    physicalAddress: '',
};

// The working page — photo upload and editing happen right here, inline, no redirect.
// The full read-only record of everything captured at registration lives on the
// standalone /dashboard/personal-information page instead.
const ProfilePage = () => {
    const dispatch = useAppDispatch();
    const { profile, loading, saving, error } = useAppSelector((state) => state.profile);
    const authUser = useAppSelector((state) => state.auth.user);
    const isMember = !!authUser?.roles?.includes('ROLE_MEMBER');

    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [form, setForm] = useState<UpdateMemberPayload>(emptyForm);
    const [accountForm, setAccountForm] = useState<UpdateAccountPayload>({ username: '', phone: '' });
    const [savingAccount, setSavingAccount] = useState(false);

    useEffect(() => {
        if (isMember) {
            dispatch(fetchMyProfile());
        } else {
            dispatch(fetchMyAccount());
        }
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

    useEffect(() => {
        if (!authUser || isMember) return;
        setAccountForm({ username: authUser.username, phone: authUser.phone || '' });
    }, [authUser, isMember]);

    const handlePhotoUpload = async (file: File) => {
        setUploadingPhoto(true);
        try {
            await dispatch(uploadMyPhoto(file)).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Profile photo updated' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to upload photo' }));
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handlePhotoError = (message: string) => dispatch(showToast({ variant: 'danger', message }));

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await dispatch(updateMyProfile(form)).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Profile updated successfully' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update profile' }));
        }
    };

    const submitAccountForm = async (event: React.FormEvent) => {
        event.preventDefault();
        setSavingAccount(true);
        try {
            await dispatch(updateMyAccount(accountForm)).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Account updated successfully' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update account' }));
        } finally {
            setSavingAccount(false);
        }
    };

    const fullName = profile ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ') : '';

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">My Profile</h1>
                    <p className="text-white-dark">{isMember ? 'Update your contact and employment details' : 'Update your account details'}</p>
                </div>
                <Button variant="outline-primary" size="sm" href="/dashboard/personal-information">
                    View Full Registration Details
                </Button>
            </div>

            {isMember ? (
                <>
                    {error && (
                        <div className="mt-3">
                            <Alert variant="danger" onClose={() => dispatch(clearProfileError())}>
                                {error}
                            </Alert>
                        </div>
                    )}

                    {loading && !profile ? (
                        <div className="panel mt-3">Loading profile…</div>
                    ) : profile ? (
                        <div className="mt-3 panel">
                            <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
                                <ProfilePhotoUpload photoUrl={profile.user.avatarUrl} name={fullName} uploading={uploadingPhoto} onUpload={handlePhotoUpload} onError={handlePhotoError} />

                                <div>
                                    <h5 className="text-lg font-semibold">{fullName}</h5>
                                    <p className="text-white-dark">{profile.user.email}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {profile.memberNumber && <span className="badge bg-primary/80">Member No. {profile.memberNumber}</span>}
                                        {profile.user.status && <span className="badge bg-success/80">{profile.user.status}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-white-light pt-5 dark:border-white/10">
                                <h5 className="mb-3 text-lg font-semibold">Contact &amp; Employment Details</h5>
                                <form onSubmit={submitForm} className="grid gap-3 sm:grid-cols-2">
                                    <Input
                                        id="occupation"
                                        label="Occupation *"
                                        value={form.occupation}
                                        onChange={(e) => setForm((prev) => ({ ...prev, occupation: e.target.value }))}
                                        required
                                    />
                                    <Input id="employer" label="Employer" value={form.employer} onChange={(e) => setForm((prev) => ({ ...prev, employer: e.target.value }))} />
                                    <Input
                                        id="county"
                                        label="County"
                                        value={form.county}
                                        onChange={(e) => setForm((prev) => ({ ...prev, county: e.target.value }))}
                                        placeholder="e.g. Nairobi"
                                    />
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
                                            {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                                            {saving ? 'Saving…' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : null}
                </>
            ) : (
                <div className="mt-3 panel">
                    {!authUser ? (
                        <div>Loading profile…</div>
                    ) : (
                        <>
                            <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
                                <ProfilePhotoUpload photoUrl={authUser.avatarUrl} name={authUser.username} uploading={uploadingPhoto} onUpload={handlePhotoUpload} onError={handlePhotoError} />

                                <div>
                                    <h5 className="text-lg font-semibold">{authUser.username}</h5>
                                    <p className="text-white-dark">{authUser.email}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {authUser.roles?.map((role) => (
                                            <span key={role} className="badge bg-primary/80">
                                                {role}
                                            </span>
                                        ))}
                                        {authUser.status && <span className="badge bg-success/80">{authUser.status}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-white-light pt-5 dark:border-white/10">
                                <h5 className="mb-3 text-lg font-semibold">Account Details</h5>
                                <form onSubmit={submitAccountForm} className="grid gap-3 sm:grid-cols-2">
                                    <Input
                                        id="username"
                                        label="Username *"
                                        value={accountForm.username}
                                        onChange={(e) => setAccountForm((prev) => ({ ...prev, username: e.target.value }))}
                                        required
                                    />
                                    <Input
                                        id="phone"
                                        label="Phone"
                                        value={accountForm.phone}
                                        onChange={(e) => setAccountForm((prev) => ({ ...prev, phone: e.target.value }))}
                                        placeholder="e.g. 0712345678"
                                    />

                                    <div className="flex items-center justify-end pt-2 sm:col-span-2">
                                        <Button type="submit" disabled={savingAccount}>
                                            {savingAccount && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                                            {savingAccount ? 'Saving…' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
