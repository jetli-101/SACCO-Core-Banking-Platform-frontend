import Card from '@/components/ui/Card';
import SampleDataBadge from '@/components/dashboard/SampleDataBadge';
import AreaTrendChart from '@/components/dashboard/charts/AreaTrendChart';
import { mockMembershipTrend } from '@/utils/mockFinancialData';

const MembershipTrendCard = () => (
    <Card title="Membership Growth" actions={<SampleDataBadge />}>
        <AreaTrendChart data={mockMembershipTrend} xKey="month" dataKey="members" height={220} />
    </Card>
);

export default MembershipTrendCard;
