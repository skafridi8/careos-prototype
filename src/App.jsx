import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ViewModeProvider } from "./context/ViewModeContext";
import { RosterProvider } from "./context/RosterContext";
import { AuthProvider } from "./context/AuthContext";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import WhyCareOS from "./pages/WhyCareOS";
import Login from "./pages/Login";
import Subscribe from "./pages/Subscribe";
import SubscribeSuccess from "./pages/SubscribeSuccess";
import SubscribeCancel from "./pages/SubscribeCancel";
import ChatWidget from "./components/chat/ChatWidget";
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
import { useAuth } from "./context/AuthContext";

// The in-app pages (/app/*) mount their own role-aware assistant (manager tools vs plain
// help) inside AppShell, where RosterContext is available. This one covers everywhere else.
function PublicChatWidget() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  if (pathname.startsWith("/app")) return null;
  return <ChatWidget assistantMode={user ? "app" : "public"} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ViewModeProvider>
          <Routes>
            <Route path="/" element={<WhyCareOS />} />
            <Route path="/login" element={<Login />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/subscribe/success" element={<SubscribeSuccess />} />
            <Route path="/subscribe/cancel" element={<SubscribeCancel />} />
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
          <PublicChatWidget />
        </ViewModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
