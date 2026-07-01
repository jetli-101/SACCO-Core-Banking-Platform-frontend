import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyProfile } from '@/store/slices/profile/profileSlice';
import { fetchMyAccount } from '@/store/slices/auth/authSlice';
import { resolveFileUrl } from '@/urlhelper';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';

const MEMBER_TABS = [
    { key: 'personal', label: 'Personal Information' },
    { key: 'contact', label: 'Organization & Address' },
    { key: 'nextOfKin', label: 'Next of Kin' },
    { key: 'security', label: 'Security' },
];

const STAFF_TABS = [
    { key: 'account', label: 'Account Details' },
    { key: 'security', label: 'Security' },
];

// Personal Information Management (PIM) — standalone, read-only record of everything
// captured at registration. No forms here; editing happens inline on /dashboard/profile.
const PersonalInformationPage = () => {
    const dispatch = useAppDispatch();
    const { profile, loading } = useAppSelector((state) => state.profile);
    const authUser = useAppSelector((state) => state.auth.user);
    const isMember = !!authUser?.roles?.includes('ROLE_MEMBER');

    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        if (isMember) {
            dispatch(fetchMyProfile());
        } else {
            dispatch(fetchMyAccount());
        }
        setActiveTab(isMember ? 'personal' : 'account');
    }, [dispatch, isMember]);

    const fullName = profile ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ') : '';

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
                    <div className="mt-3 panel">
                        <div className="flex items-center gap-4">
                            <Avatar src={resolveFileUrl(profile.user.avatarUrl)} name={fullName} size="xl" />
                            <div>
                                <h5 className="text-lg font-semibold">{fullName}</h5>
                                <p className="text-sm text-white-dark">Member No: {profile.memberNumber || '—'}</p>
                                <span className="badge mt-1 inline-block bg-success/80">{profile.user.status || '—'}</span>
                            </div>
                        </div>

                        <div className="mt-5">
                            <Tabs items={MEMBER_TABS} active={activeTab} onChange={setActiveTab} variant="boxed" />
                        </div>

                        {activeTab === 'personal' && (
                            <div>
                                <h6 className="mb-3 font-semibold">Personal &amp; Identification Details</h6>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <Input id="firstName" label="First Name" value={profile.firstName} disabled />
                                    <Input id="middleName" label="Middle Name" value={profile.middleName || ''} disabled />
                                    <Input id="lastName" label="Last Name" value={profile.lastName} disabled />
                                    <Input id="nationalId" label="National ID" value={profile.nationalId} disabled />
                                    <Input id="dateOfBirth" label="Date of Birth" value={profile.dateOfBirth || ''} disabled />
                                    <Input id="gender" label="Gender" value={profile.gender || ''} disabled />
                                    <Input id="kraPin" label="KRA PIN" value={profile.kraPin || ''} disabled />
                                    <Input id="email" label="Email" value={profile.user.email} disabled />
                                    <Input id="phone" label="Phone" value={profile.user.phone || ''} disabled />
                                </div>
                                <p className="mt-3 text-xs text-white-dark">KYC data captured at registration — contact support if any of it needs correcting.</p>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div>
                                <h6 className="mb-3 font-semibold">Organization &amp; Address</h6>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <Input id="occupation" label="Occupation" value={profile.occupation || ''} disabled />
                                    <Input id="employer" label="Employer" value={profile.employer || ''} disabled />
                                    <Input id="county" label="County" value={profile.county || ''} disabled />
                                    <Input id="constituency" label="Constituency" value={profile.constituency || ''} disabled />
                                    <Input id="ward" label="Ward" value={profile.ward || ''} disabled />
                                    <Input id="postalAddress" label="Postal Address" value={profile.postalAddress || ''} disabled />
                                    <div className="sm:col-span-2 lg:col-span-3">
                                        <Input id="physicalAddress" label="Physical Address" value={profile.physicalAddress || ''} disabled />
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-white-dark">Editable from the Profile page.</p>
                            </div>
                        )}

                        {activeTab === 'nextOfKin' && (
                            <div>
                                <h6 className="mb-3 font-semibold">Next of Kin</h6>
                                {profile.nextOfKin ? (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <Input id="kinName" label="Name" value={profile.nextOfKin.name} disabled />
                                        <Input id="kinRelationship" label="Relationship" value={profile.nextOfKin.relationship} disabled />
                                        <Input id="kinPhone" label="Phone" value={profile.nextOfKin.phone} disabled />
                                        <Input id="kinIdNumber" label="ID Number" value={profile.nextOfKin.idNumber} disabled />
                                        <div className="sm:col-span-2">
                                            <Input id="kinAddress" label="Address" value={profile.nextOfKin.address} disabled />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-white-dark">No next of kin on record.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div>
                                <h6 className="mb-3 font-semibold">Security &amp; Access</h6>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <Input id="secStatus" label="Account Status" value={profile.user.status || ''} disabled />
                                    <Input id="secEmail" label="Email Address" value={profile.user.email} disabled />
                                    <Input id="secLastLogin" label="Last Login" value={profile.user.lastLoginAt ? new Date(profile.user.lastLoginAt).toLocaleString() : 'Never'} disabled />
                                    <Input id="secMemberSince" label="Member Since" value={profile.user.createdAt ? new Date(profile.user.createdAt).toLocaleDateString() : ''} disabled />
                                    <Input id="secPassword" label="Password" value="••••••••••••" disabled helperText="Password is encrypted and cannot be displayed." />
                                </div>
                            </div>
                        )}
                    </div>
                ) : null
            ) : !authUser ? (
                <div className="panel mt-3">Loading…</div>
            ) : (
                <div className="mt-3 panel">
                    <div className="flex items-center gap-4">
                        <Avatar src={resolveFileUrl(authUser.avatarUrl)} name={authUser.username} size="xl" />
                        <div>
                            <h5 className="text-lg font-semibold">{authUser.username}</h5>
                            <p className="text-sm text-white-dark">{authUser.roles?.join(', ') || '—'}</p>
                            <span className="badge mt-1 inline-block bg-success/80">{authUser.status || '—'}</span>
                        </div>
                    </div>

                    <div className="mt-5">
                        <Tabs items={STAFF_TABS} active={activeTab} onChange={setActiveTab} variant="boxed" />
                    </div>

                    {activeTab === 'account' && (
                        <div>
                            <h6 className="mb-3 font-semibold">Account &amp; Identification Details</h6>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <Input id="username" label="Username" value={authUser.username} disabled />
                                <Input id="email" label="Email" value={authUser.email} disabled />
                                <Input id="phone" label="Phone" value={authUser.phone || ''} disabled />
                                <Input id="sacco" label="Sacco" value={authUser.saccoName || ''} disabled />
                                <Input id="createdAt" label="Member Since" value={authUser.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : ''} disabled />
                            </div>
                            <p className="mt-3 text-xs text-white-dark">Username and phone are editable from the Profile page. Other details are set by a SYSTEM_ADMINISTRATOR.</p>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h6 className="mb-3 font-semibold">Security &amp; Access</h6>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <Input id="secStatus" label="Account Status" value={authUser.status || ''} disabled />
                                <Input id="secEmail" label="Email Address" value={authUser.email} disabled />
                                <Input id="secLastLogin" label="Last Login" value={authUser.lastLoginAt ? new Date(authUser.lastLoginAt).toLocaleString() : 'Never'} disabled />
                                <Input id="secMemberSince" label="Member Since" value={authUser.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : ''} disabled />
                                <Input id="secPassword" label="Password" value="••••••••••••" disabled helperText="Password is encrypted and cannot be displayed." />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PersonalInformationPage;
