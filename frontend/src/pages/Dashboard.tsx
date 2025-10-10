import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">RizQ - Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Halo, {user?.username}
            </span>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Selamat Datang di RizQ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Sistem Manajemen Distribusi Paket. Frontend berhasil terhubung dengan backend!
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm">
                <strong>User ID:</strong> {user?.id}
              </p>
              <p className="text-sm">
                <strong>Username:</strong> {user?.username}
              </p>
              <p className="text-sm">
                <strong>Status:</strong> {user?.is_active ? 'Aktif' : 'Tidak Aktif'}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
