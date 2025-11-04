/**
 * Real-time today statistics with progress bar.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { statisticsService } from '@/services/statisticsService';
import type { RealtimeTodayResponse } from '@/types/statistics';

export function RealtimeProgressCard() {
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
          <CardDescription>Status pengiriman aktif saat ini</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
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
          <CardDescription>Status pengiriman aktif saat ini</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-red-600">{error || 'Data tidak tersedia'}</p>
        </CardContent>
      </Card>
    );
  }

  const total = data.in_delivery + data.completed_today;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistik Real-Time Hari Ini</CardTitle>
        <CardDescription>
          Progress pengiriman aktif saat ini
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Bar Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {data.completion_rate.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                {data.completed_today}/{total} paket selesai
              </span>
            </div>
            {/* <Progress 
              value={data.completion_rate} 
              className="h-3 [&>div]:bg-green-700"
            /> */}
            <div className="h-3 w-full bg-blue-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-700 transition-all"
                style={{ width: `${data.completion_rate}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
                <span className="text-sm text-muted-foreground">Dalam Pengiriman</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{data.in_delivery}</span>
            </div>
            
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-700" />
                <span className="text-sm text-muted-foreground">Selesai Hari Ini</span>
              </div>
              <span className="text-2xl font-bold text-green-700">
                {data.completed_today}
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">Assignment Aktif</span>
              <span className="text-2xl font-bold">{data.active_assignments}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
