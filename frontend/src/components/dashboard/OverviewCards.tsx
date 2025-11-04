/**
 * Overview statistics cards for dashboard.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { statisticsService } from '@/services/statisticsService';
import type { OverviewStatsResponse } from '@/types/statistics';
import { RecipientStatus } from '@/types/recipient';
import { Package, Users, ClipboardList, TrendingUp } from 'lucide-react';

export function OverviewCards() {
  const [stats, setStats] = useState<OverviewStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await statisticsService.getOverviewStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch overview stats:', err);
        setError('Gagal memuat statistik');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error || 'Data tidak tersedia'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Recipients Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Penerima</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_recipients}</div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {Object.entries(stats.status_breakdown).map(([status, count]) => (
              <div key={status} className="flex items-center gap-1">
                <StatusBadge 
                  status={status as RecipientStatus} 
                  showIcon={false}
                />
                <span className="text-xs font-medium">: {count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Total Active Couriers Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pengantar Aktif</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_active_couriers}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Siap untuk pengiriman
          </p>
        </CardContent>
      </Card>

      {/* Today's Assignments Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assignment Hari Ini</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.today_assignments}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Dibuat hari ini
          </p>
        </CardContent>
      </Card>

      {/* Completion Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status Selesai</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.status_breakdown.Done || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Paket telah dikirim
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
