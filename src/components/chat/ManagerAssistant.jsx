import { useCallback } from "react";
import { useRoster } from "../../context/RosterContext";
import { carerById, carers } from "../../data/carers";
import { clientById } from "../../data/clients";
import { formatDayLabel, formatTime } from "../../utils/dates";
import { executeCareDataQuery } from "../../lib/careData";
import ChatWidget from "./ChatWidget";

const AUTO_RESOLVE = new Set(["draft_message", "query_care_data"]);

function visitLabel(visit) {
  if (!visit) return "that visit";
  const client = clientById(visit.clientId);
  return `${client?.name ?? "Unknown client"} · ${formatDayLabel(visit.start)} ${formatTime(visit.start)}`;
}

function describeToolCall(toolCall, visits) {
  const a = toolCall.arguments || {};
  const visit = visits.find((v) => v.id === a.visitId);
  switch (toolCall.name) {
    case "assign_carer":
      return `Assign ${carerById(a.carerId)?.name ?? a.carerId} to ${visitLabel(visit)}${
        a.replaceCarerId ? ` (replacing ${carerById(a.replaceCarerId)?.name ?? a.replaceCarerId})` : ""
      }?`;
    case "unassign_carer":
      return `Remove ${carerById(a.carerId)?.name ?? a.carerId} from ${visitLabel(visit)}?`;
    case "mark_carer_sick":
      return `Mark ${carerById(a.carerId)?.name ?? a.carerId} off sick and free up their upcoming visits?`;
    case "mark_carer_fit":
      return `Mark ${carerById(a.carerId)?.name ?? a.carerId} fit for work again?`;
    case "auto_allocate":
      return "Run AI auto-fix to fill every unallocated visit with the best conflict-free carer?";
    case "publish_roster":
      return "Publish the current rota so every carer's phone updates?";
    case "resolve_carer_request":
      return `${a.resolution === "approved" ? "Approve" : "Decline"} this carer request?`;
    case "query_care_data":
      return "Look up live care data from the Tendly database?";
    default:
      return `Run ${toolCall.name.replaceAll("_", " ")}?`;
  }
}

export default function ManagerAssistant() {
  const roster = useRoster();
  const { visits, sickCarerIds, carerRequests, metrics, analysis } = roster;

  const getContext = useCallback(() => {
    const upcoming = visits
      .filter((v) => v.status === "upcoming" || v.status === "unallocated")
      .slice(0, 40)
      .map((v) => ({
        id: v.id,
        client: clientById(v.clientId)?.name,
        clientId: v.clientId,
        start: `${formatDayLabel(v.start)} ${formatTime(v.start)}`,
        end: formatTime(v.end),
        type: v.type,
        status: v.status,
        carerIds: v.carerIds,
        carerNames: v.carerIds.map((id) => carerById(id)?.name),
      }));
    return {
      carers: carers.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        skills: c.skills,
        zone: c.zone,
        sick: sickCarerIds.includes(c.id),
      })),
      visits: upcoming,
      unallocatedCount: metrics.unallocated,
      conflictCount: analysis.byVisit.size,
      carerRequests: carerRequests
        .filter((r) => r.status === "pending")
        .map((r) => ({ id: r.id, type: r.type, carer: carerById(r.carerId)?.name, payload: r.payload })),
    };
  }, [visits, sickCarerIds, carerRequests, metrics, analysis]);

  const onExecuteTool = useCallback(
    async (toolCall) => {
      const a = toolCall.arguments || {};
      switch (toolCall.name) {
        case "assign_carer": {
          if (!visits.find((v) => v.id === a.visitId)) throw new Error(`No such visit: ${a.visitId}`);
          if (!carerById(a.carerId)) throw new Error(`No such carer: ${a.carerId}`);
          roster.assignCarer(a.visitId, a.carerId, a.replaceCarerId || null);
          return `Assigned ${carerById(a.carerId).name} to the visit.`;
        }
        case "unassign_carer": {
          roster.unassignCarer(a.visitId, a.carerId);
          return `Removed ${carerById(a.carerId)?.name ?? a.carerId} from the visit.`;
        }
        case "mark_carer_sick": {
          roster.markSick(a.carerId);
          return `${carerById(a.carerId)?.name ?? a.carerId} marked off sick.`;
        }
        case "mark_carer_fit": {
          roster.markFit(a.carerId);
          return `${carerById(a.carerId)?.name ?? a.carerId} marked fit for work.`;
        }
        case "auto_allocate": {
          roster.autoAllocate();
          return "Ran AI auto-fix on the rota.";
        }
        case "publish_roster": {
          roster.publish();
          return "Rota published to all carer phones.";
        }
        case "resolve_carer_request": {
          roster.resolveCarerRequest(a.requestId, a.resolution);
          return `Request ${a.resolution}.`;
        }
        case "draft_message": {
          return "Draft shown to the manager above — nothing was sent.";
        }
        case "query_care_data": {
          return await executeCareDataQuery(a, { clientNameById: (id) => clientById(id)?.name });
        }
        default:
          throw new Error(`Unknown tool: ${toolCall.name}`);
      }
    },
    [roster, visits],
  );

  return (
    <ChatWidget
      assistantMode="manager"
      title="Rostering Assistant"
      greeting="Hi! I can help draft messages and actually make rostering changes for you — assign or reassign carers, mark someone sick, auto-fill unallocated visits, publish the rota, or triage carer requests. What do you need?"
      placeholder="e.g. 'Cover Sarah's visits, she's sick today'"
      getContext={getContext}
      onExecuteTool={onExecuteTool}
      autoResolveTool={(name) => AUTO_RESOLVE.has(name)}
      describeToolCall={(tc) => describeToolCall(tc, visits)}
    />
  );
}
