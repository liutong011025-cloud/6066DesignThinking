import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
if (process.env.ISOLATED_INTEGRATION !== '1') throw new Error('Use npm run test:integration to create a disposable database. Never run this worker against the course preview.');
const base = process.env.TEST_BASE_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error('Run the integration suite only against a local development server.');
const clients = new Map();
async function request(who, method, payload, query = '', expected = 200) {
  const r = await fetch(base + '/api/studio' + query, { method, headers: { 'Content-Type': 'application/json', Origin: base, Cookie: clients.get(who) || '' }, body: method === 'POST' ? JSON.stringify(payload) : undefined });
  const cookie = r.headers.get('set-cookie'); if (cookie) clients.set(who, cookie.split(';')[0]);
  const body = await r.json(); assert.equal(r.status, expected, `Unexpected response for ${payload?.action || query}: ${JSON.stringify(body)}`); return body;
}
async function checkStep(who, step, blockedStep) {
  const result = await request(who, 'POST', { action: 'checkStep', step }, '', blockedStep ? 422 : 200);
  if (blockedStep) {
    assert.equal(result.blockedStep, blockedStep);
    assert.ok(result.details.length > 0, 'A blocked step must explain what is required.');
    assert.ok(result.error.startsWith('Complete '));
  } else assert.equal(result.ok, true);
  return result;
}
async function patchDraft(patch) {
  const current = await request('QA Alice', 'GET');
  await request('QA Alice', 'POST', { action: 'draft', revision: current.group.revision, patch });
  return request('QA Alice', 'GET');
}
await request('anon', 'GET', null, '', 401);
await request('anon', 'POST', { action: 'checkStep', step: 'review' }, '', 401);
await request('teacher', 'POST', { action: 'login', group: 'Nicole', password: 'wrong-password' }, '', 401);
await request('teacher', 'POST', { action: 'login', group: 'Nicole', password: process.env.TEST_TEACHER_PASSWORD || 'yinyin2948' });
const classroom = await request('teacher', 'GET'); assert.equal(classroom.groups.length, 23); assert.equal(classroom.groups[0].name, 'wonderland'); assert.equal(classroom.groups[21].name, 'TUFF'); assert.equal(classroom.groups[22].name, 'Test');
await request('teacher', 'POST', { action: 'checkStep', step: 'review' }, '', 403);
for (let i = 1; i <= 8; i++) await request('trial' + i, 'POST', { action: 'login', group: 23, name: 'Trial ' + i });
const practice = await request('trial8', 'GET'); assert.equal(practice.group.id, 23); assert.equal(practice.group.members.length, 8);
await request('teacher', 'POST', { action: 'feedback', groupId: 23, body: 'Practice feedback for the separate Test workspace.' });
for (const name of ['QA Alice', 'QA Bob', 'QA C', 'QA D', 'QA E', 'QA F']) await request(name, 'POST', { action: 'login', group: 21, name });
await request('seventh', 'POST', { action: 'login', group: 21, name: 'QA Seventh' }, '', 409);
await request('repeat', 'POST', { action: 'login', group: 21, name: '  qa   alice  ' });
let project = await request('QA Alice', 'GET'); assert.equal(project.group.members.length, 6);
await request('QA Alice', 'POST', { action: 'checkStep', step: 'unknown-step' }, '', 400);
await checkStep('QA Alice', 'observation');
// Every destination uses the same prerequisite check, including jumps to a
// sidebar destination or a directly entered later-stage URL.
for (const step of ['discussion', 'evidence', 'summary', 'findings', 'focus', 'definition', 'review', 'submitted']) await checkStep('QA Alice', step, 'observation');
await request('QA Alice', 'POST', { action: 'feedback', groupId: 21, body: 'Student cannot post teacher feedback.' }, '', 403);
await request('QA Alice', 'POST', { action: 'completeEmpathize', revision: project.group.revision }, '', 422);
await request('QA Alice', 'POST', { action: 'submit', revision: project.group.revision }, '', 422);
const note = await request('QA Alice', 'POST', { action: 'observation', values: { user: 'Secondary students', context: 'Science inquiry discussion', body: 'A student accepted a peer answer without explaining their reasoning.', source: 'Observation', sourceDetail: 'Classroom observation, today' } });
await checkStep('QA Alice', 'discussion');
await checkStep('QA Alice', 'evidence', 'discussion');
await checkStep('QA Bob', 'discussion', 'observation');
const bytes = await readFile('public/design-thinking.png');
const upload = new FormData(); upload.set('observationId', note.id); upload.set('file', new Blob([bytes], { type: 'image/png' }), 'evidence-test.png');
const uploaded = await fetch(base + '/api/attachment', { method: 'POST', headers: { Origin: base, Cookie: clients.get('QA Alice') }, body: upload }); assert.equal(uploaded.status, 200);
const withFile = await request('QA Alice', 'GET'); const attachmentId = withFile.group.observations.find(n => n.id === note.id).attachment.id;
const downloaded = await fetch(base + '/api/attachment?id=' + attachmentId, { headers: { Cookie: clients.get('QA Alice') } }); assert.equal(downloaded.status, 200); assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), bytes);
const anonymousFile = await fetch(base + '/api/attachment?id=' + attachmentId); assert.equal(anonymousFile.status, 401);
await request('QA Bob', 'POST', { action: 'observation', id: note.id, values: { user: 'Learners', context: 'Science', body: 'Attempted overwrite of someone else’s record.', source: 'Observation' } }, '', 403);
await request('QA Bob', 'POST', { action: 'comment', observationId: note.id, body: 'We should ask what prevented them from explaining their reasoning.' });
await request('outside', 'POST', { action: 'login', group: 22, name: 'QA Outside' });
const crossGroupFile = await fetch(base + '/api/attachment?id=' + attachmentId, { headers: { Cookie: clients.get('outside') } }); assert.equal(crossGroupFile.status, 404);
await request('outside', 'POST', { action: 'comment', observationId: note.id, body: 'Cross-group access must fail.' }, '', 403);
const otherGroup = await request('QA Alice', 'GET', null, '?group=22'); assert.equal(otherGroup.group.id, 21);
const assumption = await request('QA Bob', 'POST', { action: 'observation', values: { user: 'Secondary students', context: 'Science inquiry', body: 'We think technology might help students discuss more.', source: 'Assumption' } });
// A clearly labelled assumption is a valid personal contribution, while it
// cannot stand in for the group's user evidence in later stages.
await checkStep('QA Bob', 'discussion');
project = await request('QA Alice', 'GET');
await request('QA Alice', 'POST', { action: 'draft', revision: project.group.revision, patch: { selectedEvidenceIds: [assumption.id] } }, '', 400);
const revision = project.group.revision;
await request('QA Alice', 'POST', { action: 'draft', revision, patch: { targetUsers: 'Secondary students', learningContext: 'Science inquiry discussion', emergingFocus: 'Supporting students to explain their reasoning', selectedEvidenceIds: [note.id], unknowns: [{ id: 'qa-unknown', question: 'What prevents students from contributing?', method: 'Interview three students after discussion' }] } });
await request('QA Bob', 'POST', { action: 'draft', revision, patch: { emergingFocus: 'A stale update must not overwrite the group.' } }, '', 409);
project = await request('QA Bob', 'GET'); assert.equal(project.group.draft.targetUsers, 'Secondary students'); assert.equal(project.group.observations.find(n => n.id === note.id).comments.length, 1);
await checkStep('QA Alice', 'evidence');
await checkStep('QA Alice', 'summary');
await checkStep('QA Alice', 'findings', 'summary');
project = await patchDraft({ interpretations: [{ id: 'qa-interpretation', text: '', evidenceIds: [], alternative: 'The task instructions might also be unclear.' }] });
const interpretationBlock = await checkStep('QA Alice', 'summary', 'evidence'); assert.ok(interpretationBlock.details.some(message => message.includes('interpretation')));
const incompleteInterpretation = await request('QA Alice', 'POST', { action: 'completeEmpathize', revision: project.group.revision }, '', 422); assert.ok(incompleteInterpretation.details.some(message => message.includes('interpretation')));
// Leaving an unused optional interpretation row blank is allowed.
project = await patchDraft({ interpretations: [{ id: 'qa-interpretation', text: '', evidenceIds: [], alternative: '' }] });
await request('QA Alice', 'POST', { action: 'completeEmpathize', revision: project.group.revision });
await checkStep('QA Alice', 'findings');
await checkStep('QA Alice', 'focus', 'findings');
const validDefinition = { candidates: [{ id: 'qa-focus', title: 'Explaining reasoning in a group discussion', evidenceIds: [note.id] }], selectedCandidateId: 'qa-focus', who: 'Secondary students', situation: 'Science inquiry discussion', need: 'Opportunities to explain their reasoning', difficulty: 'They accept answers without discussing reasons', statement: 'During science inquiry discussions, secondary students need opportunities to explain their reasoning, but they often accept answers without discussing reasons.', hmw: 'How might we help secondary students explain their reasoning in science inquiry discussions?', feedbackRequest: '', nextInquiry: '' };
project = await patchDraft(validDefinition);
const missingFindings = await request('QA Alice', 'POST', { action: 'submit', revision: project.group.revision }, '', 422); assert.ok(missingFindings.details.some(message => message.includes('pattern'))); assert.ok(missingFindings.details.some(message => message.includes('learning behavior')));
project = await patchDraft({ patterns: [{ id: 'qa-pattern', title: 'Students accept answers without explaining their reasoning.', evidenceIds: [assumption.id] }] });
await checkStep('QA Alice', 'focus', 'findings');
const assumedPattern = await request('QA Alice', 'POST', { action: 'submit', revision: project.group.revision }, '', 422); assert.ok(assumedPattern.details.some(message => message.includes('pattern')));
project = await patchDraft({ patterns: [{ id: 'qa-pattern', title: 'Students accept answers without explaining their reasoning.', evidenceIds: [note.id] }] });
await checkStep('QA Alice', 'focus');
await checkStep('QA Alice', 'definition', 'focus');
project = await patchDraft({ learningGoal: 'Explain a claim and consider peers’ reasons during science inquiry.', candidates: [{ id: 'qa-focus', title: 'Explaining reasoning in a group discussion', evidenceIds: [assumption.id] }] });
await checkStep('QA Alice', 'definition', 'focus');
const assumedFocus = await request('QA Alice', 'POST', { action: 'submit', revision: project.group.revision }, '', 422); assert.ok(assumedFocus.details.some(message => message.includes('chosen learning problem')));
project = await patchDraft({ candidates: validDefinition.candidates, need: '' });
await checkStep('QA Alice', 'definition');
await checkStep('QA Alice', 'review', 'definition');
await request('QA Alice', 'POST', { action: 'submit', revision: project.group.revision }, '', 422);
project = await patchDraft({ need: validDefinition.need });
await checkStep('QA Alice', 'review');
await checkStep('QA Alice', 'submitted', 'review');
const sub = await request('QA Alice', 'POST', { action: 'submit', revision: project.group.revision });
await checkStep('QA Alice', 'submitted');
await checkStep('QA Bob', 'submitted');
await checkStep('QA C', 'submitted');
await checkStep('QA C', 'definition', 'observation');
const after = await request('QA Bob', 'GET'); assert.equal(after.group.submissions[0].version, sub.version); assert.ok(after.group.submissions[0].snapshot.observations.length > 0);
assert.equal(after.group.submissions[0].snapshot.draft.feedbackRequest, ''); assert.equal(after.group.submissions[0].snapshot.draft.nextInquiry, '');
await request('QA Alice', 'POST', { action: 'draft', revision: after.group.revision, patch: { statement: 'A revised statement after our first saved version, kept separate from the submitted record.' } });
const afterEdit = await request('QA Alice', 'GET'); assert.equal(afterEdit.group.submissions[0].snapshot.draft.statement, project.group.draft.statement);
await request('QA Alice', 'POST', { action: 'draft', revision: afterEdit.group.revision, patch: { who: '' } });
await checkStep('QA Alice', 'submitted');
await checkStep('QA Alice', 'review', 'definition');
const revising = await request('QA Alice', 'GET');
await request('QA Alice', 'POST', { action: 'submit', revision: revising.group.revision }, '', 422);
await request('QA Alice', 'POST', { action: 'draft', revision: revising.group.revision, patch: { who: validDefinition.who } });
await request('teacher', 'POST', { action: 'feedback', groupId: 21, body: 'Keep the observed behavior separate from possible reasons. Interview students to check your interpretation.' });
const feedback = await request('QA Bob', 'GET'); assert.ok(feedback.group.feedback[0].body.includes('observed behavior'));
await request('QA Alice', 'POST', { action: 'reflection', body: 'Starting with the learner changed our technology-first assumption.' });
const reflection = await request('QA Alice', 'GET', null, '?reflection=1'); assert.ok(reflection.body.includes('learner'));
await request('teacher', 'POST', { action: 'removeMember', memberId: afterEdit.session.memberId }, '', 409);
const outside = await request('outside', 'GET');
await request('teacher', 'POST', { action: 'removeMember', memberId: outside.session.memberId });
await request('outside', 'GET', null, '', 401);
await request('QA Alice', 'POST', { action: 'logout' }); await request('QA Alice', 'GET', null, '', 401);
console.log('PASS: 22 course groups plus unrestricted Test, teacher authentication, six-member cap, returning identity, required step checks and direct-jump protection, individual contribution gates, shared observations/comments, ownership, protected attachments, cross-group isolation, direct user evidence for patterns and focus, learning-goal requirement, optional fields left blank, optimistic concurrency, Empathize → Define, immutable submissions, teacher feedback, protected roster correction, reflection and logout.');
