import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyProfile } from '@/store/slices/profile/profileSlice';
import { fetchMyAccount } from '@/store/slices/auth/authSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';

// Personal Information Management (PIM) — standalone, read-only record of everything
// captured at registration. No forms here; editing happens inline on /dashboard/profile.
const PersonalInformationPage = () => {
    const dispatch = useAppDispatch();
    const { profile, loading } = useAppSelector((state) => state.profile);
    const authUser = useAppSelector((state) => state.auth.user);
    const isMember = !!authUser?.roles?.includes('ROLE_MEMBER');

    useEffect(() => {
        if (isMember) {
            dispatch(fetchMyProfile());
        } else {
            dispatch(fetchMyAccount());
        }
    }, [dispatch, isMember]);

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3">
                <h1 className="text-xl font-bold">Personal Information</h1>
                <p className="text-white-dark">Everything captured when this account was registered</p>
            </div>

            {isMember ? (
                loading && !profile ? (
                    <div className="panel mt-3">Loading…</div>
                ) : profile ? (
                    <div className="mt-3 space-y-3">
                        <div className="panel">
                            <h5 className="mb-3 text-lg font-semibold">Identity Details</h5>
                            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Member Number</span>
                                    <span className="font-semibold">{profile.memberNumber || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">First Name</span>
                                    <span className="font-semibold">{profile.firstName}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Middle Name</span>
                                    <span className="font-semibold">{profile.middleName || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Last Name</span>
                                    <span className="font-semibold">{profile.lastName}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">National ID</span>
                                    <span className="font-semibold">{profile.nationalId}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Date of Birth</span>
                                    <span className="font-semibold">{profile.dateOfBirth || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Gender</span>
                                    <span className="font-semibold">{profile.gender || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">KRA PIN</span>
                                    <span className="font-semibold">{profile.kraPin || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Email</span>
                                    <span className="font-semibold">{profile.user.email}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Phone</span>
                                    <span className="font-semibold">{profile.user.phone || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Status</span>
                                    <span className="font-semibold">{profile.user.status || '—'}</span>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-white-dark">KYC data captured at registration — contact support if any of it needs correcting.</p>
                        </div>

                        <div className="panel">
                            <h5 className="mb-3 text-lg font-semibold">Organization &amp; Address</h5>
                            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Occupation</span>
                                    <span className="font-semibold">{profile.occupation || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Employer</span>
                                    <span className="font-semibold">{profile.employer || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">County</span>
                                    <span className="font-semibold">{profile.county || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Constituency</span>
                                    <span className="font-semibold">{profile.constituency || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Ward</span>
                                    <span className="font-semibold">{profile.ward || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                    <span className="text-white-dark">Postal Address</span>
                                    <span className="font-semibold">{profile.postalAddress || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10 sm:col-span-2 lg:col-span-1">
                                    <span className="text-white-dark">Physical Address</span>
                                    <span className="font-semibold">{profile.physicalAddress || '—'}</span>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-white-dark">Editable from the Profile page.</p>
                        </div>

                        {profile.nextOfKin && (
                            <div className="panel">
                                <h5 className="mb-3 text-lg font-semibold">Next of Kin</h5>
                                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                        <span className="text-white-dark">Name</span>
                                        <span className="font-semibold">{profile.nextOfKin.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                        <span className="text-white-dark">Relationship</span>
                                        <span className="font-semibold">{profile.nextOfKin.relationship}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                        <span className="text-white-dark">Phone</span>
                                        <span className="font-semibold">{profile.nextOfKin.phone}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                                        <span className="text-white-dark">ID Number</span>
                                        <span className="font-semibold">{profile.nextOfKin.idNumber}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null
            ) : !authUser ? (
                <div className="panel mt-3">Loading…</div>
            ) : (
                <div className="mt-3 panel">
                    <h5 className="mb-3 text-lg font-semibold">Account Details</h5>
                    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                            <span className="text-white-dark">Username</span>
                            <span className="font-semibold">{authUser.username}</span>
                        </div>
                        <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                            <span className="text-white-dark">Email</span>
                            <span className="font-semibold">{authUser.email}</span>
                        </div>
                        <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                            <span className="text-white-dark">Phone</span>
                            <span className="font-semibold">{authUser.phone || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                            <span className="text-white-dark">Roles</span>
                            <span className="font-semibold">{authUser.roles?.join(', ') || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                            <span className="text-white-dark">Status</span>
                            <span className="font-semibold">{authUser.status || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                            <span className="text-white-dark">Sacco</span>
                            <span className="font-semibold">{authUser.saccoName || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white-light pb-1.5 dark:border-white/10">
                            <span className="text-white-dark">Member Since</span>
                            <span className="font-semibold">{authUser.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : '—'}</span>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-white-dark">Username and phone are editable from the Profile page. Other details are set by a SYSTEM_ADMINISTRATOR.</p>
                </div>
            )}
        </div>
    );
};

export default PersonalInformationPage;
