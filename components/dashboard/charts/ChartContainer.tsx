import { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';
import { useAppSelector } from '@/store/hooks';

export const useChartTheme = () => {
    const isDarkMode = useAppSelector((state) => state.themeConfig.isDarkMode);
    return {
        grid: isDarkMode ? '#1b2e4b' : '#e0e6ed',
        axisText: isDarkMode ? '#888ea8' : '#3b3f5c',
        tooltipBg: isDarkMode ? '#0e1726' : '#ffffff',
        tooltipBorder: isDarkMode ? '#191e3a' : '#e0e6ed',
    };
};

interface ChartContainerProps {
    height?: number;
    children: ReactElement;
}

const ChartContainer = ({ height = 260, children }: ChartContainerProps) => (
    <ResponsiveContainer width="100%" height={height}>
        {children}
    </ResponsiveContainer>
);

export default ChartContainer;
