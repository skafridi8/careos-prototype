import { generatedDraft } from "../data/aiCarePlanDraft";

export const AI_FLAGSHIP_CLIENT_ID = "margaret-hendricks";

export const sectionLabels = {
  mobility: "Mobility",
  personalCare: "Personal care",
  nutrition: "Nutrition",
  medication: "Medication",
  mentalHealthCognition: "Mental health & cognition",
  communication: "Communication",
  socialWellbeing: "Social & wellbeing",
};

// Fallback "AI draft" for clients we haven't authored bespoke source notes for —
// reuses their existing plan text, tagged as AI-sourced, so the feature works everywhere.
export function buildGenericDraft(client) {
  return {
    goals: client.carePlan.goals.map((text) => ({ text, source: "Recent carer notes" })),
    sections: Object.fromEntries(
      Object.entries(client.carePlan.sections).map(([key, val]) => [key, { text: val.text, source: "Recent carer notes" }])
    ),
  };
}

export function getDraftForClient(client) {
  return client.id === AI_FLAGSHIP_CLIENT_ID ? generatedDraft : buildGenericDraft(client);
}

export function initialFormState(client) {
  return {
    goals: client.carePlan.goals.map((text) => ({ text, source: null })),
    sections: Object.fromEntries(
      Object.entries(client.carePlan.sections).map(([key, val]) => [key, { text: val.text, source: val.source }])
    ),
  };
}
