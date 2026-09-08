---
classification: PUBLIC
---
# Editable document checklist demo

LegalAIMCP now has a concrete document-workflow demonstration at `/document-check`. Visitors can edit a requested checklist, enter received-document metadata, explicitly associate each entry with a request, and see missing items, duplicate associations, differing party/period/version/page metadata, and unassigned entries. The fictional starting example makes each finding inspectable.

The calculation runs in browser memory. It accepts metadata, not uploaded files; no input content is sent to a backend, stored by the checker, or added to booking links or analytics events. Optional browser WebMCP is off by default and checks only the inputs supplied to it, showing its result on the same page. It has no tool for reading existing form contents. Enabling it allows the browser agent to receive the results of its supplied metadata. Normal site page analytics is separate from these fields.

A different filename does not create a mismatch when the user has explicitly associated the document. Omitted optional expectations are not checked. Findings support staff review and do not establish legal sufficiency, authenticity, or completeness. There is no file extraction or existing practice-management integration in this demonstration.

Home, planner, footer, sitemap, and assessment links make the demo discoverable. The assessment explains how to define one approved checklist and a small set of authorized examples, compare staff time and useful findings, and agree a written scope and fee before paid work. No customer savings or paid demand is claimed.

Regression gates cover input bounds, real dates, missing expected metadata, duplicates, field comparisons, detachment/determinism, browser-tool lifecycle, and the absence of transport/storage in the demo's input path. Integrated release evidence is recorded by the reviewer.

Verification: 179 automated tests, TypeScript check, and production build with 97 generated pages passed. Browser review covered clean/deficient examples, edit/add/remove/clear behavior, zero received records, numeric/date validation, mobile overflow, escaped text, and opt-in WebMCP invocation/unregistration.
