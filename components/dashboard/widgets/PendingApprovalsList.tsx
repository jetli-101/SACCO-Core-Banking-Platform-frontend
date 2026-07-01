import Link from 'next/link';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import IconArrowForward from '@/components/Icon/IconArrowForward';
import { resolveFileUrl } from '@/urlhelper';
import { MemberProfile } from '@/store/slices/profile/profileSlice';

interface PendingApprovalsListProps {
    members: MemberProfile[];
    maxItems?: number;
}

const PendingApprovalsList = ({ members, maxItems = 5 }: PendingApprovalsListProps) => {
    const pending = members.filter((member) => member.user.status === 'PENDING').slice(0, maxItems);

    return (
        <Card
            title="Pending Approvals"
            actions={
                <Link href="/dashboard/admin/member-directory" className="flex items-center gap-1 text-sm text-primary hover:underline">
                    View all
                    <IconArrowForward className="h-3.5 w-3.5" />
                </Link>
            }
        >
            {pending.length === 0 ? (
                <p className="text-sm text-white-dark">No pending approvals — you&apos;re all caught up.</p>
            ) : (
                <ul className="space-y-3">
                    {pending.map((member) => (
                        <li key={member.id} className="flex items-center gap-3">
                            <Avatar src={resolveFileUrl(member.passportPhotoUrl)} name={[member.firstName, member.lastName].filter(Boolean).join(' ')} size="sm" />
                            <div className="flex-1 truncate">
                                <p className="truncate text-sm font-semibold text-black dark:text-white-light">{[member.firstName, member.lastName].filter(Boolean).join(' ')}</p>
                                <p className="truncate text-xs text-white-dark">{member.memberNumber || member.user.email}</p>
                            </div>
                            <Badge variant="warning" outline>
                                Pending
                            </Badge>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
};

export default PendingApprovalsList;
