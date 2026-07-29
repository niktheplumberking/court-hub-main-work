/**
 * Public visibility switch for the whole tournaments section.
 *
 * OFF by default: the public pages show a branded "Coming Soon" screen while
 * the client prepares his first events. The ADMIN side (/admin/tournaments)
 * keeps working the entire time, so he can build the draw in private.
 *
 * TO GO LIVE — no code change, no rebuild:
 *   1. add   TOURNAMENTS_LIVE=true   to /var/www/courthub/.env.local
 *   2. run   pm2 restart courthub
 * (Set it back to false the same way to hide the section again.)
 */
export function tournamentsArePublic(): boolean {
  return process.env.TOURNAMENTS_LIVE === 'true';
}
