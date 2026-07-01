import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useAppSelector } from '@/store/hooks';
import { isStaffRole } from '@/utils/roles';
import Breadcrumb from '@/components/ui/Breadcrumb';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import MemberDashboard from '@/components/dashboard/MemberDashboard';

const Dashboard = () => {
    const dispatch = useDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const isStaff = isStaffRole(user?.roles);

    useEffect(() => {
        dispatch(setPageTitle('Dashboard'));
    });

    return (
        <div>
            <Breadcrumb />
            {isStaff ? <AdminDashboard user={user} /> : <MemberDashboard user={user} />}
        </div>
    );
};

export default Dashboard;
