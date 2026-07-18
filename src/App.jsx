import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ViewModeProvider } from "./context/ViewModeContext";
import { RosterProvider } from "./context/RosterContext";
import { AuthProvider } from "./context/AuthContext";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import RequireManager from "./components/layout/RequireManager";
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
import Analytics from "./pages/web/Analytics";
import LiveVisits from "./pages/web/LiveVisits";
import Compliance from "./pages/web/Compliance";
import Records from "./pages/web/Records";
import TrainingForm from "./pages/web/forms/TrainingForm";
import ClientIntakeForm from "./pages/web/forms/ClientIntakeForm";
import TimesheetForm from "./pages/web/forms/TimesheetForm";
import FamilyPortal from "./pages/family/FamilyPortal";
import { useAuth } from "./context/AuthContext";

// The in-app pages (/app/*) mount their own role-aware assistant (manager tools vs plain
// help) inside AppShell, where RosterContext is available. This one covers everywhere else.
function PublicChatWidget() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  if (pathname.startsWith("/app")) return null;
  return <ChatWidget assistantMode={user ? "app" : "public"} />;
}

// Managers land on Care Planning; carers don't have access to that page, so send them to
// Compliance; family accounts belong in their own portal, not the staff app.
function AppIndexRedirect() {
  const { isManager, isFamily, profile } = useAuth();
  if (!profile) return null;
  if (isFamily) return <Navigate to="/family" replace />;
  return <Navigate to={isManager ? "clients" : "compliance"} replace />;
}

// The family portal is only for linked family accounts; staff get sent back to the app.
function FamilyRoute() {
  const { isFamily, profileLoading, profile } = useAuth();
  if (profileLoading || !profile) return null;
  if (!isFamily) return <Navigate to="/app" replace />;
  return <FamilyPortal />;
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
              <Route path="/family" element={<FamilyRoute />} />
              <Route
                path="/app"
                element={
                  <RosterProvider>
                    <AppShell />
                  </RosterProvider>
                }
              >
                <Route index element={<AppIndexRedirect />} />
                <Route element={<RequireManager />}>
                  <Route path="clients" element={<ClientList />} />
                  <Route path="clients/:clientId" element={<ClientDetail />} />
                  <Route path="clients/:clientId/care-plan" element={<CarePlanEditor />} />
                  <Route path="ai" element={<AiAssistant />} />
                  <Route path="roster" element={<Roster />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="live" element={<LiveVisits />} />
                  <Route path="forms/client-intake" element={<ClientIntakeForm />} />
                </Route>
                <Route path="compliance" element={<Compliance />} />
                <Route path="records" element={<Records />} />
                <Route path="forms/training" element={<TrainingForm />} />
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
