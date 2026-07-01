import Badge from '@/components/ui/Badge';
import { MOCK_DATA_DISCLAIMER } from '@/utils/mockFinancialData';

// Attached to every widget backed by utils/mockFinancialData.ts so nobody mistakes
// illustrative figures for real ones.
const SampleDataBadge = () => (
    <Badge variant="warning" outline className="text-[10px] uppercase tracking-wide">
        {MOCK_DATA_DISCLAIMER}
    </Badge>
);

export default SampleDataBadge;
