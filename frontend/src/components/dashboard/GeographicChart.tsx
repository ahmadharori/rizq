/**
 * Geographic distribution stacked bar chart.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { statisticsService } from '@/services/statisticsService';
import type { GeographicDistributionResponse } from '@/types/statistics';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

export function GeographicChart() {
  const [data, setData] = useState<GeographicDistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await statisticsService.getGeographicDistribution();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch geographic distribution:', err);
        setError('Gagal memuat distribusi geografis');
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
          <CardTitle>Distribusi Geografis</CardTitle>
          <CardDescription>Penerima per kota</CardDescription>
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
          <CardTitle>Distribusi Geografis</CardTitle>
          <CardDescription>Penerima per kota</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-red-600">{error || 'Data tidak tersedia'}</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.data.map((item) => ({
    city: item.city_name,
    unassigned: item.unassigned,
    assigned: item.assigned,
    delivery: item.delivery,
    done: item.done,
    returned: item.return_count,
  }));

  const chartConfig = {
    unassigned: {
      label: 'Unassigned',
      color: 'hsl(var(--chart-1))',
    },
    assigned: {
      label: 'Assigned',
      color: 'hsl(var(--chart-2))',
    },
    delivery: {
      label: 'Delivery',
      color: 'hsl(var(--chart-3))',
    },
    done: {
      label: 'Done',
      color: 'hsl(var(--chart-4))',
    },
    returned: {
      label: 'Return',
      color: 'hsl(var(--chart-5))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribusi Geografis</CardTitle>
        <CardDescription>
          {data.data.length} kota dengan breakdown status penerima
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="city"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              content={
                <ChartTooltipContent 
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                />
              }
            />
            <Bar
              dataKey="unassigned"
              stackId="a"
              fill="var(--color-unassigned)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="assigned"
              stackId="a"
              fill="var(--color-assigned)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="delivery"
              stackId="a"
              fill="var(--color-delivery)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="done"
              stackId="a"
              fill="var(--color-done)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="returned"
              stackId="a"
              fill="var(--color-returned)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
