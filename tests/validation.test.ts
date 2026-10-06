import test from "node:test";
import assert from "node:assert/strict";
import { fullDraft, empathizeIssues, definitionIssues, draftPatchSchema } from "../src/lib/validation";
import { sameOrigin } from "../src/lib/origin";
import { learningStepIssues, stepAccess, findingsIssues, focusIssues, optionalInterpretationIssues, type LearningRecord } from "../src/lib/learning-path";
import { STEPS } from "../src/lib/course";
const ready = () => fullDraft({ targetUsers: "Secondary students", learningContext: "Science discussion", emergingFocus: "Explaining reasoning", selectedEvidenceIds: ["observed"], unknowns: [{ id: "u1", question: "Why do students wait?", method: "Interview them after discussion" }] });
test("An assumption cannot satisfy the user-evidence milestone", () => {
  assert.ok(empathizeIssues(ready(), [{ id: "observed", source: "Assumption" }]).some(v => v.includes("evidence")));
  assert.deepEqual(empathizeIssues(ready(), [{ id: "observed", source: "Observation" }]), []);
});
test("An open question must include a way to investigate it", () => {
  const d = ready(); d.unknowns[0].method = " ";
  assert.ok(empathizeIssues(d, [{ id: "observed", source: "Interview" }]).some(v => v.includes("unknown")));
});
test("Submission requires all four definition parts, a real chosen focus and HMW", () => {
  const d = ready();
  d.who = "Secondary students"; d.situation = "Science discussion"; d.need = "To explain their reasoning"; d.difficulty = "They accept answers without discussing reasons";
  d.statement = "During science discussion, students need to explain their reasoning but accept answers without discussing reasons.";
  d.hmw = "How might we help students explain their reasoning together?";
  d.candidates = [{ id: "c1", title: "Explaining reasoning", evidenceIds: ["observed"] }]; d.selectedCandidateId = "missing";
  assert.ok(definitionIssues(d).length); d.selectedCandidateId = "c1"; assert.deepEqual(definitionIssues(d), []);
});
test("Draft updates reject unexpected fields and oversized inputs", () => {
  assert.throws(() => draftPatchSchema.parse({ teacher: true }));
  assert.throws(() => draftPatchSchema.parse({ statement: "x".repeat(5001) }));
});
test("Origin check uses the real host behind Next's internal localhost URL", () => {
  const headers = new Headers({ origin: "https://course.example", host: "course.example", "x-forwarded-proto": "https" });
  assert.ok(sameOrigin({ headers, nextUrl: { origin: "http://localhost:3000", protocol: "http:" } }));
  headers.set("origin", "https://other.example");
  assert.equal(sameOrigin({ headers, nextUrl: { origin: "http://localhost:3000", protocol: "http:" } }), false);
});

function completeRecord(): LearningRecord {
  return {
    draft: fullDraft({
      targetUsers: "Secondary students", learningContext: "Small-group science discussions",
      emergingFocus: "Students give answers without explaining their reasoning.",
      selectedEvidenceIds: ["observed"],
      unknowns: [{ id: "u1", question: "Why do students hesitate to explain?", method: "Interview learners after the discussion" }],
      patterns: [{ id: "p1", title: "Learners state answers without discussing the reasons", evidenceIds: ["observed"] }],
      candidates: [{ id: "c1", title: "Explaining reasoning during group discussion", evidenceIds: ["observed"] }],
      selectedCandidateId: "c1", learningGoal: "Students explain and compare their reasoning with peers.",
      who: "Secondary students", situation: "Small-group science discussions",
      need: "To explain and compare their reasoning", difficulty: "They offer answers without discussing the reasons",
      statement: "During small-group science discussions, secondary students need to explain and compare their reasoning, but they offer answers without discussing the reasons.",
      hmw: "How might we help secondary students explain and compare their reasoning during small-group discussions?"
    }),
    observations: [{ id: "observed", source: "Observation", memberId: "student-a" }],
    memberId: "student-a", empathizeCompleted: true, submissionCount: 1
  };
}

test("Every active learning step rejects an empty record before advancing", () => {
  const r: LearningRecord = { draft: fullDraft({}), observations: [], memberId: "student-a", empathizeCompleted: false, submissionCount: 0 };
  for (const step of STEPS.filter(s => s.key !== "submitted")) {
    assert.ok(learningStepIssues(step.key, r).length > 0, `${step.key} must not allow a blank record`);
  }
  for (const target of STEPS.filter(s => s.key !== "observation")) {
    assert.equal(stepAccess(target.key, r)?.step, "observation", `${target.key} cannot bypass the personal observation`);
  }
});

test("Another member's observation cannot replace the current student's personal record", () => {
  const r = completeRecord(); r.observations[0].memberId = "student-b";
  assert.ok(learningStepIssues("observation", r).length > 0);
  assert.equal(stepAccess("discussion", r)?.step, "observation");
  r.observations.push({ id: "own-start", source: "Assumption", memberId: "student-a" });
  assert.deepEqual(learningStepIssues("observation", r), []);
});

