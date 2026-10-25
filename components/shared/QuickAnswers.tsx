import Link from 'next/link';
import { QUICK_ANSWERS } from '@/lib/seo';
import { localePath, type Locale } from '@/lib/i18n/locale';

export default function QuickAnswers({ locale }: { locale: Locale }) {
  return (
    <section id="quick-answers" aria-labelledby="quick-answers-heading" className="border-t border-ink/10 bg-sand px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1152px]">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-court-blue">COURT HUB / {locale === 'ar' ? 'إجابات سريعة' : 'QUICK ANSWERS'}</p>
        <h2 id="quick-answers-heading" className="mb-8 font-display text-3xl font-bold text-ink md:text-4xl">{locale === 'ar' ? 'المتجر، الملاعب والتواصل' : 'Rackets, courts and getting in touch'}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {QUICK_ANSWERS[locale].map(({ question, answer }) => (
            <div key={question} className="rounded-2xl border border-ink/10 bg-white p-6">
              <h3 className="mb-3 font-display text-lg font-bold text-ink">{question}</h3>
              <p className="text-sm leading-7 text-ink/75">{answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-court-blue">
          <Link href={localePath(locale, '/shop')}>{locale === 'ar' ? 'تسوق المضارب' : 'Shop rackets'} →</Link>
          <Link href={localePath(locale, '/construct-your-court')}>{locale === 'ar' ? 'أنشئ ملعبك' : 'Plan your court'} →</Link>
          <Link href={localePath(locale, '/contact')}>{locale === 'ar' ? 'تواصل معنا' : 'Contact us'} →</Link>
        </div>
      </div>
    </section>
  );
}
