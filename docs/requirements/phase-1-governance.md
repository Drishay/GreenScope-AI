# GreenScope AI — Phase 1: Requirements & Governance

**Status:** Draft baseline for implementation  
**Target pilot:** Uttar Pradesh, initially Noida / Greater Noida, with a jurisdiction-aware design  
**Scope:** Requirements, authority routing, legal safeguards, workflows, data model, acceptance criteria  
**Important:** This is a product requirements document, not legal advice and not a delegation of statutory powers to GreenScope AI. Before real-world use, the pilot must be reviewed by the participating authority's legal/technical officers.

## 1. Product objective

Turn the existing React/Vite + Express prototype into an environmental screening and case-management platform. The system should combine geospatial evidence, transparent estimates, human review, institution responses, documented decisions and follow-up.

The current `server/fakeAnalyze.js` generates synthetic values. Until Phase 4 replaces and validates it, every report must be marked **DEMO / SYNTHETIC DATA — NOT FOR REGULATORY USE**. A language model's general knowledge is not a substitute for satellite-image classification, measured emissions, inspection, or legal findings.

### Product principles

1. **Evidence before action:** A screening flag is a lead for review, not proof of an offence.
2. **Human authority:** Only a competent, authorized official can issue an official statutory notice, order an inspection, or decide enforcement.
3. **Jurisdiction-aware routing:** Route by geography, issue type, facility type, applicable law, and authority assignment. Never assume one authority handles every issue.
4. **Right to respond:** Preserve the notice, supporting evidence, delivery record, response, attachments, review, reasons, and appeal/escalation information.
5. **No automatic penalty:** A missed GreenScope deadline can mark a case overdue and alert an assigned officer; it cannot itself impose a fine, close a facility, or trigger a legal finding.
6. **Traceability:** Every material change and official action is attributable to an authenticated actor and timestamp.
7. **Privacy and minimisation:** Collect only data needed for a defined case purpose; protect contact details, uploaded records, and sensitive facility information.
8. **Uncertainty is visible:** Show method, image/source date, resolution, confidence, known limitations, and whether a value is observed, estimated, supplied, or verified.

## 2. Users, roles and access

The public website and public educational pages remain usable without login. Case data and administrative functions require authentication.

### 2.1 Public visitor
- View homepage, methodology, FAQs, policies, authority information, and public guidance.
- Use public environmental screening only if the operator explicitly enables it; results must be labelled indicative and not presented as official findings.
- Cannot view private institution records, draft notices, responses, user details, or audit logs.

### 2.2 Super Admin
- Create, suspend and manage Authority and Institution accounts.
- Create authority organisations/teams, configure jurisdictions, issue categories, user roles, and assignments.
- View operational dashboard: assigned/unassigned cases, overdue responses, pending reviews, actions taken, and audit events.
- Reassign cases and manage system configuration.
- Cannot silently edit or erase an authority's signed decision or institution submission. Corrections create a new version and audit event.
- Does not acquire statutory enforcement powers merely by holding this application role.

### 2.3 Government Authority user
- Access only cases and institutions assigned to their organisation/jurisdiction, subject to configured permissions.
- Review evidence and estimates; mark a finding as accepted, rejected, needs more evidence, or referred.
- Draft and issue an official notice only where the user is authorised and the notice is approved through the participating authority's real process.
- Record the legal basis, authority/office, signatory, service method, applicable response deadline, requested information, and next step.
- Review institution replies, request clarification, record inspection outcomes, corrective actions, closure, or referral.
- View overdue cases in their scope. No cross-jurisdiction access by default.

### 2.4 Institution user
- Access cases explicitly linked to their institution/site.
- View the notice, case reference, reason, relevant evidence, issuing office, due date, requested records, and response instructions.
- Submit a response, evidence, correction/dispute, mitigation plan, or request for clarification/extension where the relevant authority process permits it.
- View submission receipt, case status, further requests, and closure/decision records.
- Cannot edit the original notice or another institution's case.

### 2.5 Permissions matrix (baseline)

| Capability | Public | Super Admin | Authority | Institution |
|---|---:|---:|---:|---:|
| Public information and policies | Yes | Yes | Yes | Yes |
| View private case records | No | Oversight scope | Assigned scope | Own institution only |
| Manage users and authority mapping | No | Yes | No | No |
| Review environmental evidence | No | Yes, operational oversight | Assigned cases | Own case evidence |
| Draft/issue official notice | No | No by default; configure only if legally authorised | Only authorised users | No |
| Submit institution response | No | No | No | Own case |
| Record official decision/action | No | No | Assigned cases, authorised actions | No |
| View audit history | No | System audit | Assigned cases | Own case events visible to them |