test("Assumptions and deleted records cannot satisfy evidence, findings or focus", () => {
  const r = completeRecord();
  const unreliable = [{ id: "assumed", source: "Assumption", memberId: "student-a" }];
  r.observations = unreliable;
  r.draft.selectedEvidenceIds = ["assumed", "deleted"];
  r.draft.patterns[0].evidenceIds = ["assumed", "deleted"];
  r.draft.candidates[0].evidenceIds = ["assumed", "deleted"];
  assert.ok(learningStepIssues("evidence", r).length > 0);
  assert.ok(findingsIssues(r.draft, r.observations).length > 0);
  assert.ok(focusIssues(r.draft, r.observations).length > 0);
  r.observations.push({ id: "interview", source: "Interview", memberId: "student-a" });
  r.draft.selectedEvidenceIds = ["interview"];
  r.draft.patterns[0].evidenceIds = ["interview"];
  r.draft.candidates[0].evidenceIds = ["interview"];
  assert.deepEqual(learningStepIssues("evidence", r), []);
  assert.deepEqual(findingsIssues(r.draft, r.observations), []);
  assert.deepEqual(focusIssues(r.draft, r.observations), []);
});

test("Future routes identify the first unfinished prerequisite, while earlier pages remain accessible", () => {
  const r = completeRecord(); r.draft.emergingFocus = " "; r.draft.learningGoal = "";
  assert.equal(stepAccess("review", r)?.step, "discussion");
  assert.deepEqual(stepAccess("observation", r), null);
  assert.deepEqual(stepAccess("discussion", r), null);
  r.draft.emergingFocus = "Students do not explain the reasons for their answers.";
  assert.equal(stepAccess("definition", r)?.step, "focus");
  assert.deepEqual(stepAccess("findings", r), null);
  assert.deepEqual(stepAccess("focus", r), null);
});

test("Define requires an explicitly completed Empathize milestone and still checks the current evidence", () => {
  const r = completeRecord(); r.empathizeCompleted = false;
  assert.equal(stepAccess("findings", r)?.step, "summary");
  r.empathizeCompleted = true;
  assert.deepEqual(stepAccess("findings", r), null);
  r.draft.selectedEvidenceIds = [];
  assert.equal(stepAccess("findings", r)?.step, "evidence");
});

test("Saved-work route requires submission; optional feedback and next inquiry can remain blank", () => {
  const r = completeRecord();
  assert.equal(r.draft.feedbackRequest, ""); assert.equal(r.draft.nextInquiry, "");
  assert.deepEqual(learningStepIssues("review", r), []);
  assert.deepEqual(stepAccess("submitted", r), null);
  r.submissionCount = 0;
  assert.equal(stepAccess("submitted", r)?.step, "review");
});

test("Existing submission history remains accessible while the group revises an incomplete draft", () => {
  const r = completeRecord(); r.draft.who = ""; r.draft.selectedEvidenceIds = [];
  assert.deepEqual(stepAccess("submitted", r), null);
  assert.equal(stepAccess("review", r)?.step, "evidence");
  assert.ok(learningStepIssues("review", r).length > 0);
});

test("Completely empty optional interpretations are ignored, but started interpretations need their text", () => {
  const r = completeRecord();
  r.draft.interpretations = [{ id: "i1", text: " ", evidenceIds: [], alternative: " " }];
  assert.deepEqual(optionalInterpretationIssues(r.draft), []);
  r.draft.interpretations[0].evidenceIds = ["observed"];
  assert.ok(optionalInterpretationIssues(r.draft).length > 0);
  r.draft.interpretations[0].text = "Learners may worry about giving an incorrect explanation.";
  assert.deepEqual(optionalInterpretationIssues(r.draft), []);
  assert.equal(r.draft.interpretations[0].alternative.trim(), "");
});

test("Unused added rows do not block a complete record, while partial required rows must be finished or removed", () => {
  const r = completeRecord();
  r.draft.patterns.push({ id: "p2", title: " ", evidenceIds: [] });
  r.draft.candidates.push({ id: "c2", title: " ", evidenceIds: [] });
  r.draft.unknowns.push({ id: "u2", question: " ", method: " " });
  assert.deepEqual(findingsIssues(r.draft, r.observations), []);
  assert.deepEqual(focusIssues(r.draft, r.observations), []);
  assert.deepEqual(learningStepIssues("evidence", r), []);
  r.draft.patterns[1].title = "Learners repeat a peer's answer";
  r.draft.candidates[1].evidenceIds = ["observed"];
  r.draft.unknowns[1].question = "What prompts learners to explain?";
  assert.ok(findingsIssues(r.draft, r.observations).length > 0);
  assert.ok(focusIssues(r.draft, r.observations).length > 0);
  assert.ok(learningStepIssues("evidence", r).length > 0);
});
