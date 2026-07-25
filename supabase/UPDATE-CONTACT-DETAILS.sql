-- One-time update for the LIVE database: the client's real WhatsApp number for
-- the Contact page dispatcher AND the displayed phone number on the Contact
-- info card. Replaces/extends UPDATE-WHATSAPP.sql — safe to run more than
-- once, and safe even if you already ran the earlier file.
-- HOW TO RUN: Supabase -> SQL Editor -> paste this file -> Run.

update site_content
set value = '"971558833836"'::jsonb
where key = 'contact.dispatch.whatsapp_phone';

update site_content
set value = '"+971 55 883 3836"'::jsonb
where key = 'contact.info.phone';
