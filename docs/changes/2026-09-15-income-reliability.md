---
classification: PUBLIC
---
# Recover paid placements and prove maintenance completed

The payment webhook previously treated a recorded payment as proof that the listing had been updated. A database failure between those steps left subsequent retries unable to fulfill the purchase. Retries now recover from the original payment evidence, preserve its 30-day term, and cannot overwrite a newer purchase. Replaying an expired purchase keeps the placement inactive. Checkout return addresses use the canonical site instead of a caller-provided Origin.

The weekly directory job still read the old public schema after the shared-database move. Its log could be fresh even though no listing was checked. Reads and writes now explicitly select the LegalAIMCP schema and target project. Errors use a distinct exit code, both weekly phases run, and verification plus full-run health artifacts become unsuccessful before work starts. Empty results, failed writes, interrupted runs and discovery failures cannot refresh a successful health record. Dry runs do not count as live verification.

The existing estate revenue job now has an independent companion check for pilot status counts and expected intake/payment route behavior. It uses no model or new scheduler. It requests no contact details or submitted examples, and notifications contain only aggregate counts and an admin link. An undelivered actionable notification stays pending and fails validation. A route reaching input/signature validation proves configuration presence, not a charge or fulfilled purchase.

Verification: 227 app tests and five maintenance tests passed. The full catalog build generated 98 pages with type checks passing. The independent income sensor has nine regression tests, including failed delivery, retries, stale output and malformed responses; existing revenue helper tests still pass. The canonical pilot migration was applied separately and production grants verified: anonymous/authenticated roles have no table or function access, service-role execution is allowed, and the 48 published listings remained intact.

Operational release evidence and any remaining payment-connection step are recorded in the estate's release record. No customer has been charged in this verification, and no recurring customer monitoring has been activated. These changes improve the existing income path and its observability; they do not establish demand or revenue.

This combined change log replaces scattered repair notes. The health files extend the existing weekly and revenue jobs, with their validators updated in the canonical loop registry.
