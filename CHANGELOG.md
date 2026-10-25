# Client revisions

Client revision numbers are separate from the application package version.

## 1.3 · 25 October 2026

- Replace the eight 220 × 220 NOX catalogue photos with the client-approved, exact-model official 2026 transparent 1200 × 1200 PNGs. Preserve original bytes, upright framing, holes and straps; retain the shop’s pale-blue backgrounds and layout.
- Keep prices, stock, product details and condition labels unchanged. Manufacturer photos are model references, including the item labelled Good.
- Archive the approved files, source links and SHA-256 checksums in this revision. The release-only image updater saves every original image array before writing, checks for concurrent image changes, and provides a guarded restore command. Existing storage objects are retained.

Rollback requires restoring the saved product image arrays as well as the source/build. See `docs/releases/v1.3.md`.

## 1.2 · 25 October 2026

- Replace the former court-booking calls to action with About Us links, including desktop heroes, mobile navigation, and the About hero, in English and Arabic.
- Simplify the visible court-construction enquiry card to name, contact information, location, and Chat on WhatsApp. Remove model selection and specification panels from this form.
- Preserve original product-photo pixels on the homepage, catalogue, gallery, and related products: no homepage image re-encoding, no colour blending, and no cropping in the top-sellers rail.
- Show selected image dimensions in the product uploader and warn when a photo is below 1,200 pixels on its longest side. Uploads retain their original bytes and the existing 10 MB/type/admin restrictions.
- Upgrade matching retired form copy when reading older content overrides, without changing the database or replacing custom client copy.

Existing low-resolution photos cannot recover detail through a code update. The reviewed catalogue originals were 220 × 220 pixels; replace those with the original camera files for sharper large images.

Validation: TypeScript check, production build, isolated original-byte upload and authorization/type/size tests, and desktop/mobile English/Arabic browser checks. No database migration or change to payment processing.

## 1.1 · Original main baseline

Commit: `709255c495ec458db2a12c75b61dfca01344d337`.

Preserved before client revisions. A local annotated `v1.1` tag and verified archive contain all 653 original tracked files. Keep the original baseline and each subsequent revision recoverable; never rewrite their history. Code rollback does not restore live database records or remote uploads.
