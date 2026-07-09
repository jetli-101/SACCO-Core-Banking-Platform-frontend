import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMembers } from '@/store/slices/members/membersSlice';
import { fetchUsers } from '@/store/slices/users/usersSlice';
import { fetchMyMenu } from '@/store/slices/modules/modulesSlice';
import { fetchLoans } from '@/store/slices/loans/loansSlice';
import { AuthUser } from '@/store/slices/auth/authSlice';
import { primaryRoleLabel, isStaffRole } from '@/utils/roles';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import GreetingHeader from './GreetingHeader';
import ModuleLauncher from './ModuleLauncher';
import MembershipTrendCard from './widgets/MembershipTrendCard';
import LoanDisbursementBarCard from './widgets/LoanDisbursementBarCard';
import MemberStatusDonutCard from './widgets/MemberStatusDonutCard';
import PendingApprovalsList from './widgets/PendingApprovalsList';
import FinancialOverviewPlaceholder from './widgets/FinancialOverviewPlaceholder';
import IconUsers from '@/components/Icon/IconUsers';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconClock from '@/components/Icon/IconClock';
import IconUsersGroup from '@/components/Icon/IconUsersGroup';

interface AdminDashboardProps {
    user?: AuthUser | null;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
    const dispatch = useAppDispatch();
    const { members } = useAppSelector((state) => state.members);
    const { users } = useAppSelector((state) => state.users);
    const { menuGroups, menuLoading } = useAppSelector((state) => state.modules);
    const { loans } = useAppSelector((state) => state.loans);

    useEffect(() => {
        dispatch(fetchMembers());
        dispatch(fetchUsers());
        dispatch(fetchMyMenu());
        dispatch(fetchLoans());
    }, [dispatch]);

    const activeCount = members.filter((member) => member.user.status === 'ACTIVE').length;
    const pendingCount = members.filter((member) => member.user.status === 'PENDING').length;
    const staffCount = users.filter((appUser) => isStaffRole(appUser.roles)).length;

    return (
        <div className="pt-3">
            <GreetingHeader username={user?.username} roleLabel={primaryRoleLabel(user?.roles)} roleVariant="secondary" />

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Members" value={members.length} icon={<IconUsers className="h-4 w-4" />} />
                <StatCard label="Active Members" value={activeCount} icon={<IconCircleCheck className="h-4 w-4" />} iconClassName="bg-success-light text-success" />
                <StatCard label="Pending Approvals" value={pendingCount} icon={<IconClock className="h-4 w-4" />} iconClassName="bg-warning-light text-warning" />
                <StatCard label="Staff Users" value={staffCount} icon={<IconUsersGroup className="h-4 w-4" />} iconClassName="bg-info-light text-info" />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="flex flex-col gap-3 lg:col-span-2">
                    <Card title="Your Modules">
                        <ModuleLauncher groups={menuGroups} loading={menuLoading} />
                    </Card>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <MembershipTrendCard />
                        <LoanDisbursementBarCard loans={loans} />
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <MemberStatusDonutCard members={members} />
                    <PendingApprovalsList members={members} />
                </div>
            </div>

            <div className="mt-3">
                <FinancialOverviewPlaceholder />
            </div>
        </div>
    );
};

export default AdminDashboard;