All permissions must be enforced by the backend API, not only by hiding frontend buttons.

## 3. Authority and jurisdiction framework

Authority routing is a configurable directory, not a hard-coded claim that every listed body has power over every case. Confirm the precise authority, current delegation, local procedure, applicable statute/rules, and notice template with the participating government office before enabling official use.

### 3.1 Initial authority categories

- **State Pollution Control Board / Pollution Control Committee (SPCB/PCC):** Core state/UT pollution regulator for matters under applicable air, water, environmental protection, consent/authorization and waste rules. Exact powers and procedure depend on the applicable law and facts.
- **Central Pollution Control Board (CPCB):** National-level functions such as technical guidance, coordination, standards and data; not the default first-line authority for every local site complaint.
- **Commission for Air Quality Management (CAQM):** Relevant to air-quality matters within its statutory NCR and adjoining-area jurisdiction and applicable directions. Do not route every environmental/vegetation issue to CAQM.
- **Municipal / urban local body / development authority:** Potentially relevant for municipal solid waste, sanitation, local land-use, building, parks/tree, and civic matters under the specific local law and delegation.
- **District administration:** May have defined coordination, disaster, land, waste, or other responsibilities under applicable law/orders; do not assume blanket pollution-enforcement authority.
- **Bureau of Energy Efficiency (BEE) / Indian Carbon Market institutions:** Relevant to the Carbon Credit Trading Scheme and energy-efficiency/carbon-market mechanisms. Not a general municipal pollution enforcement authority.
- **Other specialist bodies:** Forest/tree authorities, groundwater/water authorities, fire/electrical authorities, or other regulators may be relevant based on issue and location. Include only after validating jurisdiction.

### 3.2 Noida / Greater Noida pilot

Create a reviewed directory for Uttar Pradesh and the pilot geography, with named organisations, office/contact details approved for publication, jurisdiction polygons or documented geographic scope, issue categories, escalation contact, and the date the mapping was last verified. Candidate routing may include the Uttar Pradesh Pollution Control Board, relevant municipal/local bodies, development authority, district administration, and CAQM for matters within CAQM's statutory remit. Final routing must be confirmed by the participating offices; do not infer a specific office from geolocation alone.

### 3.3 Routing record

Each case must record:
- site coordinates and boundary; address and administrative area, if known;
- issue category and alleged/observed condition;
- proposed authority and reason for routing;
- jurisdiction rule and version used;
- reviewer who confirmed the assignment;
- referral history, transfer reason, and receiving office;
- legal basis entered by an authorised reviewer before any official notice.

## 4. Legal and notice safeguards

### 4.1 Separate GreenScope workflow messages from official notices

Use distinct document types and UI labels:
1. **Screening report:** Technical estimate; not an accusation or legal notice.
2. **Request for information / voluntary follow-up:** Platform communication, clearly labelled non-statutory unless the authority has formally adopted and authorised it.
3. **Official statutory notice/order:** Issued only by the competent authority using its approved process, legal basis, signatory and service requirements. GreenScope may record and assist with workflow; it does not confer authority.

Official documents must not be generated from a score alone. The authority user must select the applicable legal basis and complete mandatory fields; approval/signature and service must follow that authority's actual procedure.

### 4.2 Deadlines and service

- Do **not** hard-code a universal 15-day, 30-day, 60-day, or 2–3-month deadline for all cases.
- Store a due date per notice, entered or approved by an authorised officer, together with the legal/policy basis, date of service, service method, and calculation notes.
- If a platform-only voluntary request has a deadline, label it as a platform/pilot target and distinguish it from a statutory deadline.
- Support extensions, corrected service, disputed receipt, and amended notices with a full history.
- “Overdue” means a workflow status, not a finding of guilt.
- A proposed inspection after 2–3 months is a configurable follow-up plan, not a universal legal requirement. The responsible authority decides the timing based on law, urgency, risk and case facts.
- Any emergency/exception procedure must be configured and approved by the competent authority; the application must not infer that an exception applies.

### 4.3 Decisions and escalation

Possible statuses: Screening; Awaiting internal review; Rejected/insufficient evidence; Routed; Draft notice; Awaiting authorised approval; Issued; Service pending; Served; Awaiting institution response; Response received; Under review; Clarification requested; Inspection planned; Inspection completed; Corrective action recorded; Referred; Closed; Withdrawn; Overdue.

Only an authorised official can record a statutory decision. Each decision should capture reasons, evidence considered, decision-maker, date, legal basis, next step, and review/appeal information where applicable. Escalation is a notification/referral workflow, not automatic punishment.

