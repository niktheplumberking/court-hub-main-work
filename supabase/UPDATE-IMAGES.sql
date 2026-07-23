-- ============================================================================
-- IMAGE DE-DUPLICATION — one-time update. Paste into the Supabase SQL editor
-- and press RUN once. Points four content fields at their new, unique images
-- (they previously shared files with other sections). Safe to re-run.
-- ============================================================================
update site_content set value = '"/assets/images/construct_glass_install.webp"'::jsonb    where key = 'home.construct.image';
update site_content set value = '"/assets/images/championship_arena_interior.webp"'::jsonb where key = 'about.topic1.image';
update site_content set value = '"/assets/images/padel_club_aerial.webp"'::jsonb           where key = 'about.positioning.landscape_image';
update site_content set value = '"/assets/images/smart_court_tech.webp"'::jsonb            where key = 'about.topic2.image';
