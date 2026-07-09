import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMemberById, updateMember, clearSelectedMember } from '@/store/slices/members/membersSlice';
import { UpdateMemberPayload } from '@/store/slices/profile/profileSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import { resolveFileUrl } from '@/urlhelper';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Tabs from '@/components/ui/Tabs';
import PageLoader from '@/components/ui/PageLoader';

const emptyForm: UpdateMemberPayload = {
    occupation: '',
    employer: '',
    county: '',
    constituency: '',
    ward: '',
    postalAddress: '',
    physicalAddress: '',
};

const TABS = [
    { key: 'personal', label: 'Personal Information' },
    { key: 'contact', label: 'Organization & Address' },
    { key: 'nextOfKin', label: 'Next of Kin' },
    { key: 'security', label: 'Security' },
];

const MemberDetailPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const id = typeof router.query.id === 'string' ? router.query.id : undefined;
    const { selectedMember: member, selectedLoading: loading, selectedError: error, saving } = useAppSelector((state) => state.members);

    const [activeTab, setActiveTab] = useState('personal');
    const [form, setForm] = useState<UpdateMemberPayload>(emptyForm);

    useEffect(() => {
        if (id) dispatch(fetchMemberById(id));
        return () => {
            dispatch(clearSelectedMember());
        };
    }, [dispatch, id]);

    useEffect(() => {
        if (!member) return;
        setForm({
            occupation: member.occupation || '',
            employer: member.employer || '',
            county: member.county || '',
            constituency: member.constituency || '',
            ward: member.ward || '',
            postalAddress: member.postalAddress || '',
            physicalAddress: member.physicalAddress || '',
        });
    }, [member]);

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!id) return;
        try {
            await dispatch(updateMember({ id, payload: form })).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Member updated successfully' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update member' }));
        }
    };

    const fullName = member ? [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ') : '';

    return (
        <div>
            <Breadcrumb trailingLabel={fullName || undefined} />

            {loading && !member ? (
                <PageLoader />
            ) : error ? (
                <div className="mt-3">
                    <Alert variant="danger">{error}</Alert>
                </div>
            ) : member ? (
                <div className="mt-3">
                    <div className="panel">
                        <div className="flex items-center gap-4">
                            <Avatar src={resolveFileUrl(member.passportPhotoUrl)} name={fullName} size="xl" />
                            <div>
                                <h5 className="text-lg font-semibold">{fullName}</h5>
                                <p className="text-sm text-white-dark">Member No: {member.memberNumber || '—'}</p>
                                <span className="badge mt-1 inline-block bg-success/80">{member.user.status || '—'}</span>
                            </div>
                        </div>

                        <div className="mt-5">
                            <Tabs items={TABS} active={activeTab} onChange={setActiveTab} variant="boxed" />
                        </div>

                        {activeTab === 'personal' && (
                            <div className="mt-5">
                                <h6 className="mb-3 font-semibold">Personal &amp; Identification Details</h6>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <Input id="firstName" label="First Name" value={member.firstName} disabled />
                                    <Input id="middleName" label="Middle Name" value={member.middleName || ''} disabled />
                                    <Input id="lastName" label="Last Name" value={member.lastName} disabled />
                                    <Input id="nationalId" label="National ID" value={member.nationalId} disabled />
                                    <Input id="dateOfBirth" label="Date of Birth" value={member.dateOfBirth || ''} disabled />
                                    <Input id="gender" label="Gender" value={member.gender || ''} disabled />
                                    <Input id="kraPin" label="KRA PIN" value={member.kraPin || ''} disabled />
                                    <Input id="email" label="Email" value={member.user.email} disabled />
                                    <Input id="phone" label="Phone" value={member.user.phone || ''} disabled />
                                </div>
                                <p className="mt-3 text-xs text-white-dark">KYC identity data captured at registration — not editable here.</p>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <form onSubmit={submitForm} className="mt-5">
                                <h6 className="mb-3 font-semibold">Organization &amp; Address</h6>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                                    <div className="sm:col-span-2 lg:col-span-3">
                                        <Input
                                            id="physicalAddress"
                                            label="Physical Address *"
                                            value={form.physicalAddress}
                                            onChange={(e) => setForm((prev) => ({ ...prev, physicalAddress: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-end">
                                    <Button type="submit" disabled={saving}>
                                        {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                                        {saving ? 'Saving…' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'nextOfKin' && (
                            <div className="mt-5">
                                <h6 className="mb-3 font-semibold">Next of Kin</h6>
                                {member.nextOfKin ? (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <Input id="kinName" label="Name" value={member.nextOfKin.name} disabled />
                                        <Input id="kinRelationship" label="Relationship" value={member.nextOfKin.relationship} disabled />
                                        <Input id="kinPhone" label="Phone" value={member.nextOfKin.phone} disabled />
                                        <Input id="kinIdNumber" label="ID Number" value={member.nextOfKin.idNumber} disabled />
                                        <div className="sm:col-span-2">
                                            <Input id="kinAddress" label="Address" value={member.nextOfKin.address} disabled />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-white-dark">No next of kin on record.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="mt-5">
                                <h6 className="mb-3 font-semibold">Security &amp; Access</h6>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <Input id="secStatus" label="Account Status" value={member.user.status || ''} disabled />
                                    <Input id="secEmail" label="Email Address" value={member.user.email} disabled />
                                    <Input id="secLastLogin" label="Last Login" value={member.user.lastLoginAt ? new Date(member.user.lastLoginAt).toLocaleString() : 'Never'} disabled />
                                    <Input id="secMemberSince" label="Member Since" value={member.user.createdAt ? new Date(member.user.createdAt).toLocaleDateString() : ''} disabled />
                                    <Input id="secPassword" label="Password" value="••••••••••••" disabled helperText="Password is encrypted and cannot be displayed." />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default MemberDetailPage;
