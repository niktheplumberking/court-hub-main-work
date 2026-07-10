'use client';
import { useEffect, useState } from 'react';
import { ADMIN_COVER_POOL, type Division, type PointsTable, type Tier, type Tournament } from '@/lib/tournaments/data';
import { POINTS_ROWS, TIER_ORDER } from '@/lib/tournaments/points';
import { useTournamentStore } from '@/lib/tournaments/store';
import { StatusPill, TierBadge, btn } from './ui';

interface FormState {
  name: string;
  tier: Tier;
  division: Division;
  dates: string;
  venue: string;
  cap: string;
  fee: string;
  prize: string;
}
const INITIAL: FormState = { name: '', tier: 'P100', division: 'Men', dates: '', venue: '', cap: '16', fee: '350', prize: '15000' };

const fieldInput = 'w-full rounded-xl border border-ink/10 bg-white px-3.5 py-[13px] text-[14.5px] text-ink placeholder:text-ink/30 focus:border-court-blue focus:outline-none';
const fieldLabel = 'mb-[7px] block font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink/50';

export default function TournamentAdmin() {
  const { allTournaments, addTournament, setPoints, pointsForTier, toast } = useTournamentStore();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [pts, setPts] = useState<PointsTable>(() => pointsForTier('P100'));

  // Points editor follows the Category select (matches the demo).
  useEffect(() => {
    setPts(pointsForTier(form.tier));
  }, [form.tier, pointsForTier]);

  const list = allTournaments();
  const setF = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function create() {
    const name = form.name.trim();
    if (!name) {
      toast('Enter a tournament name');
      return;
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const cover = ADMIN_COVER_POOL[Math.floor(Math.random() * ADMIN_COVER_POOL.length)];
    const t: Tournament = {
      slug,
      name,
      tier: form.tier,
      division: form.division,
      status: 'open',
      dates: form.dates.trim() || 'TBC 2026',
      venue: form.venue.trim() || 'Court Hub Arena, Al Quoz',
      format: 'Groups + Knockout',
      cap: Number(form.cap) || 16,
      reg: 0,
      fee: Number(form.fee) || 350,
      prize: Number(form.prize) || 15000,
      cover,
      blurb: `A newly published ${form.tier} ${form.division.toLowerCase()} event at ${form.venue.trim() || 'Court Hub'}. Registration is now open.`,
    };
    addTournament(t);
    toast(<>Published <b>{name}</b> · now live on Tournaments</>);
    setForm((f) => ({ ...f, name: '' }));
  }

  function savePoints() {
    setPoints(form.tier, pts);
    toast(<>Points table saved for <b>{form.tier}</b></>);
  }

  return (
    <div className="bg-sand text-ink">
      {/* Hero */}
      <section className="bg-[radial-gradient(130%_150%_at_100%_-10%,#1c1c18,#0E0E0C_55%)] px-6 pb-9 pt-28 text-white md:pt-32">
        <div className="mx-auto max-w-[1320px]">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">Backend · Demo</p>
          <h1 className="font-display text-[clamp(30px,4vw,52px)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
            Tournament <span className="text-lime">Admin</span>
          </h1>
        </div>
      </section>

      <section className="px-6 py-[52px]">
        <div className="mx-auto max-w-[1320px]">
          {/* DEMO note */}
          <div className="mb-7 flex items-center gap-3.5 rounded-[22px] bg-ink p-[18px_22px] text-white">
            <span className="flex-none rounded-md bg-lime px-[11px] py-[5px] font-display text-[11px] font-black tracking-[0.04em] text-ink">DEMO</span>
            <p className="text-[13px] leading-[1.5] text-white/75">
              This is a preview of the admin backend. It is unprotected and non-persistent. In production this is protected and writes to Supabase. Here, creating a tournament or editing points saves for this session so you can see the flow end to end.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.3fr_1fr]">
            {/* Tournaments list */}
            <div>
              <h2 className="mb-4 font-display text-[22px] font-black uppercase tracking-[-0.03em]">Tournaments</h2>
              <div className="flex flex-col gap-2.5">
                {list.map((t) => (
                  <div key={t.slug} className="flex items-center gap-3 rounded-[14px] border border-ink/10 bg-sand-card p-[14px_16px]">
                    <TierBadge tier={t.tier} />
                    <div className="min-w-0">
                      <b className="block truncate font-display text-[14px] font-bold text-ink">{t.name}</b>
                      <span className="text-[11.5px] text-ink/50">{t.division} · {t.dates} · {t.reg}/{t.cap} pairs</span>
                    </div>
                    <div className="ml-auto flex-none"><StatusPill status={t.status} /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create + points */}
            <div>
              <div className="rounded-[22px] border border-ink/10 bg-sand-card p-6">
                <h4 className="mb-4 font-display text-[14px] font-extrabold uppercase">Create Tournament</h4>
                <div className="mb-4">
                  <label className={fieldLabel}>Name</label>
                  <input className={fieldInput} placeholder="Court Hub Summer Slam" value={form.name} onChange={(e) => setF('name', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className={fieldLabel}>Category</label>
                    <select className={fieldInput} value={form.tier} onChange={(e) => setF('tier', e.target.value)}>
                      {TIER_ORDER.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className={fieldLabel}>Division</label>
                    <select className={fieldInput} value={form.division} onChange={(e) => setF('division', e.target.value)}>
                      {(['Men', 'Women', 'Mixed'] as Division[]).map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4"><label className={fieldLabel}>Dates</label><input className={fieldInput} placeholder="12–13 Sep 2026" value={form.dates} onChange={(e) => setF('dates', e.target.value)} /></div>
                  <div className="mb-4"><label className={fieldLabel}>Venue</label><input className={fieldInput} placeholder="Court Hub Arena" value={form.venue} onChange={(e) => setF('venue', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4"><label className={fieldLabel}>Capacity (pairs)</label><input type="number" className={fieldInput} value={form.cap} onChange={(e) => setF('cap', e.target.value)} /></div>
                  <div className="mb-4"><label className={fieldLabel}>Entry fee AED</label><input type="number" className={fieldInput} value={form.fee} onChange={(e) => setF('fee', e.target.value)} /></div>
                </div>
                <div className="mb-4"><label className={fieldLabel}>Prize pool AED</label><input type="number" className={fieldInput} value={form.prize} onChange={(e) => setF('prize', e.target.value)} /></div>
                <button type="button" onClick={create} className={btn('ink', 'w-full')}>Create &amp; Publish</button>
              </div>

              <div className="mt-4 rounded-[22px] border border-ink/10 bg-sand-card p-6">
                <h4 className="mb-1 font-display text-[14px] font-extrabold uppercase">Points System · {form.tier}</h4>
                <p className="mb-3.5 text-[12px] text-ink/50">Set points awarded per finishing position. Feeds the season leaderboard.</p>
                <div>
                  {POINTS_ROWS.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between gap-3 border-b border-ink/10 py-[9px] last:border-b-0">
                      <label className="text-[13px] text-ink/65">{label}</label>
                      <input
                        type="number"
                        value={pts[key]}
                        onChange={(e) => setPts((p) => ({ ...p, [key]: Number(e.target.value) || 0 }))}
                        className="w-[90px] rounded-[9px] border border-ink/10 bg-white px-2.5 py-2 text-right font-display font-bold text-court-blue focus:border-court-blue focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={savePoints} className={btn('ghost', 'mt-3.5 w-full', true)}>Save Points Table</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
