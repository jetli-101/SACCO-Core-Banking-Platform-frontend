import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyProfile } from '@/store/slices/profile/profileSlice';
import { fetchMyMenu } from '@/store/slices/modules/modulesSlice';
import { AuthUser } from '@/store/slices/auth/authSlice';
import Card from '@/components/ui/Card';
import GreetingHeader from './GreetingHeader';
import ModuleLauncher from './ModuleLauncher';
import MyProfileSummaryCard from './widgets/MyProfileSummaryCard';

interface MemberDashboardProps {
    user?: AuthUser | null;
}

const MemberDashboard = ({ user }: MemberDashboardProps) => {
    const dispatch = useAppDispatch();
    const { profile, loading } = useAppSelector((state) => state.profile);
    const { menuGroups, menuLoading } = useAppSelector((state) => state.modules);

    useEffect(() => {
        dispatch(fetchMyProfile());
        dispatch(fetchMyMenu());
    }, [dispatch]);

    return (
        <div className="pt-3">
            <GreetingHeader username={user?.username} roleLabel="Member" roleVariant="primary" />

            <div className="mt-3">
                <MyProfileSummaryCard profile={profile} loading={loading} />
            </div>

            <div className="mt-3">
                <Card title="Your Quick Actions">
                    <ModuleLauncher groups={menuGroups} loading={menuLoading} />
                </Card>
            </div>
        </div>
    );
};

export default MemberDashboard;
