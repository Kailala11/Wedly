import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import CashflowPage from './pages/CashflowPage';
import MeetingsPage from './pages/MeetingsPage';
import SettingsPage from './pages/SettingsPage';
import { Spinner } from './components/UI';

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState(null);

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#FDFAF2'}}>
      <Spinner />
    </div>
  );

  if (!user) return <AuthPage />;

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage setPage={setPage} setSelectedEventId={setSelectedEventId} />;
      case 'events': return <EventsPage setPage={setPage} setSelectedEventId={setSelectedEventId} />;
      case 'event-detail': return <EventDetailPage eventId={selectedEventId} setPage={setPage} />;
      case 'meetings': return <MeetingsPage />;
      case 'cashflow': return <CashflowPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage setPage={setPage} setSelectedEventId={setSelectedEventId} />;
    }
  };

  return (
    <Layout page={page} setPage={setPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
