export const GROUP_NAMES = [
  "wonderland", "SevenFade", "eat what", "SHOEGAZERS", "Star Lab", "The Foundry",
  "The Six", "Nova", "Spark", "Septastar", "ultraman&woman", "Six gods",
  "The Professionals™", "Hello World", "EduVengers", "studio 6.0", "High-Five",
  "Six Wonders", "DreamTeam", "Bugless", "7-eleva", "TUFF", "Test"
] as const;
export const STEPS = [
  { key: "observation", title: "Individual observation", phase: "Empathize", number: "01" },
  { key: "discussion", title: "Group discussion", phase: "Empathize", number: "02" },
  { key: "evidence", title: "Evidence & unknowns", phase: "Empathize", number: "03" },
  { key: "summary", title: "Empathize summary", phase: "Empathize", number: "04" },
  { key: "findings", title: "Review findings", phase: "Define", number: "05" },
  { key: "focus", title: "Focus the problem", phase: "Define", number: "06" },
  { key: "definition", title: "Write the definition", phase: "Define", number: "07" },
  { key: "review", title: "Review & submit", phase: "Define", number: "08" },
  { key: "submitted", title: "Your saved work", phase: "Define", number: "09" }
] as const;
export type StepKey = typeof STEPS[number]["key"];
