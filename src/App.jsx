import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ViewModeProvider } from "./context/ViewModeContext";
import { RosterProvider } from "./context/RosterContext";
import AppShell from "./components/layout/AppShell";
import WhyCareOS from "./pages/WhyCareOS";
import ClientList from "./pages/web/ClientList";
import ClientDetail from "./pages/web/ClientDetail";
import CarePlanEditor from "./pages/web/CarePlanEditor";
import AiAssistant from "./pages/web/AiAssistant";
import Roster from "./pages/web/Roster";
import Compliance from "./pages/web/Compliance";

export default function App() {
  return (
    <BrowserRouter>
      <ViewModeProvider>
        <Routes>
          <Route path="/" element={<WhyCareOS />} />
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
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ViewModeProvider>
    </BrowserRouter>
  );
}
