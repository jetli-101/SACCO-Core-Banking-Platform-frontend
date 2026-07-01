import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ChartContainer from './ChartContainer';

export interface DonutChartDatum {
    label: string;
    value: number;
    color: string;
}

interface DonutChartProps {
    data: DonutChartDatum[];
    height?: number;
}

const DonutChart = ({ data, height = 260 }: DonutChartProps) => (
    <ChartContainer height={height}>
        <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="60%" outerRadius="85%" paddingAngle={2}>
                {data.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} stroke="none" />
                ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
    </ChartContainer>
);

export default DonutChart;
