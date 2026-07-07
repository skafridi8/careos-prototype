import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import PhoneFrame from "./PhoneFrame";
import MobileApp from "../mobile/MobileApp";
import { useViewMode } from "../../context/ViewModeContext";

export default function AppShell() {
  const { viewMode } = useViewMode();
  const showWeb = viewMode === "web" || viewMode === "split";
  const showMobile = viewMode === "mobile" || viewMode === "split";

  return (
    <div className="flex h-svh flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {showWeb && <Sidebar />}
        {showWeb && (
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl p-6">
              <Outlet />
            </div>
          </main>
        )}
        {showMobile && (
          <div className="flex shrink-0 items-center justify-center overflow-y-auto border-l border-brand-100 bg-brand-100/30 p-6">
            <PhoneFrame>
              <MobileApp />
            </PhoneFrame>
          </div>
        )}
      </div>
    </div>
  );
}
