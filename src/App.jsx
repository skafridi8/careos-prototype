import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ViewModeProvider } from "./context/ViewModeContext";
import { RosterProvider } from "./context/RosterContext";
import { AuthProvider } from "./context/AuthContext";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import WhyCareOS from "./pages/WhyCareOS";
import Login from "./pages/Login";
import ClientList from "./pages/web/ClientList";
import ClientDetail from "./pages/web/ClientDetail";
import CarePlanEditor from "./pages/web/CarePlanEditor";
import AiAssistant from "./pages/web/AiAssistant";
import Roster from "./pages/web/Roster";
import Compliance from "./pages/web/Compliance";
import Records from "./pages/web/Records";
import TrainingForm from "./pages/web/forms/TrainingForm";
import ClientIntakeForm from "./pages/web/forms/ClientIntakeForm";
import TimesheetForm from "./pages/web/forms/TimesheetForm";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ViewModeProvider>
          <Routes>
            <Route path="/" element={<WhyCareOS />} />
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route
                path="/app"
                element={
                  <RosterProvider>
                    <AppShell />
                  </RosterProvider>
                }
              >
                <Route index element={<Navigate to="clients" replace />} />
                <Route path="clients" element={<ClientList />} />
                <Route path="clients/:clientId" element={<ClientDetail />} />
                <Route path="clients/:clientId/care-plan" element={<CarePlanEditor />} />
                <Route path="ai" element={<AiAssistant />} />
                <Route path="roster" element={<Roster />} />
                <Route path="compliance" element={<Compliance />} />
                <Route path="records" element={<Records />} />
                <Route path="forms/training" element={<TrainingForm />} />
                <Route path="forms/client-intake" element={<ClientIntakeForm />} />
                <Route path="forms/timesheet" element={<TimesheetForm />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ViewModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
