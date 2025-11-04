/**
 * Real-time today statistics radial chart.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { statisticsService } from '@/services/statisticsService';
import type { RealtimeTodayResponse } from '@/types/statistics';
import { RadialBar, RadialBarChart, PolarRadiusAxis } from 'recharts';

export function RealtimeRadialChart() {
  const [data, setData] = useState<RealtimeTodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await statisticsService.getRealtimeToday();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch realtime today stats:', err);
        setError('Gagal memuat statistik real-time');
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
          <CardTitle>Statistik Real-Time Hari Ini</CardTitle>
          <CardDescription>Status pengiriman saat ini</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="animate-pulse text-sm text-muted-foreground">
            Memuat data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistik Real-Time Hari Ini</CardTitle>
          <CardDescription>Status pengiriman saat ini</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-red-600">{error || 'Data tidak tersedia'}</p>
        </CardContent>
      </Card>
    );
  }

  // Multi-segment data: in_delivery (blue) + completed_today (green)
  const total = data.in_delivery + data.completed_today;
  const chartData = [
    {
      name: 'completed',
      value: data.completed_today,
      fill: 'hsl(var(--chart-4))',
    },
    {
      name: 'in_delivery',
      value: data.in_delivery,
      fill: 'hsl(var(--chart-3))',
    },
  ];

  const chartConfig = {
    completed: {
      label: 'Selesai',
      color: 'hsl(var(--chart-4))',
    },
    in_delivery: {
      label: 'Dalam Pengiriman',
      color: 'hsl(var(--chart-3))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistik Real-Time Hari Ini</CardTitle>
        <CardDescription>
          Status pengiriman aktif saat ini
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radial Chart */}
          <div className="flex items-center justify-center">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square w-full max-w-[250px]"
            >
              <RadialBarChart
                data={chartData}
                startAngle={90}
                endAngle={450}
                innerRadius={80}
                outerRadius={140}
              >
                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x="50%"
                      dy="-0.5em"
                      className="fill-foreground text-4xl font-bold"
                    >
                      {total}
                    </tspan>
                    <tspan
                      x="50%"
                      dy="1.5em"
                      className="fill-muted-foreground text-sm"
                    >
                      Total
                    </tspan>
                  </text>
                </PolarRadiusAxis>
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ChartContainer>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
                <span className="text-sm text-muted-foreground">Dalam Pengiriman</span>
              </div>
              <span className="text-3xl font-bold">{data.in_delivery}</span>
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-700" />
                <span className="text-sm text-muted-foreground">Selesai Hari Ini</span>
              </div>
              <span className="text-3xl font-bold text-green-700">
                {data.completed_today}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">Tingkat Penyelesaian</span>
              <span className="text-3xl font-bold">
                {data.completion_rate.toFixed(1)}%
              </span>
            </div>
            {data.avg_delivery_time_minutes !== null && (
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-muted-foreground">Rata-rata Waktu</span>
                <span className="text-3xl font-bold">
                  {data.avg_delivery_time_minutes.toFixed(1)} min
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