## 5. Evidence and information requested from institutions

Ask for information relevant to the issue and legal basis, not every item for every institution. The authority selects the required checklist per case.

### 5.1 Core site and identity
- Legal entity/institution name, site address, site/plot identifier, authorised contact and role.
- Proof that the respondent is the responsible operator/occupier/owner where relevant.
- Site boundary/map correction, occupancy/use, and relevant operating dates.
- Consent/authorisation or permit identifiers and validity dates, where applicable.

### 5.2 Emissions, energy and generators (where relevant)
- Electricity consumption statements and period covered.
- Fuel type, quantity purchased/used, invoices or logs for diesel/petrol/gas/other fuels.
- Generator capacity, operating hours, maintenance/emission-control records, stack/emission-test reports and applicable permissions, where legally relevant.
- Boiler/process/equipment inventory and relevant monitoring or audit reports.
- Explanation of methodology and source records for any institution-supplied emissions figure.

### 5.3 Waste, scrap and water (where relevant)
- Waste types and quantities; segregation, storage and disposal records.
- Authorised waste-handler receipts/manifests and applicable authorisations.
- Hazardous/e-waste/plastic/construction-demolition waste records only where the relevant rules apply.
- Water abstraction/consumption/discharge records, consents and test reports where relevant.
- Dated site photographs, incident logs, corrective action records, and contractor details where relevant.

### 5.4 Vegetation, solar and land-cover disputes
- Dated, geolocated photographs or survey/map evidence.
- Tree/landscape inventory or maintenance records where available.
- Rooftop solar installation documents or photographs if the model may have missed/incorrectly classified panels.
- Explanation of recent construction, seasonal changes, shadows, roof material, temporary storage, or other possible classification confounders.
- Institution can dispute site boundary, imagery date, classification, or interpretation without admitting a violation.

### 5.5 Submission handling
- Record who submitted, when, what files were submitted, file hash, malware-scan status, and version.
- Support a receipt and allow supplementary submissions.
- Limit file types and size; securely store uploads; do not expose them through public URLs.
- Mark each field as institution-supplied, third-party, remotely observed, model-estimated, or independently verified.

## 6. Environmental analysis requirements (Phase 4 dependency)

### 6.1 Baseline map classes
Vegetation/tree canopy, buildings/roof surfaces, roads/impervious surfaces, open/bare land, and water. Define class ontology and handling for shadows, mixed pixels, seasonal crops, construction, and unknown areas.

### 6.2 Additional targets for the capture/label pipeline
- Rooftop solar panels;
- likely diesel generator locations/equipment where imagery and resolution make this feasible;
- scrap/storage/waste areas;
- vegetation and tree canopy;
- optional roof/building/impervious-surface classes.

The app must not claim a generator's fuel type or actual emissions from satellite imagery alone. These targets may require ground photos, institutional submissions, higher-resolution imagery, or field verification.

### 6.3 Capture and annotation workflow
- Capture record: source, licence/permission, acquisition date, resolution, geospatial footprint, sensor/provider, preprocessing, and consent/privacy basis where relevant.
- Annotation task: image/tile, label schema/version, annotator, reviewer, confidence, quality flags, and status.
- Label geometry: polygons/masks for segmentation and boxes/points for object detection, as appropriate.
- Dataset version: train/validation/test split by geography/time to reduce leakage; class balance and provenance.
- Store correction feedback separately from model truth until reviewed; institution dispute is a candidate annotation, not an automatic relabel.
- Track model version, evaluation metrics by class/region/season, known failure modes, confidence/calibration, and rollback path.

### 6.4 Minimum analysis record
- AOI polygon, area, location and coordinate reference system.
- Imagery/source dates, spatial resolution, provider/licence, and processing pipeline version.
- Per-class area and percentage, method, confidence/uncertainty, and unknown/unclassified area.
- Carbon/emissions values must have a documented formula, inputs, units, timeframe, assumptions, and source. Satellite land cover alone cannot establish actual facility emissions.
- Separate **estimated vegetation carbon sequestration** from **measured facility emissions** and from **verified carbon credits**.
- Do not describe planting trees or installing solar as automatically earning carbon credits. Credit issuance depends on an eligible programme/project, baseline, monitoring, verification and applicable scheme requirements.

## 7. Public homepage, FAQs and policies

