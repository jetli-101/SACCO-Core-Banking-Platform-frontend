import Card from '@/components/ui/Card';
import DonutChart from '@/components/dashboard/charts/DonutChart';
import { CHART_COLORS } from '@/components/dashboard/charts/chartColors';
import { MemberProfile } from '@/store/slices/profile/profileSlice';

interface MemberStatusDonutCardProps {
    members: MemberProfile[];
}

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: CHART_COLORS.success,
    PENDING: CHART_COLORS.warning,
    SUSPENDED: CHART_COLORS.danger,
    REJECTED: CHART_COLORS.danger,
    INACTIVE: CHART_COLORS.info,
};

const humanizeStatus = (status: string) => status.charAt(0) + status.slice(1).toLowerCase();

const MemberStatusDonutCard = ({ members }: MemberStatusDonutCardProps) => {
    const counts = members.reduce<Record<string, number>>((acc, member) => {
        const status = member.user.status || 'UNKNOWN';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const data = Object.entries(counts).map(([status, value]) => ({
        label: humanizeStatus(status),
        value,
        color: STATUS_COLORS[status] || CHART_COLORS.secondary,
    }));

    return (
        <Card title="Member Status Breakdown">
            {data.length ? <DonutChart data={data} height={240} /> : <p className="text-sm text-white-dark">No members yet.</p>}
        </Card>
    );
};

export default MemberStatusDonutCard;
