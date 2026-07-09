import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMembers, clearMembersError } from '@/store/slices/members/membersSlice';
import { MemberProfile } from '@/store/slices/profile/profileSlice';
import DataGrid from '@/components/ui/DataGrid';
import StatCard from '@/components/ui/StatCard';
import Alert from '@/components/ui/Alert';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import Breadcrumb from '@/components/ui/Breadcrumb';
import PageLoader from '@/components/ui/PageLoader';
import IconUsers from '@/components/Icon/IconUsers';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconClock from '@/components/Icon/IconClock';
import IconUserPlus from '@/components/Icon/IconUserPlus';

const MemberDirectoryPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { members, loading, error } = useAppSelector((state) => state.members);

    useEffect(() => {
        dispatch(fetchMembers());
    }, [dispatch]);

    const activeCount = members.filter((member) => member.user.status === 'ACTIVE').length;
    const pendingCount = members.filter((member) => member.user.status === 'PENDING').length;
    const femaleCount = members.filter((member) => member.gender === 'FEMALE').length;
    const femalePct = members.length ? Math.round((femaleCount / members.length) * 100) : 0;

    if (loading && members.length === 0) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Members</h1>
                    <p className="text-white-dark">Every member registered under your Sacco</p>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Members" value={members.length} icon={<IconUsers className="h-4 w-4" />} />
                <StatCard label="Active" value={activeCount} icon={<IconCircleCheck className="h-4 w-4" />} />
                <StatCard label="Pending Approval" value={pendingCount} icon={<IconClock className="h-4 w-4" />} />
                <StatCard label="Female Members" value={`${femalePct}%`} icon={<IconUserPlus className="h-4 w-4" />} />
            </div>

            {error && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearMembersError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <DataGrid
                className="mt-3"
                title="Members"
                count={members.length}
                exportable
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: MemberProfile) => (
                            <RowActionsMenu
                                onView={() => router.push(`/dashboard/admin/member-directory/${row.id}`)}
                                label={`Actions for ${[row.firstName, row.lastName].filter(Boolean).join(' ')}`}
                            />
                        ),
                    },
                    { header: 'Member No.', accessor: (row: MemberProfile) => row.memberNumber || '—' },
                    { header: 'First Name', accessor: 'firstName' },
                    { header: 'Middle Name', accessor: (row: MemberProfile) => row.middleName || '—' },
                    { header: 'Last Name', accessor: 'lastName' },
                    { header: 'National ID', accessor: 'nationalId' },
                    { header: 'Date of Birth', accessor: (row: MemberProfile) => row.dateOfBirth || '—' },
                    { header: 'Email', accessor: (row: MemberProfile) => row.user.email },
                    { header: 'Status', accessor: (row: MemberProfile) => row.user.status || '—' },
                ]}
                data={members}
                rowKey={(row) => row.id}
                searchKeys={['memberNumber', 'firstName', 'lastName', 'nationalId']}
                searchPlaceholder="Search members..."
                loading={loading}
                emptyMessage="No members yet"
                onRefresh={() => dispatch(fetchMembers())}
            />
        </div>
    );
};

export default MemberDirectoryPage;
