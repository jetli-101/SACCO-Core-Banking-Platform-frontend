import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMembers, clearMembersError } from '@/store/slices/members/membersSlice';
import { MemberProfile } from '@/store/slices/profile/profileSlice';
import DataGrid from '@/components/ui/DataGrid';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import Breadcrumb from '@/components/ui/Breadcrumb';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconUsers from '@/components/Icon/IconUsers';

const MemberDirectoryPage = () => {
    const dispatch = useAppDispatch();
    const { members, loading, error } = useAppSelector((state) => state.members);

    const [viewing, setViewing] = useState<MemberProfile | null>(null);

    useEffect(() => {
        dispatch(fetchMembers());
    }, [dispatch]);

    const fullName = (member: MemberProfile) => [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Administration' }, { label: 'Member Directory' }]} />

            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Member Directory</h1>
                    <p className="text-white-dark">Every member registered under your Sacco</p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-sm">
                <StatCard label="Total Members" value={members.length} icon={<IconUsers className="h-4 w-4" />} />
            </div>

            {error && (
                <div className="mt-5">
                    <Alert variant="danger" onClose={() => dispatch(clearMembersError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <div className="panel mt-5">
                <div className="mb-5">
                    <h5 className="text-lg font-semibold">Members</h5>
                    <p className="text-sm text-white-dark">View every member&lsquo;s profile and account status</p>
                </div>

                <DataGrid
                    columns={[
                        {
                            header: 'Actions',
                            accessor: (row: MemberProfile) => <RowActionsMenu onView={() => setViewing(row)} label={`Actions for ${fullName(row)}`} />,
                        },
                        { header: 'Member No.', accessor: (row: MemberProfile) => row.memberNumber || '—' },
                        { header: 'Name', accessor: (row: MemberProfile) => fullName(row) },
                        { header: 'National ID', accessor: 'nationalId' },
                        { header: 'Email', accessor: (row: MemberProfile) => row.user.email },
                        { header: 'Phone', accessor: (row: MemberProfile) => row.user.phone || '—' },
                        { header: 'County', accessor: (row: MemberProfile) => row.county || '—' },
                        { header: 'Status', accessor: (row: MemberProfile) => row.user.status || '—' },
                    ]}
                    data={members}
                    rowKey={(row) => row.id}
                    searchKeys={['memberNumber', 'firstName', 'lastName', 'nationalId']}
                    searchPlaceholder="Search members..."
                    loading={loading}
                    emptyMessage="No members yet"
                    toolbarActions={
                        <Button variant="outline-primary" size="sm" onClick={() => dispatch(fetchMembers())}>
                            <IconRefresh className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Refresh
                        </Button>
                    }
                />
            </div>

            <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Member Profile" size="lg">
                {viewing && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <span className="text-sm text-white-dark">Full Name</span>
                            <p className="font-semibold">{fullName(viewing)}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">Member Number</span>
                            <p className="font-semibold">{viewing.memberNumber || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">National ID</span>
                            <p className="font-semibold">{viewing.nationalId}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">Date of Birth</span>
                            <p className="font-semibold">{viewing.dateOfBirth || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">Gender</span>
                            <p className="font-semibold">{viewing.gender || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">KRA PIN</span>
                            <p className="font-semibold">{viewing.kraPin || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">Occupation</span>
                            <p className="font-semibold">{viewing.occupation || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">Employer</span>
                            <p className="font-semibold">{viewing.employer || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">County / Constituency / Ward</span>
                            <p className="font-semibold">{[viewing.county, viewing.constituency, viewing.ward].filter(Boolean).join(' / ') || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">Physical Address</span>
                            <p className="font-semibold">{viewing.physicalAddress || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">Email</span>
                            <p className="font-semibold">{viewing.user.email}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">Phone</span>
                            <p className="font-semibold">{viewing.user.phone || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">Account Status</span>
                            <p className="font-semibold">{viewing.user.status || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-white-dark">Roles</span>
                            <p className="font-semibold">{viewing.user.roles?.length ? viewing.user.roles.join(', ') : '—'}</p>
                        </div>

                        {viewing.nextOfKin && (
                            <div className="border-t border-white-light pt-4 sm:col-span-2 dark:border-white/10">
                                <h6 className="font-semibold">Next of Kin</h6>
                                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                                    <p>
                                        <span className="text-white-dark">Name:</span> {viewing.nextOfKin.name}
                                    </p>
                                    <p>
                                        <span className="text-white-dark">Relationship:</span> {viewing.nextOfKin.relationship}
                                    </p>
                                    <p>
                                        <span className="text-white-dark">Phone:</span> {viewing.nextOfKin.phone}
                                    </p>
                                    <p>
                                        <span className="text-white-dark">ID Number:</span> {viewing.nextOfKin.idNumber}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end pt-2 sm:col-span-2">
                            <Button type="button" variant="outline-primary" onClick={() => setViewing(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MemberDirectoryPage;
