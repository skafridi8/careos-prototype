import { addDays } from "../utils/dates";

const now = new Date();

// Raw, informal carer notes for Margaret Hendricks — the free-text input to the demo.
export const sourceNotes = [
  {
    id: "n1",
    author: "Sarah Jenkins",
    date: addDays(now, -1),
    text: "Margaret was a bit wobbly going up the stairs this morning, held onto the rail the whole way. Might be worth double-checking the stair rail is secure.",
  },
  {
    id: "n2",
    author: "Aaron Mitchell",
    date: addDays(now, -2),
    text: "Didn't want much breakfast again today, just had half a slice of toast, said she wasn't hungry. Radio was on in the kitchen, she seemed happy chatting about her garden.",
  },
  {
    id: "n3",
    author: "Sarah Jenkins",
    date: addDays(now, -3),
    text: "Margaret asked me twice whether she'd already taken her tablets this morning. I checked the dosette box, she had. Might need a clearer way for her to check this herself.",
  },
  {
    id: "n4",
    author: "Grace Adeyemi",
    date: addDays(now, -4),
    text: "Lovely visit today, her daughter had been round on Sunday and she was telling me all about it. She was really settled and chatty.",
  },
  {
    id: "n5",
    author: "Aaron Mitchell",
    date: addDays(now, -5),
    text: "Noticed the hallway rug again today, pushed it against the wall for now but flagging it as a trip hazard near the stairs.",
  },
];

// The mocked AI output: a structured, editable draft care plan generated from the notes above.
// Each field that was informed by a note carries a `source` citation; fields with no
// supporting note are carried over unchanged and left uncited.
export const generatedDraft = {
  goals: [
    { text: "Remain safely in own home for as long as possible", source: null },
    { text: "Reduce stair-related falls risk following recent unsteadiness", source: "Sarah Jenkins" },
    { text: "Support appetite and breakfast intake", source: "Aaron Mitchell" },
  ],
  sections: {
    mobility: {
      text: "Mobilises independently indoors with a stick. Recent unsteadiness noted on the stairs — hold rail at all times and check rail is secure. Hallway rug flagged as a trip hazard and pushed against the wall; consider removing permanently.",
      source: "Sarah Jenkins & Aaron Mitchell",
    },
    personalCare: {
      text: "Requires prompting to wash and dress; can complete tasks independently once started.",
      source: null,
    },
    nutrition: {
      text: "Appetite reduced at breakfast — offered only half a slice of toast on recent visits. Encourage smaller, appealing portions and note intake at each visit.",
      source: "Aaron Mitchell",
    },
    medication: {
      text: "Prompt Donepezil and Amlodipine at 08:00 with breakfast. Margaret has asked more than once whether she's already taken her tablets — check the dosette box together with her each time to reassure and confirm.",
      source: "Sarah Jenkins",
    },
    mentalHealthCognition: {
      text: "Mild short-term memory loss, including uncertainty about whether medication has been taken. Reorientate gently; consider a simple visual checklist by the dosette box.",
      source: "Sarah Jenkins",
    },
    communication: {
      text: "Hearing is good. Speak clearly and allow time to respond. Responds well to familiar topics — enjoys the radio on and chatting about her garden.",
      source: "Aaron Mitchell",
    },
    socialWellbeing: {
      text: "Daughter visited recently and Margaret enjoyed recounting the visit — she was settled and chatty afterwards. Encourage conversation about family visits to support mood.",
      source: "Grace Adeyemi",
    },
  },
  suggestedRisks: [
    {
      type: "Falls",
      level: "High",
      detail: "Unsteady on stairs and a known hallway trip hazard — recommend rail check and permanent rug removal.",
      source: "Sarah Jenkins & Aaron Mitchell",
    },
  ],
};
