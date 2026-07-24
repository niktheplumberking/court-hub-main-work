-- One-time update for the LIVE database: point the Contact page's WhatsApp
-- dispatcher at the client's real business number (the seeded row pins the old
-- placeholder, overriding the new code default). Safe to run more than once.
-- HOW TO RUN: Supabase -> SQL Editor -> paste this file -> Run.

update site_content
set value = '"971558833836"'::jsonb
where key = 'contact.dispatch.whatsapp_phone';
