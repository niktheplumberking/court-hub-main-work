-- One-time update for the LIVE database: the client's real contact details
-- (the seeded rows pin the old placeholders, overriding new code defaults).
-- Idempotent — safe to run more than once, and safe if an earlier version of
-- this file (or UPDATE-WHATSAPP.sql) was already run.
-- HOW TO RUN: Supabase -> SQL Editor -> paste this file -> Run.

update site_content set value = '"971558833836"'::jsonb          where key = 'contact.dispatch.whatsapp_phone';
update site_content set value = '"+971 55 883 3836"'::jsonb      where key = 'contact.info.phone';
update site_content set value = '"support@courthub.ae"'::jsonb   where key = 'contact.info.email';
update site_content set value = '"51A Street, Al Warqa 3, Dubai, UAE"'::jsonb where key = 'contact.info.address';
update site_content set value = '"9:00 am - 5:00 pm"'::jsonb     where key = 'contact.hours.weekday_value';
update site_content set value = '"Closed"'::jsonb                where key = 'contact.hours.saturday_value';
update site_content set value = '"Closed"'::jsonb                where key = 'contact.hours.sunday_value';
