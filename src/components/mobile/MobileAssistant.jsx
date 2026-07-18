import { useCallback } from "react";
import { useRoster } from "../../context/RosterContext";
import { carerById } from "../../data/carers";
import { clientById } from "../../data/clients";
import { formatDayLabel, formatTime } from "../../utils/dates";
import { executeCareDataQuery } from "../../lib/careData";
import ChatWidget from "../chat/ChatWidget";

function describeToolCall(toolCall, visits) {
  const a = toolCall.arguments || {};
  const visit = visits.find((v) => v.id === a.visitId);
  const clientName = visit ? clientById(visit.clientId)?.name : null;
  switch (toolCall.name) {
    case "submit_visit_note":
      return `Send this note to the office${clientName ? ` for ${clientName}` : ""}: "${a.note}"?`;
    case "request_time_off":
      return `Request time off${a.dates ? ` for ${a.dates}` : ""}${a.reason ? ` — ${a.reason}` : ""}?`;
    case "request_shift_swap":
      return `Ask the office to cover${clientName ? ` your ${clientName} visit` : " this visit"}${
        a.reason ? ` — ${a.reason}` : ""
      }?`;
    case "flag_issue":
      return `Flag this to the office${clientName ? ` (${clientName})` : ""}: "${a.description}"?`;
    case "query_care_data":
      return "Look up live care data from the Tendly database?";
    default:
      return `Run ${toolCall.name.replaceAll("_", " ")}?`;
  }
}

export default function MobileAssistant({ carerId, todaysVisits }) {
  const roster = useRoster();
  const carer = carerById(carerId);

  const getContext = useCallback(
    () => ({
      carer: { id: carer.id, name: carer.name, role: carer.role, skills: carer.skills, zone: carer.zone },
      visits: todaysVisits.map((v) => ({
        id: v.id,
        client: clientById(v.clientId)?.name,
        clientId: v.clientId,
        start: `${formatDayLabel(v.start)} ${formatTime(v.start)}`,
        end: formatTime(v.end),
        type: v.type,
        status: v.status,
      })),
    }),
    [carer, todaysVisits],
  );

  const onExecuteTool = useCallback(
    async (toolCall) => {
      const a = toolCall.arguments || {};
      const visit = todaysVisits.find((v) => v.id === a.visitId);
      switch (toolCall.name) {
        case "submit_visit_note": {
          roster.addCarerNote(carer.id, visit?.clientId ?? null, a.visitId ?? null, a.note);
          return "Note sent to the office.";
        }
        case "request_time_off": {
          roster.addCarerRequest("time-off", carer.id, { dates: a.dates, reason: a.reason, summary: a.dates ? `Requesting ${a.dates}${a.reason ? ` — ${a.reason}` : ""}` : a.reason });
          return "Time-off request sent to the office.";
        }
        case "request_shift_swap": {
          const summary = visit
            ? `Cover needed for ${clientById(visit.clientId)?.name}'s ${formatDayLabel(visit.start)} ${formatTime(visit.start)} visit${a.reason ? ` — ${a.reason}` : ""}`
            : a.reason || "Cover requested for a visit";
          roster.addCarerRequest("shift-swap", carer.id, { visitId: a.visitId, reason: a.reason, summary });
          return "Shift-swap request sent to the office.";
        }
        case "flag_issue": {
          const summary = visit ? `${clientById(visit.clientId)?.name}: ${a.description}` : a.description;
          roster.addCarerRequest("flag", carer.id, { visitId: a.visitId, description: a.description, summary });
          return "Flagged to the office.";
        }
        case "query_care_data": {
          return await executeCareDataQuery(a, { clientNameById: (id) => clientById(id)?.name });
        }
        default:
          throw new Error(`Unknown tool: ${toolCall.name}`);
      }
    },
    [roster, carer, todaysVisits],
  );

  return (
    <ChatWidget
      variant="inline"
      assistantMode="carer"
      title="Field Assistant"
      greeting={`Hi ${carer.name.split(" ")[0]}! Tell me about a visit and I'll log a note for the office, or ask me to request time off, a shift swap, or flag something.`}
      placeholder="e.g. 'Log a note for Margaret's visit'"
      getContext={getContext}
      onExecuteTool={onExecuteTool}
      autoResolveTool={(name) => name === "query_care_data"}
      describeToolCall={(tc) => describeToolCall(tc, todaysVisits)}
    />
  );
}
