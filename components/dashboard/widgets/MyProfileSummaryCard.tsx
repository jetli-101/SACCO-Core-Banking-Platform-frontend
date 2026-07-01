import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { resolveFileUrl } from '@/urlhelper';
import { MemberProfile } from '@/store/slices/profile/profileSlice';

interface MyProfileSummaryCardProps {
    profile: MemberProfile | null;
    loading?: boolean;
}

const MyProfileSummaryCard = ({ profile, loading }: MyProfileSummaryCardProps) => {
    if (loading || !profile) {
        return (
            <Card>
                <div className="h-20 animate-pulse rounded-md bg-white/60 dark:bg-dark/20" />
            </Card>
        );
    }

    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

    return (
        <Card>
            <div className="flex flex-wrap items-center gap-4">
                <Avatar src={resolveFileUrl(profile.passportPhotoUrl)} name={fullName} size="lg" />
                <div className="flex-1">
                    <p className="text-lg font-semibold text-black dark:text-white-light">{fullName}</p>
                    <p className="text-sm text-white-dark">{profile.memberNumber ? `Member No. ${profile.memberNumber}` : profile.user.email}</p>
                    <Badge variant={profile.user.status === 'ACTIVE' ? 'success' : 'warning'} className="mt-1">
                        {profile.user.status || 'Unknown'}
                    </Badge>
                </div>
                <Button variant="outline-primary" href="/dashboard/personal-information">
                    Edit Profile
                </Button>
            </div>
        </Card>
    );
};

export default MyProfileSummaryCard;
