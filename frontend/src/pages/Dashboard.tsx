import { OverviewCards } from '@/components/dashboard/OverviewCards'
import { RecipientStatusChart } from '@/components/dashboard/RecipientStatusChart'
import { DeliveryTrendChart } from '@/components/dashboard/DeliveryTrendChart'
import { CourierPerformanceChart } from '@/components/dashboard/CourierPerformanceChart'
import { GeographicChart } from '@/components/dashboard/GeographicChart'
import { RealtimeProgressCard } from '@/components/dashboard/RealtimeProgressCard'

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Statistik dan metrik distribusi paket sembako
        </p>
      </div>

      {/* Row 4: Real-time Today Statistics */}
      <RealtimeProgressCard />
      
      {/* Row 1: Overview Cards */}
      <OverviewCards />

      {/* Row 2: Status Distribution & Delivery Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecipientStatusChart />
        <DeliveryTrendChart />
      </div>

      {/* Row 3: Courier Performance & Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CourierPerformanceChart />
        <GeographicChart />
      </div>

      
    </div>
  )
}
