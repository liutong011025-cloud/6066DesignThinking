import { STEPS, type StepKey } from "./course";
import type { Draft } from "./types";
import { empathizeIssues, definitionIssues } from "./validation";

type RecordSummary = { id: string; source: string; memberId: string };
export interface LearningRecord {
  draft: Draft; observations: RecordSummary[]; memberId: string;
  empathizeCompleted: boolean; submissionCount: number;
}
const nonblank = (value: string) => !!value.trim();
function directLink(ids: string[], notes: RecordSummary[]) {
  return ids.some(id => notes.some(n => n.id === id && n.source !== "Assumption"));
}
export function findingsIssues(d: Draft, notes: RecordSummary[]) {
  const issues: string[] = [];
  if (!d.patterns.some(p => nonblank(p.title) && directLink(p.evidenceIds, notes))) issues.push("Record at least one pattern and link it to user evidence.");
  if (d.patterns.some(p => (nonblank(p.title) || p.evidenceIds.length > 0) && (!nonblank(p.title) || !directLink(p.evidenceIds, notes)))) issues.push("Finish each started pattern with a title and user evidence, or remove it.");
  return issues;
}
export function focusIssues(d: Draft, notes: RecordSummary[]) {
  const issues: string[] = [];
  const chosen = d.candidates.find(c => c.id === d.selectedCandidateId && nonblank(c.title));
  if (!chosen) issues.push("Describe and select one learning problem.");
  else if (!directLink(chosen.evidenceIds, notes)) issues.push("Link your chosen learning problem to at least one user evidence record.");
  if (!nonblank(d.learningGoal)) issues.push("Describe the learning behavior you hope to enable.");
  if (d.candidates.some(c => c.evidenceIds.length > 0 && !nonblank(c.title))) issues.push("Describe the possible problem you linked to evidence, or remove it.");
  return issues;
}
export function fourPartIssues(d: Draft) {
  const fields = [[d.who, "Identify who experiences the problem."], [d.situation, "Describe the learning situation."], [d.need, "Describe what the learners need."], [d.difficulty, "Describe what makes it difficult."]];
  return fields.filter(([value]) => !nonblank(value)).map(([, message]) => message);
}
export function optionalInterpretationIssues(d: Draft) {
  return d.interpretations.some(v => (nonblank(v.alternative) || v.evidenceIds.length > 0) && !nonblank(v.text)) ? ["Write the interpretation you started, or remove it. Interpretations are optional."] : [];
}
export function learningStepIssues(step: StepKey, r: LearningRecord): string[] {
  const d = r.draft;
  switch (step) {
    case "observation": return r.observations.some(n => n.memberId === r.memberId) ? [] : ["Share at least one personal observation using the form below."];
    case "discussion": return nonblank(d.emergingFocus) ? [] : ["Record your group’s emerging learner challenge."];
    case "evidence": return [...empathizeIssues(d, r.observations), ...optionalInterpretationIssues(d)];
    case "summary": return [...empathizeIssues(d, r.observations), ...optionalInterpretationIssues(d), ...(!r.empathizeCompleted ? ["Review this summary and select Continue to Define."] : [])];
    case "findings": return [...findingsIssues(d, r.observations), ...optionalInterpretationIssues(d)];
    case "focus": return focusIssues(d, r.observations);
    case "definition": return fourPartIssues(d);
    case "review": return [...definitionIssues(d), ...(!r.submissionCount ? ["Submit your definition to save the group’s first version."] : [])];
    case "submitted": return [];
  }
}
export function stepAccess(target: StepKey, r: LearningRecord): { step: StepKey; issues: string[] } | null {
  // A submitted snapshot remains available while the group revises its working draft.
  if (target === "submitted" && r.submissionCount > 0) return null;
  const targetIndex = STEPS.findIndex(s => s.key === target);
  for (const prior of STEPS.slice(0, targetIndex)) {
    const issues = learningStepIssues(prior.key, r);
    if (issues.length) return { step: prior.key, issues };
  }
  return null;
}
