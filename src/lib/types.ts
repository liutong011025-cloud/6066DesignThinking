export type NoteSource = "Observation" | "Interview" | "Experience" | "Assumption";
export interface MemberData { id: string; name: string; createdAt: string }
export interface CommentData { id: string; body: string; createdAt: string; member: { id: string; name: string } }
export interface ObservationData {
  id: string; memberId: string; user: string; context: string; body: string; source: NoteSource;
  sourceDetail: string; createdAt: string; member: { id: string; name: string }; comments: CommentData[];
  attachment: { id: string; filename: string; size: number } | null;
}
export interface Interpretation { id: string; text: string; evidenceIds: string[]; alternative: string }
export interface Unknown { id: string; question: string; method: string }
export interface Pattern { id: string; title: string; evidenceIds: string[] }
export interface Candidate { id: string; title: string; evidenceIds: string[] }
export interface Draft {
  targetUsers: string; learningContext: string; emergingFocus: string; selectedEvidenceIds: string[];
  interpretations: Interpretation[]; unknowns: Unknown[]; patterns: Pattern[];
  candidates: Candidate[]; selectedCandidateId: string;
  who: string; situation: string; need: string; difficulty: string; statement: string; hmw: string;
  feedbackRequest: string; nextInquiry: string; learningGoal: string;
}
export const EMPTY_DRAFT: Draft = {
  targetUsers: "", learningContext: "", emergingFocus: "", selectedEvidenceIds: [], interpretations: [],
  unknowns: [], patterns: [], candidates: [], selectedCandidateId: "", who: "", situation: "", need: "",
  difficulty: "", statement: "", hmw: "", feedbackRequest: "", nextInquiry: "", learningGoal: ""
};
export interface SubmissionData { id: string; version: number; createdAt: string; submittedBy: string; snapshot: { draft: Draft; observations: ObservationData[]; members: MemberData[] } }
export interface ProjectData {
  session: { role: "student" | "teacher"; memberId?: string; groupId?: number; name: string };
  group: { id: number; name: string; revision: number; draft: Partial<Draft>; empathizeCompletedAt: string | null;
    updatedAt: string; members: MemberData[]; observations: ObservationData[]; submissions: SubmissionData[];
    feedback: { id: string; body: string; createdAt: string }[] };
}