Public content must explain:
- what GreenScope AI observes and estimates, and what it cannot determine;
- image date/resolution, uncertainty, seasonal variation, shadows, mixed pixels and model limitations;
- difference between vegetation cover, carbon absorption estimate, operational greenhouse-gas emissions and regulatory compliance;
- recommended mitigation actions: protect existing trees, plant suitable native species, improve green-space maintenance, reduce energy demand, consider rooftop solar after technical assessment, improve waste segregation, and use permeable surfaces where suitable;
- that actions must be context-specific and should not promise an emissions reduction without a defensible calculation;
- case/notice lifecycle, how to authenticate a case token, how to reply/dispute, privacy and records handling;
- what happens when a response is late: the platform marks overdue and alerts the assigned authority; only the competent authority determines any legal consequence;
- carbon credits are not guaranteed and are subject to scheme eligibility, measurement, verification and registration.

Required pages/sections: Terms of Use; Privacy Policy; Environmental Methodology & Limitations; Notice and Case Process; Authority Directory; FAQs; Contact/Grievance route. Legal counsel and the participating authority must review the final wording before production.

## 8. Case token and security requirements

- Generate an opaque, high-entropy case reference/token; do not use sequential IDs as secrets.
- A token is a locator, not a replacement for institution account authentication for sensitive records. If a limited unauthenticated response flow is offered, use a separate expiring one-time link or verification challenge and expose only the minimum case details.
- Rate-limit token attempts; prevent enumeration; support revocation and reissue; log sensitive access.
- Enforce server-side role, organisation, institution, case and jurisdiction checks on every protected endpoint.
- Store password hashes using a modern password-hashing algorithm; use secure session cookies or carefully managed short-lived tokens; implement CSRF protection if cookie sessions are used.
- Keep secrets server-side; validate and normalise all inputs; use upload limits and scanning; apply safe logging and retention.
- Maintain append-only audit events for sign-in/security events, role changes, assignment changes, notice issue/service, replies, attachments, decisions, deadline changes and closure.
- Define retention/deletion, backup/restore, incident response, and data-access procedures before real deployment.

## 9. Proposed core data entities

1. `User`: id, name, email/phone, password hash or identity provider id, status, last login.
2. `RoleAssignment`: user id, role, organisation id, scope/jurisdiction, granted by, timestamps.
3. `Organisation`: type, legal name, verified identifiers, contacts, status.
4. `InstitutionSite`: institution/owner, site boundary, address, facility type, jurisdiction, verification status.
5. `AuthorityDirectoryEntry`: authority, issue categories, geographic scope, legal remit notes, contact, verification date, source references.
6. `Analysis`: existing report fields plus AOI, source/method/model versions, dates, uncertainty, provenance, status, synthetic/demo flag.
7. `Case`: case reference, site, issue, evidence links, routing, assigned authority/team, status, priority, created/updated timestamps.
8. `Notice`: type, draft/issued status, legal basis, issuing office, signatory, content version, served date/method, response deadline, delivery evidence.
9. `InstitutionResponse`: case/notice, author, submitted time, response text, requested-field answers, attachment references, receipt ID, version.
10. `EvidenceAsset`: storage key, hash, MIME type, source, date, access policy, scan state, provenance.
11. `Inspection`: planned/completed dates, responsible officer, checklist, findings, evidence and follow-up.
12. `ActionOrDecision`: type, reasons, decision-maker, legal basis, date, outcome, review/appeal metadata.
13. `AuditEvent`: actor, action, target, timestamp, request/correlation id, before/after reference, reason.
14. `AnnotationTask` / `Annotation` / `DatasetVersion` / `ModelVersion`: capture provenance, labels, review, splits, metrics and versioning.
15. `DeadlinePolicy`: notice type, jurisdiction, legal/policy source, effective dates and configurable calculation rules.

Use relational storage (SQLite for a local single-operator prototype; PostgreSQL for multi-user deployment) with migrations and constraints. Do not extend the current shared JSON store as the final multi-user system.

## 10. Delivery phases and dependencies

### Phase 1 — Requirements and governance (this document)
- Approve roles, permissions, jurisdiction mapping, notice lifecycle, data checklist, public claims and acceptance criteria.
- Obtain pilot stakeholder/legal review before official notices are enabled.

### Phase 2 — Identity, database and RBAC
- Introduce a relational schema and migrations.
- Implement login/session management, role assignments, organisation/site scoping, user management and audit events.
- Keep public pages accessible without login.

### Phase 3 — Case and notice lifecycle
- Case creation/routing, draft/approval/issue/service tracking, institution response portal, evidence upload, deadline notifications, review/inspection/decision/closure.
- Use clearly separated platform requests and official statutory notices.

