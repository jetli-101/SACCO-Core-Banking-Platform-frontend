import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import ChartContainer, { useChartTheme } from './ChartContainer';
import { CHART_COLORS } from './chartColors';

interface SimpleBarChartProps {
    data: Record<string, string | number>[];
    xKey: string;
    dataKey: string;
    color?: string;
    height?: number;
}

const SimpleBarChart = ({ data, xKey, dataKey, color = CHART_COLORS.secondary, height }: SimpleBarChartProps) => {
    const theme = useChartTheme();

    return (
        <ChartContainer height={height}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                <XAxis dataKey={xKey} tick={{ fill: theme.axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: theme.axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8 }} labelStyle={{ color: theme.axisText }} />
                <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
    );
};

export default SimpleBarChart;
