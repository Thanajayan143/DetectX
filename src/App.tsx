import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import Overview from '@/pages/Overview';
import LiveDetection from '@/pages/LiveDetection';
import CreateIncident from '@/pages/CreateIncident';
import VerificationQueue from '@/pages/VerificationQueue';
import FieldResponse from '@/pages/FieldResponse';
import EvidenceVault from '@/pages/EvidenceVault';
import MapView from '@/pages/MapView';
import IncidentReports from '@/pages/IncidentReports';
import DevicesRobots from '@/pages/DevicesRobots';
import FieldUnits from '@/pages/FieldUnits';
import IncidentLogs from '@/pages/IncidentLogs';
import AuditLog from '@/pages/AuditLog';
import Profile from '@/pages/Profile';
import IncidentDetail from '@/pages/IncidentDetail';
import DemoSimulation from '@/pages/DemoSimulation';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="text-6xl font-bold text-muted-foreground/20 mb-4">404</div>
      <h2 className="text-xl font-bold text-foreground mb-2">Page Not Found</h2>
      <p className="text-muted-foreground">The requested page does not exist in the DETECT-X 2.0 system.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/detection" element={<LiveDetection />} />
          <Route path="/incidents/create" element={<CreateIncident />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/verification" element={<VerificationQueue />} />
          <Route path="/field-response" element={<FieldResponse />} />
          <Route path="/evidence" element={<EvidenceVault />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/reports" element={<IncidentReports />} />
          <Route path="/devices" element={<DevicesRobots />} />
          <Route path="/field-units" element={<FieldUnits />} />
          <Route path="/logs" element={<IncidentLogs />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/demo" element={<DemoSimulation />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
