'use client';
import { useState, useTransition } from 'react';
import Image from 'next/image';
import { saveTournament } from '@/lib/actions/tournaments';
import { COVERS, type Tournament } from '@/lib/tournaments/data';

const inputCls =
  'w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-lime outline-none text-sm';
const labelCls = 'block text-white/40 text-xs uppercase tracking-wider mb-2';

const COVER_OPTIONS = Object.values(COVERS);

/** Create + edit form for a tournament. Pass `tournament` to edit. */
export default function TournamentForm({ tournament }: { tournament?: Tournament }) {
  const [form, setForm] = useState({
    name: tournament?.name ?? '',
    slug: tournament?.slug ?? '',
    tier: tournament?.tier ?? 'P100',
    division: tournament?.division ?? 'Men',
    status: tournament?.status ?? 'open',
    dates: tournament?.dates ?? '',
    venue: tournament?.venue ?? '',
    format: tournament?.format ?? 'Groups + Knockout',
    cap: String(tournament?.cap ?? 16),
    reg: String(tournament?.reg ?? 0),
    fee: String(tournament?.fee ?? 350),
    prize: String(tournament?.prize ?? 15000),
    cover: tournament?.cover ?? COVER_OPTIONS[1],
    blurb: tournament?.blurb ?? '',
    has_bracket: tournament?.hasBracket ?? false,
    result_champion_name: tournament?.result?.champion.name ?? '',
    result_champion_nat: tournament?.result?.champion.nat ?? '',
    result_runnerup_name: tournament?.result?.runnerUp.name ?? '',
    result_runnerup_nat: tournament?.result?.runnerUp.nat ?? '',
    result_third_name: tournament?.result?.third.name ?? '',
    result_third_nat: tournament?.result?.third.nat ?? '',
    result_score: tournament?.result?.score ?? '',
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (formData: FormData) => {
    setSaveError(null);
    if (tournament) formData.set('original_slug', tournament.slug);
    startTransition(async () => {
      try {
        await saveTournament(formData);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Save failed';
        if (!msg.includes('NEXT_REDIRECT')) setSaveError(msg);
      }
    });
  };

  return (
    <form action={submit} className="grid md:grid-cols-3 gap-6">
      {/* Main column */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-ink-2 rounded-[20px] border border-white/5 p-6 space-y-5">
          <div>
            <label className={labelCls}>Name</label>
            <input name="name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Court Hub Summer Slam" className={inputCls} />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Slug (URL)</label>
              <input name="slug" value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto from name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Dates</label>
              <input name="dates" value={form.dates} onChange={(e) => set('dates', e.target.value)} placeholder="12–13 Sep 2026" className={inputCls} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Venue</label>
              <input name="venue" value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Court Hub Arena, Al Quoz" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Format</label>
              <select name="format" value={form.format} onChange={(e) => set('format', e.target.value)} className={inputCls}>
                <option>Groups + Knockout</option>
                <option>Round Robin</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Blurb (shown on the card and overview)</label>
            <textarea name="blurb" rows={3} value={form.blurb} onChange={(e) => set('blurb', e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Cover */}
        <div className="bg-ink-2 rounded-[20px] border border-white/5 p-6 space-y-4">
          <label className={labelCls}>Cover image</label>
          <input name="cover" value={form.cover} onChange={(e) => set('cover', e.target.value)} placeholder="/images/..." className={inputCls} />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {COVER_OPTIONS.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => set('cover', src)}
                className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors ${form.cover === src ? 'border-lime' : 'border-transparent hover:border-white/30'}`}
                aria-label={`Use cover ${src}`}
              >
                <Image src={src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
          <p className="text-white/30 text-xs">Pick one of the site images or paste any image path/URL.</p>
        </div>

        {/* Final result: only relevant for completed events */}
        {form.status === 'done' && (
          <div className="bg-ink-2 rounded-[20px] border border-white/5 p-6 space-y-5">
            <h3 className="text-white font-display font-bold">Final Result</h3>
            <p className="text-white/40 text-xs">Fills the champions card on the Standings tab. Leave the champion empty to show no result yet.</p>
            <div className="grid sm:grid-cols-[1fr_110px] gap-4">
              <div>
                <label className={labelCls}>Champions (pair)</label>
                <input name="result_champion_name" value={form.result_champion_name} onChange={(e) => set('result_champion_name', e.target.value)} placeholder="Moreno / Ruiz" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nat</label>
                <input name="result_champion_nat" value={form.result_champion_nat} onChange={(e) => set('result_champion_nat', e.target.value)} placeholder="ESP" className={inputCls} />
              </div>
            </div>
            <div className="grid sm:grid-cols-[1fr_110px] gap-4">
              <div>
                <label className={labelCls}>Runner-up (pair)</label>
                <input name="result_runnerup_name" value={form.result_runnerup_name} onChange={(e) => set('result_runnerup_name', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nat</label>
                <input name="result_runnerup_nat" value={form.result_runnerup_nat} onChange={(e) => set('result_runnerup_nat', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid sm:grid-cols-[1fr_110px] gap-4">
              <div>
                <label className={labelCls}>Third place (pair)</label>
                <input name="result_third_name" value={form.result_third_name} onChange={(e) => set('result_third_name', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nat</label>
                <input name="result_third_nat" value={form.result_third_nat} onChange={(e) => set('result_third_nat', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Final score</label>
              <input name="result_score" value={form.result_score} onChange={(e) => set('result_score', e.target.value)} placeholder="6-4, 4-6, 6-3" className={inputCls} />
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-ink-2 rounded-[20px] border border-white/5 p-6 space-y-5">
          <div>
            <label className={labelCls}>Status</label>
            <select name="status" value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
              <option value="open">Open (registration)</option>
              <option value="live">Live</option>
              <option value="soon">Upcoming</option>
              <option value="done">Completed</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <select name="tier" value={form.tier} onChange={(e) => set('tier', e.target.value)} className={inputCls}>
                <option>P25</option>
                <option>P50</option>
                <option>P100</option>
                <option>P250</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Division</label>
              <select name="division" value={form.division} onChange={(e) => set('division', e.target.value)} className={inputCls}>
                <option>Men</option>
                <option>Women</option>
                <option>Mixed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Capacity (pairs)</label>
              <input name="cap" type="number" min="1" value={form.cap} onChange={(e) => set('cap', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Base registered</label>
              <input name="reg" type="number" min="0" value={form.reg} onChange={(e) => set('reg', e.target.value)} className={inputCls} />
            </div>
          </div>
          <p className="text-white/30 text-xs -mt-2">Base registered is added to live bookings when showing the count.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Entry fee AED</label>
              <input name="fee" type="number" min="0" value={form.fee} onChange={(e) => set('fee', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Prize pool AED</label>
              <input name="prize" type="number" min="0" value={form.prize} onChange={(e) => set('prize', e.target.value)} className={inputCls} />
            </div>
          </div>
          <label className="flex items-center gap-3 text-white/70 text-sm">
            <input type="checkbox" name="has_bracket" checked={form.has_bracket} onChange={(e) => set('has_bracket', e.target.checked)} className="w-4 h-4 accent-[#C8FF3D]" />
            Standings tab labelled &quot;Standings &amp; Bracket&quot;
          </label>
        </div>

        {saveError && <p className="text-fire text-sm">{saveError}</p>}
        <button type="submit" disabled={pending} className="w-full py-4 rounded-full bg-lime text-ink font-bold tracking-wide disabled:opacity-50">
          {pending ? 'SAVING…' : tournament ? 'SAVE CHANGES' : 'CREATE TOURNAMENT'}
        </button>
      </div>
    </form>
  );
}
