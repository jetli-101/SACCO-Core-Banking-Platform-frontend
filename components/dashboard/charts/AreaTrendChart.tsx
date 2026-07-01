import { useId } from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import ChartContainer, { useChartTheme } from './ChartContainer';
import { CHART_COLORS } from './chartColors';

interface AreaTrendChartProps {
    data: Record<string, string | number>[];
    xKey: string;
    dataKey: string;
    color?: string;
    height?: number;
}

const AreaTrendChart = ({ data, xKey, dataKey, color = CHART_COLORS.primary, height }: AreaTrendChartProps) => {
    const theme = useChartTheme();
    const gradientId = `areaTrendFill-${useId()}`;

    return (
        <ChartContainer height={height}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                <XAxis dataKey={xKey} tick={{ fill: theme.axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: theme.axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8 }} labelStyle={{ color: theme.axisText }} />
                <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
            </AreaChart>
        </ChartContainer>
    );
};

export default AreaTrendChart;
