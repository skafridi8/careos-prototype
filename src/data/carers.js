// Roster profile fields:
//  skills        — hard competencies checked by the rostering engine
//  availability  — usual working window; visits outside it raise a warning
//  contractedHours — weekly contracted care hours, used for utilisation
//  zone          — home patch, used for travel-time checks between visits
export const carers = [
  {
    id: "sarah",
    name: "Sarah Jenkins",
    role: "Senior Care Assistant",
    initials: "SJ",
    color: "brand",
    gender: "female",
    skills: ["medication", "hoist", "dementia"],
    availability: { days: [0, 1, 2, 3, 4, 5, 6], startHour: 7, endHour: 18 },
    availabilityLabel: "Every day, 07:00–18:00",
    contractedHours: 9,
    zone: "BS6",
  },
  {
    id: "aaron",
    name: "Aaron Mitchell",
    role: "Care Assistant",
    initials: "AM",
    color: "sage",
    gender: "male",
    skills: ["medication", "diabetes"],
    availability: { days: [0, 1, 2, 3, 4], startHour: 7, endHour: 15 },
    availabilityLabel: "Weekdays, 07:00–15:00",
    contractedHours: 5,
    zone: "BS7",
  },
  {
    id: "fatima",
    name: "Fatima Malik",
    role: "Care Assistant",
    initials: "FM",
    color: "amber",
    gender: "female",
    skills: ["medication", "hoist", "parkinsons"],
    availability: { days: [0, 1, 2, 3, 4, 5, 6], startHour: 6, endHour: 14 },
    availabilityLabel: "Every day, 06:00–14:00",
    contractedHours: 8,
    zone: "BS5",
  },
  {
    id: "james",
    name: "James O'Connor",
    role: "Care Assistant",
    initials: "JO",
    color: "brand",
    gender: "male",
    skills: ["medication", "parkinsons", "learning-disability"],
    availability: { days: [0, 1, 2, 3, 4, 5, 6], startHour: 15, endHour: 21 },
    availabilityLabel: "Every day, 15:00–21:00",
    contractedHours: 6,
    zone: "BS4",
  },
  {
    id: "grace",
    name: "Grace Adeyemi",
    role: "Senior Care Assistant",
    initials: "GA",
    color: "sage",
    gender: "female",
    skills: ["medication", "hoist", "dementia", "dysphagia"],
    availability: { days: [0, 1, 2, 3, 4, 5, 6], startHour: 8, endHour: 20 },
    availabilityLabel: "Every day, 08:00–20:00",
    contractedHours: 8,
    zone: "Willowbrook",
  },
  {
    id: "liam",
    name: "Liam Foster",
    role: "Care Assistant",
    initials: "LF",
    color: "amber",
    gender: "male",
    skills: ["medication", "hoist"],
    availability: { days: [0, 1, 2, 3, 4, 5, 6], startHour: 14, endHour: 22 },
    availabilityLabel: "Every day, 14:00–22:00",
    contractedHours: 5,
    zone: "BS4",
  },
];

export function carerById(id) {
  return carers.find((c) => c.id === id);
}

// The carer whose device we're viewing in the mobile carer-app mockup
export const currentCarer = carers[0];
