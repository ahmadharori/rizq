/**
 * Delivery trend area/line chart.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { statisticsService } from '@/services/statisticsService';
import type { DeliveryTrendResponse } from '@/types/statistics';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';

export function DeliveryTrendChart() {
  const [data, setData] = useState<DeliveryTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await statisticsService.getDeliveryTrend(days);
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch delivery trend:', err);
        setError('Gagal memuat tren pengiriman');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tren Pengiriman Harian</CardTitle>
          <CardDescription>Paket dikirim per hari</CardDescription>
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
          <CardTitle>Tren Pengiriman Harian</CardTitle>
          <CardDescription>Paket dikirim per hari</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-red-600">{error || 'Data tidak tersedia'}</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
    }),
    delivered: item.delivered,
    returned: item.returned,
  }));

  const chartConfig = {
    delivered: {
      label: 'Dikirim',
      color: 'hsl(var(--chart-4))',
    },
    returned: {
      label: 'Dikembalikan',
      color: 'hsl(var(--chart-5))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tren Pengiriman Harian</CardTitle>
            <CardDescription>
              Total: {data.total_delivered} dikirim, {data.total_returned} dikembalikan
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1 text-xs rounded-md ${
                days === 7
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDays(14)}
              className={`px-3 py-1 text-xs rounded-md ${
                days === 14
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              14 Hari
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1 text-xs rounded-md ${
                days === 30
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              30 Hari
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="delivered"
              stroke="var(--color-delivered)"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="returned"
              stroke="var(--color-returned)"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
