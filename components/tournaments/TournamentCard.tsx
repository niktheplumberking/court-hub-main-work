import Image from 'next/image';
import Link from 'next/link';
import type { Tournament, TournamentStatus } from '@/lib/tournaments/data';
import { StatusPill, TierBadge, DivChip, CalIcon, PinIcon, FmtIcon, money, btnBase, btnPad, btnVariant, type BtnVariant } from './ui';

const CTA: Record<TournamentStatus, { label: string; variant: BtnVariant }> = {
  live: { label: 'Watch Live', variant: 'ink' },
  open: { label: 'Book Your Spot', variant: 'lime' },
  soon: { label: 'Get Notified', variant: 'ghost' },
  done: { label: 'View Results', variant: 'ghost' },
};

export default function TournamentCard({ t }: { t: Tournament }) {
  const pct = Math.round((t.reg / t.cap) * 100);
  const cta = CTA[t.status];
  const spotsLabel = t.status === 'soon' ? 'Opens soon' : `${t.cap - t.reg} spots left`;

  return (
    <Link
      href={`/tournaments/${t.slug}`}
      className="group flex flex-col overflow-hidden rounded-[22px] border border-ink/10 bg-sand-card transition-[transform,box-shadow] duration-200 hover:-translate-y-[5px] hover:shadow-[0_22px_44px_rgba(14,14,12,0.11)]"
    >
      {/* Cover */}
      <div className="relative flex h-[150px] items-end overflow-hidden bg-[linear-gradient(135deg,#1a1a17,#2a2a24)] p-[13px]">
        <Image
          src={t.cover}
          alt={t.name}
          fill
          sizes="(max-width:640px) 100vw, (max-width:1000px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,12,0.15),rgba(14,14,12,0.55))]" />
        <div className="absolute inset-x-[13px] top-[13px] z-[2] flex items-start justify-between">
          <TierBadge tier={t.tier} />
          <StatusPill status={t.status} />
        </div>
        <div className="relative z-[2]">
          <span className="inline-block rounded-full border border-white/20 bg-white/[0.12] px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white">
            {t.division}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-[18px]">
        <h3 className="font-display text-[19px] font-extrabold uppercase leading-tight tracking-[-0.02em] text-ink">
          {t.name}
        </h3>
        <div className="flex flex-col gap-2 text-[12.5px] text-ink/60">
          <div className="flex items-center gap-2.5"><span className="text-ink/40"><CalIcon /></span>{t.dates}</div>
          <div className="flex items-center gap-2.5"><span className="text-ink/40"><PinIcon /></span>{t.venue}</div>
          <div className="flex items-center gap-2.5"><span className="text-ink/40"><FmtIcon /></span>{t.format}</div>
        </div>
        <div className="mt-0.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-sand-2">
            <span
              className={`block h-full rounded-full ${t.status === 'done' ? 'bg-[#9a948a]' : 'bg-court-blue'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[9.5px] font-bold uppercase tracking-[0.06em] text-ink/50">
            <span>{t.reg}/{t.cap} pairs</span>
            <span>{spotsLabel}</span>
          </div>
        </div>
      </div>

      {/* Footer: fee + prize */}
      <div className="mt-auto flex items-center justify-between border-t border-ink/10 px-[18px] py-3.5">
        <div>
          <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-ink/45">Entry / pair</span>
          <b className="font-display text-[16px] font-extrabold text-court-blue">AED {money(t.fee)}</b>
        </div>
        <div className="text-right">
          <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink/45">Prize pool</span>
          <span className="font-display text-[15px] font-extrabold text-ink">AED {money(t.prize)}</span>
        </div>
      </div>

      {/* CTA (whole card links to detail; this is the visual button) */}
      <div className="px-[18px] pb-[18px]">
        <span className={`${btnBase} ${btnPad} ${btnVariant[cta.variant]} w-full`}>{cta.label}</span>
      </div>
    </Link>
  );
}
