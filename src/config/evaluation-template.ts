export type FieldType = "kpi-list" | "rating-grid" | "text-area" | "text-input";

export interface EvaluationItem {
  id: string;
  label: string;
  description?: string;
}

export interface EvaluationSection {
  id: string;
  title: string;
  description?: string;
  type: FieldType;
  items?: EvaluationItem[]; // For rating-grid
  placeholder?: string; // For text-area
}

export const evaluationTemplate: EvaluationSection[] = [
  {
    id: "kpis",
    title: "Section 1. Role / Project Summary",
    description: "Please document the 3-5 most critical goals/KPIs for the current review period.",
    type: "kpi-list",
  },
  {
    id: "coreSkills",
    title: "Section 2. Core Skills",
    description: "Rate the following core skills (1 = Needs Improvement, 5 = Outstanding). Provide examples.",
    type: "rating-grid",
    items: [
      { id: "ownership", label: "Ownership & Accountability" },
      { id: "communication", label: "Communication" },
      { id: "teamwork", label: "Teamwork & Collaboration" },
      { id: "adaptability", label: "Adaptability" },
      { id: "prioritization", label: "Prioritization & Time Management" },
    ],
  },
  {
    id: "functionalSkills",
    title: "Section 3. Functional / Cross-Team Skills",
    description: "Rate the following functional skills (1 = Needs Improvement, 5 = Outstanding). Provide examples.",
    type: "rating-grid",
    items: [
      { id: "technicalCompetence", label: "Technical Competence" },
      { id: "crossFunctional", label: "Cross-functional Operations" },
      { id: "initiative", label: "Initiative & Problem Solving" },
    ],
  },
  {
    id: "growthAndDevelopment",
    title: "Section 4. Growth & Development",
    description: "Rate your growth and development (1 = Needs Improvement, 5 = Outstanding). Provide examples.",
    type: "rating-grid",
    items: [
      { id: "leadership", label: "Leadership & Coaching" },
      { id: "strategicThinking", label: "Strategic Thinking" },
      { id: "agility", label: "Learning Agility" },
    ],
  },
  {
    id: "keyAchievements",
    title: "Section 5. Key Achievements & Results",
    description: "Describe 2-3 major accomplishments during this review period. Highlight impact and metrics where possible.",
    type: "text-area",
    placeholder: "Example: Successfully delivered Project X two weeks ahead of schedule, resulting in a 15% increase in Q3 revenue...",
  },
  {
    id: "challenges",
    title: "Section 6. Challenges Encountered",
    description: "Describe any challenges faced and how you overcame them.",
    type: "text-area",
    placeholder: "Example: Faced resource constraints during the rollout phase, mitigated by reprioritizing tasks...",
  },
  {
    id: "areasForDevelopment",
    title: "Section 7. Areas for Development",
    description: "Identify areas where you'd like to improve or acquire new skills.",
    type: "text-area",
    placeholder: "Example: I would like to improve my public speaking skills by presenting at the next all-hands...",
  }
];
