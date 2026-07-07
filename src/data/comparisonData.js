export const competitors = [
  { id: "careos", name: "CareOS" },
  { id: "nourish", name: "Nourish Care" },
  { id: "pass", name: "PASS by everyLIFE" },
  { id: "birdie", name: "Birdie" },
];

// status: 'yes' | 'no' | 'partial' | 'unclear'
export const comparisonRows = [
  {
    feature: "Unified platform — one shared data model",
    detail: "Care planning, rostering and compliance all read and write the same record.",
    careos: { status: "yes" },
    nourish: { status: "no", note: "Rostering is a bolted-on module, not the same data model." },
    pass: { status: "yes" },
    birdie: { status: "yes" },
  },
  {
    feature: "Works across all care settings",
    detail: "Home care, residential care homes, and supported living in one product.",
    careos: { status: "yes" },
    nourish: { status: "yes" },
    pass: { status: "yes" },
    birdie: { status: "no", note: "Home care only." },
  },
  {
    feature: "AI: conversation / notes → structured care plan",
    detail: "Turns free-text carer notes into an editable, ongoing care plan.",
    careos: { status: "yes" },
    nourish: { status: "no" },
    pass: { status: "partial", note: "Summarises notes only — doesn't build a structured plan." },
    birdie: { status: "partial", note: "AI limited to initial assessments, not ongoing care plans." },
  },
  {
    feature: "NHS GP Connect integration",
    detail: "Synced GP record: conditions, allergies, repeat prescriptions.",
    careos: { status: "yes" },
    nourish: { status: "unclear", note: "Integration depth unclear / reported as weak." },
    pass: { status: "yes" },
    birdie: { status: "yes" },
  },
  {
    feature: "Handles multi-carer (\"double-up\") visits cleanly",
    detail: "Two carers on one visit, scheduled and logged without workarounds.",
    careos: { status: "yes" },
    nourish: { status: "partial", note: "Basic support, limited visibility for coordinators." },
    pass: { status: "yes" },
    birdie: { status: "partial", note: "Known clunky workflow for double-up scheduling." },
  },
  {
    feature: "Works offline for carers",
    detail: "Carer app usable with no signal; syncs automatically when back online.",
    careos: { status: "yes" },
    nourish: { status: "no" },
    pass: { status: "yes" },
    birdie: { status: "partial", note: "Limited offline functionality." },
  },
];
