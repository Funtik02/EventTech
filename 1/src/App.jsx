import { Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout.jsx'
import { Spinner } from './components/ui.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { EventProvider } from './context/EventContext.jsx'
import { Budget } from './pages/Budget.jsx'
import { CalendarPage } from './pages/CalendarPage.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { EventCreate } from './pages/EventCreate.jsx'
import { Events } from './pages/Events.jsx'
import { Guests } from './pages/Guests.jsx'
import { Login } from './pages/Login.jsx'
import { PublicRegister } from './pages/PublicRegister.jsx'
import { Settings } from './pages/Settings.jsx'
import { Tasks } from './pages/Tasks.jsx'
import { Team } from './pages/Team.jsx'

function Protected() {
  const { user, ready } = useAuth()
  if (!ready) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return (
    <EventProvider key={user.id}>
      <Layout />
    </EventProvider>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/r/:eventId" element={<PublicRegister />} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="events" element={<Events />} />
        <Route path="events/new" element={<EventCreate />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="budget" element={<Budget />} />
        <Route path="guests" element={<Guests />} />
        <Route path="team" element={<Team />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