### Phase 4 — Real environmental intelligence and annotation
- Establish data providers/licensing, preprocessing and reproducible geospatial pipeline.
- Implement baseline land-cover segmentation and uncertainty reporting; build capture/annotation workflows.
- Evaluate against labelled ground truth and document metrics before operational claims.

### Phase 5 — Public content, security and launch readiness
- Publish reviewed policies, methodology, FAQs and authority directory.
- Test access control, case lifecycle, upload safety, audit integrity, backups, performance, accessibility and responsive UI.
- Run a pilot in shadow mode before any enforcement-related workflow is relied upon.

## 11. Acceptance criteria for Phase 1

Phase 1 is complete when:
- [ ] Role and permission matrix is approved.
- [ ] Authority routing directory schema and pilot verification owner are defined.
- [ ] Screening, platform request and official notice are distinct document/workflow types.
- [ ] Deadline rules are configurable and every deadline has a recorded basis.
- [ ] No automatic penalty or legal finding follows from an AI score or overdue platform status.
- [ ] Institution response/evidence checklist is issue-specific.
- [ ] Environmental outputs have provenance, units, assumptions and uncertainty requirements.
- [ ] Capture/annotation provenance and review workflow are specified.
- [ ] Public page requirements and carbon-credit limitations are defined.
- [ ] Pilot legal/technical reviewers and sign-off process are identified.

## 12. Official references for legal and jurisdiction review

These references are a starting point; verify the latest amendments, notifications, delegation and local procedure before implementation.

- Ministry of Environment, Forest and Climate Change — Environment (Protection) Act, 1986: https://www.moef.gov.in/uploads/2017/06/eprotect_act_1986.pdf
- Ministry of Environment, Forest and Climate Change — Environment (Protection) Rules, 1986: https://moef.gov.in/uploads/2017/06/2The%20Environment%20%28Protection%29%20Rules%2C%201986.pdf
- Central Pollution Control Board — functions under the Air Act: https://cpcb.nic.in/mandate-4/
- Commission for Air Quality Management — official website and jurisdiction/orders: https://caqm.nic.in/
- Bureau of Energy Efficiency — Indian Carbon Market / Carbon Credit Trading Scheme: https://www.beeindia.gov.in/show_content.php?lang=1&level=1&lid=294&ls_id=189

## 13. Phase 1 decisions still requiring stakeholder confirmation

These are implementation gates, not assumptions to silently hard-code:
- Which government office will sponsor/own the pilot and approve official notices?
- Which site types are in scope first (schools, hospitals, commercial buildings, industrial sites, institutions, or all)?
- Will the first release be a **shadow-mode advisory system** only, or is an authority formally participating?
- Which data provider/licence and imagery resolution are permitted for the target classes?
- Which identity/verification method is acceptable for institutions and government staff?
- What retention period and disclosure rules apply to case documents, uploaded evidence and audit logs?
- Who signs off on the legal templates, jurisdiction map, deadline policies and public claims?


## 14. Confirmed pilot decisions (2026-10-27)

These decisions were confirmed by the project owner and supersede any unresolved defaults above:

- **Pilot mode:** Advisory / shadow mode. The first release supports screening, human review and case workflow; it does not represent itself as an official enforcement channel.
- **Initial site scope:** Mixed institutions and buildings. Requests for information are issue-specific and must not require irrelevant records.
- **Identity approach:** Secure accounts for Super Admin, Authority and Institution. Public pages remain accessible without login. Case tokens may be used as references, but not as a substitute for authentication for sensitive records.
- **Environmental analysis priority:** Real satellite/geospatial land-cover analysis first, followed by object-level detection for solar panels, generator-related equipment where imagery supports it, and scrap/storage/waste areas.
- **First geographic focus:** Design for a Uttar Pradesh pilot, with Noida / Greater Noida as the initial candidate geography. Authority mapping is a reviewed configuration and must be validated with participating offices.
- **Existing synthetic reports:** Preserve legacy reports for history/demo purposes, but visibly label them as synthetic. Do not mix them with real geospatial outputs without a clear method/source marker.

### Phase 1 decision implications

1. Do not enable official statutory notice issuance in the first advisory release. Support internal drafts and clearly labelled non-statutory requests only; an authority-partner process can be enabled later after written approval and legal review.
2. Do not claim that a site violates law solely because the model flags low vegetation, high built cover, a possible generator, or a possible scrap area.
3. Prioritise a reproducible land-cover pipeline with source imagery, image dates, class-wise area, confidence/uncertainty and unknown pixels. Object detection follows as a separate model/data milestone.
4. Use account-based RBAC and organisation/site scoping from the beginning. A public site or token-only flow must not leak case records.
