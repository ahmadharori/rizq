/**
 * Recipient status distribution pie/donut chart.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { statisticsService } from '@/services/statisticsService';
import type { RecipientStatusDistribution } from '@/types/statistics';
import { Pie, PieChart, Cell, Label } from 'recharts';

const STATUS_COLORS = {
  Unassigned: 'hsl(var(--chart-1))',
  Assigned: 'hsl(var(--chart-2))',
  Delivery: 'hsl(var(--chart-3))',
  Done: 'hsl(var(--chart-4))',
  Return: 'hsl(var(--chart-5))',
};

export function RecipientStatusChart() {
  const [data, setData] = useState<RecipientStatusDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await statisticsService.getRecipientStatusDistribution();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch status distribution:', err);
        setError('Gagal memuat distribusi status');
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
          <CardTitle>Distribusi Status Penerima</CardTitle>
          <CardDescription>Status paket saat ini</CardDescription>
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
          <CardTitle>Distribusi Status Penerima</CardTitle>
          <CardDescription>Status paket saat ini</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-red-600">{error || 'Data tidak tersedia'}</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.data.map((item) => ({
    name: item.status,
    value: item.count,
    fill: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || 'hsl(var(--chart-1))',
  }));

  const chartConfig = {
    value: {
      label: 'Jumlah',
    },
    ...Object.fromEntries(
      Object.entries(STATUS_COLORS).map(([status, color]) => [
        status,
        { label: status, color },
      ])
    ),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribusi Status Penerima</CardTitle>
        <CardDescription>Total: {data.total} penerima</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {data.total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {data.data.map((item) => (
            <div key={item.status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS],
                  }}
                />
                <span>{item.status}</span>
              </div>
              <span className="font-medium">
                {item.count} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
