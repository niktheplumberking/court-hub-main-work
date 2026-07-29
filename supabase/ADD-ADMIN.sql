-- ============================================================================
-- Enroll a login account as a Court Hub admin.
--
-- STEP 1 (do this FIRST, in the Supabase dashboard):
--   Authentication -> Users -> "Add user" -> "Create new user"
--     Email:            the person's email
--     Password:         a strong temporary one
--     Auto Confirm User: ON   <-- important, or they cannot sign in
--
-- STEP 2: change the email below to that same address and run this file.
--   Being able to log in is NOT enough to change anything: every admin action
--   checks this allow-list. A user who is not listed here is rejected.
--
-- Idempotent: safe to run more than once.
-- HOW TO RUN: Supabase -> SQL Editor -> paste -> Run.
-- ============================================================================

insert into admins (user_id, email)
select id, email
from auth.users
where lower(email) = lower('CHANGE-ME@example.com')
on conflict (user_id) do nothing;

-- Check the result — the address should now appear in this list:
select email, created_at from admins order by created_at;

-- ----------------------------------------------------------------------------
-- To REMOVE someone's admin rights later (they keep the login but can no
-- longer change anything). Delete the user entirely in Authentication -> Users.
-- ----------------------------------------------------------------------------
-- delete from admins where lower(email) = lower('person@example.com');
