import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import PWABadge from './PWABadge.jsx'
import { AuthProvider } from './context/AuthContext'
import { TasksProvider } from './context/TasksContext'
import AlertsPage from './pages/AlertsPage'
import CalendarPage from './pages/CalendarPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import TaskDetailPage from './pages/TaskDetailPage'
import TaskFormPage from './pages/TaskFormPage'
import TasksPage from './pages/TasksPage'

export default function App() {
  return (
    <AuthProvider>
      <TasksProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/tareas" element={<TasksPage />} />
            <Route path="/tareas/:id" element={<TaskDetailPage />} />
            <Route path="/nuevo" element={<TaskFormPage />} />
            <Route path="/editar/:id" element={<TaskFormPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/alertas" element={<AlertsPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <PWABadge />
        </BrowserRouter>
      </TasksProvider>
    </AuthProvider>
  )
}
