/**
 * Courier performance horizontal bar chart.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { statisticsService } from '@/services/statisticsService';
import type { CourierPerformanceResponse } from '@/types/statistics';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';

export function CourierPerformanceChart() {
  const [data, setData] = useState<CourierPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await statisticsService.getCourierPerformance(10);
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch courier performance:', err);
        setError('Gagal memuat performa kurir');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performa Kurir</CardTitle>
          <CardDescription>Kurir dengan pengiriman terbanyak</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="animate-pulse text-sm text-muted-foreground">
            Memuat data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performa Kurir</CardTitle>
          <CardDescription>Kurir dengan pengiriman terbanyak</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-red-600">{error || 'Data tidak tersedia'}</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.data.map((item) => ({
    name: item.courier_name,
    delivered: item.total_delivered,
    assignments: item.total_assignments,
  }));

  const chartConfig = {
    delivered: {
      label: 'Paket Dikirim',
      color: 'hsl(var(--chart-4))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performa Kurir</CardTitle>
        <CardDescription>
          {data.data.length} kurir teratas berdasarkan paket yang berhasil dikirim
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              content={
                <ChartTooltipContent
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  labelFormatter={(value, payload) => {
                    const item = payload[0]?.payload;
                    return `${value} (${item?.assignments} assignment)`;
                  }}
                />
              }
            />
            <Bar
              dataKey="delivered"
              fill="var(--color-delivered)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
