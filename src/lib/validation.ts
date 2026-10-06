import { z } from "zod";
import { EMPTY_DRAFT, type Draft } from "./types";
const short = z.string().trim().max(600);
const long = z.string().trim().max(5000);
const ids = z.array(z.string().max(100)).max(100);
export const draftPatchSchema = z.object({
  targetUsers: short, learningContext: short, emergingFocus: long, selectedEvidenceIds: ids,
  interpretations: z.array(z.object({ id: z.string().max(100), text: long, evidenceIds: ids, alternative: long })).max(30),
  unknowns: z.array(z.object({ id: z.string().max(100), question: long, method: long })).max(30),
  patterns: z.array(z.object({ id: z.string().max(100), title: short, evidenceIds: ids })).max(30),
  candidates: z.array(z.object({ id: z.string().max(100), title: short, evidenceIds: ids })).max(10),
  selectedCandidateId: z.string().max(100), who: short, situation: short, need: short, difficulty: short,
  statement: long, hmw: long, feedbackRequest: long, nextInquiry: long, learningGoal: long
}).partial().strict();
export const observationSchema = z.object({
  user: z.string().trim().min(2).max(600), context: z.string().trim().min(2).max(600),
  body: z.string().trim().min(10).max(5000), source: z.enum(["Observation", "Interview", "Experience", "Assumption"]),
  sourceDetail: z.string().trim().max(1500).default("")
});
export function fullDraft(value: unknown): Draft {
  return { ...EMPTY_DRAFT, ...draftPatchSchema.parse(value ?? {}) };
}
export function empathizeIssues(d: Draft, notes: { id: string; source: string }[]) {
  const problems: string[] = [];
  if (!d.targetUsers.trim()) problems.push("Identify the learners you want to understand.");
  if (!d.learningContext.trim()) problems.push("Describe the learning situation.");
  if (!notes.some(n => n.source !== "Assumption" && d.selectedEvidenceIds.includes(n.id))) problems.push("Select at least one observation, interview or lived experience as evidence.");
  if (!d.emergingFocus.trim()) problems.push("Record the group's emerging focus.");
  if (!d.unknowns.some(u => u.question.trim() && u.method.trim())) problems.push("Add one unknown and how you will investigate it.");
  if (d.unknowns.some(u => (u.question.trim() || u.method.trim()) && (!u.question.trim() || !u.method.trim()))) problems.push("Complete the question and investigation method for each started unknown, or remove it.");
  return problems;
}
export function definitionIssues(d: Draft) {
  const problems: string[] = [];
  if (![d.who, d.situation, d.need, d.difficulty].every(v => v.trim())) problems.push("Complete all four parts of your problem definition.");
  if (d.statement.trim().length < 20) problems.push("Write a complete problem statement.");
  if (d.hmw.trim().length < 15) problems.push("Write a How might we question.");
  if (!d.selectedCandidateId || !d.candidates.some(c => c.id === d.selectedCandidateId && c.title.trim())) problems.push("Choose a learning problem to focus on.");
  return problems;
}
