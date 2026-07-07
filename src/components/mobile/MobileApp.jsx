import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { carers } from "../../data/carers";
import { useRoster } from "../../context/RosterContext";
import OfflineStatusBar from "./OfflineStatusBar";
import RotaUpdateBanner from "./RotaUpdateBanner";
import MobileToday from "./MobileToday";
import MobileVisitDetail from "./MobileVisitDetail";

export default function MobileApp() {
  const { publishedVisitsForCarer, publishBump, lastPublishedAt } = useRoster();

  const [activeCarerId, setActiveCarerId] = useState(carers[0].id);
  const [screen, setScreen] = useState("today");
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [syncState, setSyncState] = useState("synced"); // 'synced' | 'offline' | 'syncing'
  const [pendingChanges, setPendingChanges] = useState(0);
  const [overrides, setOverrides] = useState(() => new Set());
  const [highlight, setHighlight] = useState(() => new Set());
  const [update, setUpdate] = useState(null); // { added, removed } when the office publishes
  const syncTimeout = useRef(null);
  const bannerTimeout = useRef(null);

  const today = useMemo(() => new Date(), []);

  // Today's published round for whichever carer's phone we're viewing.
  const round = useMemo(
    () =>
      publishedVisitsForCarer(activeCarerId, today).sort((a, b) => a.start.getTime() - b.start.getTime()),
    [publishedVisitsForCarer, activeCarerId, today],
  );

  const roundIdsFor = useCallback(
    (carerId) => new Set(publishedVisitsForCarer(carerId, today).map((v) => v.id)),
    [publishedVisitsForCarer, today],
  );

  // Baseline of each carer's round, so we can tell what changed on the next publish.
  const baselines = useRef({});
  const prevBump = useRef(publishBump);
  useEffect(() => {
    baselines.current[activeCarerId] = roundIdsFor(activeCarerId);
    // Baseline only for the carer we open with; others are seeded on switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    clearTimeout(syncTimeout.current);
    clearTimeout(bannerTimeout.current);
  }, []);

  // React to the office publishing a new rota.
  useEffect(() => {
    if (publishBump === prevBump.current) return;
    prevBump.current = publishBump;

    const currIds = roundIdsFor(activeCarerId);
    const prevIds = baselines.current[activeCarerId] ?? currIds;
    const added = [...currIds].filter((id) => !prevIds.has(id));
    const removed = [...prevIds].filter((id) => !currIds.has(id));
    baselines.current[activeCarerId] = currIds;

    setHighlight(new Set(added));
    setUpdate({ added: added.length, removed: removed.length });
    clearTimeout(bannerTimeout.current);
    bannerTimeout.current = setTimeout(() => setUpdate(null), 6000);
  }, [publishBump, roundIdsFor, activeCarerId]);

  function switchCarer(id) {
    setActiveCarerId(id);
    if (!baselines.current[id]) baselines.current[id] = roundIdsFor(id);
    setScreen("today");
    setSelectedVisitId(null);
    setHighlight(new Set());
    setUpdate(null);
  }

  function toggleConnection() {
    if (syncState === "syncing") return;
    if (syncState === "synced") {
      setSyncState("offline");
      return;
    }
    if (pendingChanges > 0) {
      setSyncState("syncing");
      syncTimeout.current = setTimeout(() => {
        setPendingChanges(0);
        setSyncState("synced");
      }, 1400);
    } else {
      setSyncState("synced");
    }
  }

  function handleComplete(visitId) {
    setOverrides((prev) => new Set(prev).add(visitId));
    if (syncState === "offline") setPendingChanges((n) => n + 1);
  }

  const activeCarer = carers.find((c) => c.id === activeCarerId);
  const selectedVisit = round.find((v) => v.id === selectedVisitId);

  return (
    <div className="flex h-full flex-col">
      <OfflineStatusBar
        syncState={syncState}
        pendingChanges={pendingChanges}
        onToggle={toggleConnection}
        lastPublishedAt={lastPublishedAt}
      />
      {update && screen === "today" && (
        <RotaUpdateBanner update={update} onDismiss={() => setUpdate(null)} />
      )}
      {screen === "today" || !selectedVisit ? (
        <MobileToday
          carer={activeCarer}
          carers={carers}
          visits={round}
          overrides={overrides}
          highlight={highlight}
          onSwitchCarer={switchCarer}
          onSelectVisit={(id) => {
            setSelectedVisitId(id);
            setScreen("visitDetail");
          }}
        />
      ) : (
        <MobileVisitDetail
          visit={selectedVisit}
          status={overrides.has(selectedVisit.id) ? "completed" : selectedVisit.status}
          isNew={highlight.has(selectedVisit.id)}
          currentCarerId={activeCarerId}
          onBack={() => setScreen("today")}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
