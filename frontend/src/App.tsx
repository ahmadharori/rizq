import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import { RecipientList } from '@/pages/RecipientList'
import CourierList from '@/pages/CourierList'
import CourierForm from '@/pages/CourierForm'
import { AssignmentList } from '@/pages/AssignmentList'
import { AssignmentDetail } from '@/pages/AssignmentDetail'
import { AssignmentWizard } from '@/features/assignments/wizard/AssignmentWizard'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipients"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RecipientList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/couriers"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CourierList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/couriers/new"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CourierForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/couriers/:id/edit"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CourierForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AssignmentList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/create"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AssignmentWizard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AssignmentDetail />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
