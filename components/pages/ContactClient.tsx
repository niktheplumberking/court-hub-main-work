'use client';

import { useState, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import Footer from '@/components/home/Footer';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { useHeroCovered } from '@/components/swipe/useHeroCovered';
import { useMouseParallax } from '@/components/shared/useMouseParallax';
import { useT, useDirSign } from '@/lib/i18n/LocaleProvider';
import type { ContentMap } from '@/lib/content/get';

const MotionLink = motion.create(Link);

interface ContactRoute {
  id: string;
  title: string;
  description: string;
  recipientDesk: string;
  prefilledText: string;
}

export default function ContactClient({ content }: { content: ContentMap }) {
  const heroCovered = useHeroCovered();
  const t = useT();
  const dirSign = useDirSign();
  const { x: parallaxX, y: parallaxY } = useMouseParallax(26);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('construction');
  const [inquirerName, setInquirerName] = useState<string>('');
  const [customSnippet, setCustomSnippet] = useState<string>('');

  const INQUIRY_ROUTES: ContactRoute[] = useMemo(() => [
    {
      id: 'construction',
      title: content['contact.route1.title'],
      recipientDesk: content['contact.route1.recipient_desk'],
      description: content['contact.route1.description'],
      prefilledText: content['contact.route1.prefilled_text']
    },
    {
      id: 'wholesale',
      title: content['contact.route2.title'],
      recipientDesk: content['contact.route2.recipient_desk'],
      description: content['contact.route2.description'],
      prefilledText: content['contact.route2.prefilled_text']
    },
    {
      id: 'tournaments',
      title: content['contact.route3.title'],
      recipientDesk: content['contact.route3.recipient_desk'],
      description: content['contact.route3.description'],
      prefilledText: content['contact.route3.prefilled_text']
    }
  ], [content]);

  // States for the new Personal Information Form (Reference style)
  const [personalName, setPersonalName] = useState<string>('');
  const [personalEmail, setPersonalEmail] = useState<string>('');
  const [personalPhone, setPersonalPhone] = useState<string>('');
  const [personalCompany, setPersonalCompany] = useState<string>('');
  const [personalMessage, setPersonalMessage] = useState<string>('');
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);


  const activeRoute = useMemo(() => {
    return INQUIRY_ROUTES.find(r => r.id === selectedRouteId) || INQUIRY_ROUTES[0];
  }, [selectedRouteId, INQUIRY_ROUTES]);

  // Construct direct WhatsApp deep link with custom encoded pre-filled text
  const whatsappUrl = useMemo(() => {
    // Official GCC service line. Normalized to bare digits: the WhatsApp API
    // rejects '+'/spaces, and the client will plausibly type "+971 50 123 4567".
    const phoneNo = (content['contact.dispatch.whatsapp_phone'] || '').replace(/\D/g, '');
    const nameSection = inquirerName ? `• Inquirer Name: ${inquirerName}\n` : '';
    const remarkSection = customSnippet ? `• Client Remarks: ${customSnippet}\n` : '';
    const divisionSection = `• Routed Division: ${activeRoute.title}\n• Handled By: ${activeRoute.recipientDesk}\n`;
    const messageSection = `• Request Message: ${activeRoute.prefilledText}`;

    const finalMessage = `Hello Court Hub team!\n\n*NEW DYNAMIC PORTAL INQUIRY*\n\n${divisionSection}${nameSection}${remarkSection}${messageSection}`;
    return `https://api.whatsapp.com/send?phone=${phoneNo}&text=${encodeURIComponent(finalMessage)}`;
  }, [activeRoute, inquirerName, customSnippet, content]);

  // Form submission handler for Personal Information
  const handleSubmitPersonalForm = (e: FormEvent) => {
    e.preventDefault();
    if (!personalName || !personalEmail) {
      alert(t.pages.formValidation);
      return;
    }
    setFormSubmitted(true);
  };

  return (
    <div className="ch-has-rail bg-ink min-h-screen text-white selection:bg-lime/30 font-sans">

      <main className="">

        {/* ================= SECTION 1: RECREATED "COURT HUB" MOCK-UP HERO ================= */}
        {/* Exactly viewport-height (no min-h) so the frame bottom is never cut
            off; `invisible` once covered stops paint/composite cost. */}
        <div className={`fixed top-0 start-0 w-full h-[100dvh] md:h-screen z-0 pointer-events-auto${heroCovered ? ' invisible' : ''}`}>
          <section data-cms="contact:hero" className="ch-rail-exempt relative h-full w-full p-3 sm:p-5 md:p-6 lg:p-8 bg-ink overflow-hidden text-center flex items-center justify-center">

          {/* Edge-to-Edge full screen background cinematic video / image fallback */}
          <motion.div
            style={{ x: parallaxX, y: parallaxY }}
            className="absolute inset-[-4%] z-0 select-none pointer-events-none overflow-hidden scale-105 origin-center"
          >
            <img
              src={content['contact.hero.bg_image']}
              alt=""
              aria-hidden
              className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.15] saturate-[1.15]"
              referrerPolicy="no-referrer" fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-transparent to-ink/90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,90,232,0.2)_0%,transparent_80%)]" />
          </motion.div>

          <div className="w-full h-full max-w-[1720px] mx-auto relative z-10 flex flex-col">
            {/* The Outer Frame simulating the premium mockup panel - thin polished rounded border exactly like reference */}
            <div
              className="w-full h-full border-2 md:border-[3px] border-white/60 rounded-[28px] sm:rounded-[36px] md:rounded-[44px] overflow-hidden relative shadow-[0_32px_120px_rgba(0,0,0,0.7)] bg-black/15 flex flex-col justify-between p-4 pb-10 sm:p-8 md:p-10 lg:p-12"
            >

              {/* In-frame hero navbar (the design's integrated sub-header row) */}
              <HeroFrameNav active="contact" />

              {/* 3. Centered Title Blocks: "LET'S CO-DESIGN", "GAME CHANNELS" with organic, breath-like floating motions */}
              <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8 z-10 select-none pointer-events-none">
                {/* Mobile-only levitation wrapper (CSS .ch-levitate floats the whole title
                    on <768px, static on desktop). Kept separate from the inner Framer
                    transforms so the CSS float and Framer animations never conflict. */}
                <div className="w-full flex flex-col items-center justify-center">
                  {/* Text Row 1 */}
                  <motion.div className="w-full flex justify-center">
                    <motion.h1
                      initial={{ y: -35, opacity: 0, scale: 0.98 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      className="font-display font-black text-white text-center text-[42px] sm:text-[68px] md:text-[88px] lg:text-[108px] xl:text-[124px] leading-[0.85] tracking-tighter uppercase select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                    >
                      {content['contact.hero.title_line1']}
                    </motion.h1>
                  </motion.div>

                  {/* Text Row 2 */}
                  <motion.div className="w-full flex justify-center mt-1 sm:mt-2">
                    <motion.h1
                      initial={{ y: 35, opacity: 0, scale: 0.98 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                      className="font-display font-black text-white text-center text-[42px] sm:text-[68px] md:text-[88px] lg:text-[108px] xl:text-[124px] leading-[0.85] tracking-tighter uppercase select-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
                    >
                      {content['contact.hero.title_line2']}
                    </motion.h1>
                  </motion.div>
                </div>
              </div>

              {/* 4. Glass Framed Bottom Row: Actions + Communities rating badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="relative z-30 w-full flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-t border-white/10 pt-4 mt-auto"
              >

                {/* Left Bottom Block - Piles */}
                <div className="space-y-4 max-w-md text-start w-full lg:w-auto">
                  <p className="text-white/80 text-xs sm:text-sm font-medium leading-relaxed drop-shadow-md">
                    {content['contact.hero.copy']}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Primary CTA (static) */}
                    <a
                      href="#selection"
                      className="px-6 py-3 bg-[#C8FF3D] hover:bg-white text-ink font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-colors shadow-md cursor-pointer"
                    >
                      {content['contact.hero.cta_label']}
                    </a>
                  </div>
                </div>

                {/* Right Bottom Block - Spec details mimicking about stats */}
                <div className="max-w-xs space-y-2 text-start flex flex-col items-start lg:items-end w-full lg:w-auto">
                  <span className="font-sans text-[10px] text-lime uppercase tracking-widest font-black py-1 px-2.5 bg-lime/10 border border-lime/20 rounded">
                    {content['contact.hero.response_badge']}
                  </span>
                  <p className="font-display text-lg font-bold italic uppercase tracking-tight text-white leading-none mt-1 lg:text-end">
                    {content['contact.hero.stat_title']}
                  </p>
                  <p className="text-white/60 text-[11px] font-sans lg:text-end">{content['contact.hero.stat_caption']}</p>
                </div>

              </motion.div>

            </div>
          </div>
        </section>
        </div>

        {/* Spacer to allow scrolling past the fixed background hero */}
        <div className="relative w-full h-screen pointer-events-none z-0" />

        {/* ================= BLANKET OVERLAY CONTENT ================= */}
        <div className="relative z-10 bg-ink shadow-[0_-24px_50px_rgba(0,0,0,0.6)]">

        {/* ================= SECTION 2: DYNAMIC ROUTING & WHATSAPP INTEGRATION (Court Blue Backdrop) ================= */}
        <section id="selection" className="py-20 bg-court-blue text-white px-6 md:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,255,61,0.08)_0%,transparent_50%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-stretch relative z-10">

            {/* Left Box: Route Selector Options */}
            <div className="lg:col-span-6 space-y-8 flex flex-col justify-between">
              <div className="space-y-3 text-start">
                <span className="font-sans text-xs uppercase bg-white/10 px-3 py-1 border border-white/10 rounded-full inline-block">
                  {content['contact.routing.eyebrow']}
                </span>
                <h2 className="text-3xl md:text-5xl font-display font-extrabold uppercase italic tracking-tight">
                  {content['contact.routing.title']}
                </h2>
                <p className="text-white/70 text-xs md:text-sm max-w-md">
                  {content['contact.routing.description']}
                </p>
              </div>

              {/* Selector Option Cards */}
              <div className="space-y-4 flex-1 flex flex-col justify-between mt-6">
                {INQUIRY_ROUTES.map((route) => {
                  const isSelected = selectedRouteId === route.id;
                  return (
                    <motion.div
                      key={route.id}
                      onClick={() => setSelectedRouteId(route.id)}
                      whileHover={{ scale: 1.02, x: 6 * dirSign }}
                      whileTap={{ scale: 0.995 }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      className={`p-6 rounded-2xl border text-start cursor-pointer transition-colors select-none flex-1 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white text-ink border-white shadow-2xl shadow-white/5'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <h4 className="font-display font-black text-lg uppercase italic tracking-tight">
                            {route.title}
                          </h4>
                          <span className={`font-sans font-bold text-[9px] uppercase px-2 py-0.5 rounded ${
                            isSelected ? 'bg-court-blue text-white' : 'bg-white/10 text-white/50'
                          }`}>
                            {route.id}
                          </span>
                        </div>

                        <p className={`text-xs mt-2 leading-relaxed ${
                          isSelected ? 'text-ink/80' : 'text-white/60'
                        }`}>
                          {route.description}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center text-[10px] font-sans uppercase tracking-wider">
                        <span className={isSelected ? 'text-court-blue font-bold animate-pulse' : 'text-white/40'}>
                          {t.pages.recipient}: {route.recipientDesk}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right Box: Custom Metadata Input & Instant Dispatch Card */}
            <div className="lg:col-span-6 bg-ink p-8 md:p-10 rounded-[32px] border border-white/10 shadow-2xl text-start flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 font-sans text-lime text-[11px] uppercase tracking-wider font-bold">
                    <span className="w-2 h-2 rounded-full bg-lime animate-ping" />
                    {content['contact.dispatch.eyebrow']}
                  </div>
                  <h3 className="font-display font-black text-2xl uppercase italic text-white leading-tight">
                    {content['contact.dispatch.title']}
                  </h3>
                  <p className="text-white/40 text-[11px] leading-relaxed">
                    {content['contact.dispatch.description']}
                  </p>
                </div>

                {/* Informative form fields */}
                <div className="space-y-4 pt-4 border-t border-white/5 font-sans">
                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] text-white/40 uppercase tracking-widest block">{t.pages.yourFullName}</label>
                    <div className="relative">
                      <User className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="text"
                        dir="auto"
                        value={inquirerName}
                        onChange={(e) => setInquirerName(e.target.value)}
                        placeholder={t.pages.namePlaceholder}
                        className="w-full bg-ink-2 border border-white/15 rounded-xl ps-11 pe-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:border-lime/40 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] text-white/40 uppercase tracking-widest block">{t.pages.remarksLabel}</label>
                    <textarea
                      dir="auto"
                      value={customSnippet}
                      onChange={(e) => setCustomSnippet(e.target.value)}
                      placeholder={t.pages.remarksPlaceholder}
                      rows={2}
                      className="w-full bg-ink-2 border border-white/15 rounded-xl p-4 text-sm text-white placeholder:text-white/20 focus:border-lime/40 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Dynamic Live Text Preview */}
                <div className="p-6 bg-ink-2 rounded-[20px] border border-white/10 space-y-3 font-sans shadow-inner">
                  <span className="text-[11px] uppercase tracking-widest text-[#C8FF3D] font-extrabold block">
                    {content['contact.dispatch.preview_label']}
                  </span>
                  <p className="italic text-white/90 text-sm md:text-[15px] leading-relaxed">
                    "Hello Court Hub team! [Inquiry: {activeRoute.title}], My Name: {inquirerName || 'Inquirer'}. Message: {activeRoute.prefilledText} {customSnippet}"
                  </p>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                {/* Instant Launch Action Button */}
                <motion.a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4.5 bg-[#C8FF3D] hover:bg-white text-ink transition-all font-sans font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2.5 shadow-xl shadow-[#C8FF3D]/10 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-ink" />
                  <span>{content['contact.dispatch.cta_label']}</span>
                  <ArrowUpRight className="w-4 h-4 rtl:-scale-x-100" />
                </motion.a>

                <div className="flex justify-center items-center gap-2 font-sans text-[9px] text-white/30 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5 text-lime" />
                  <span>{content['contact.dispatch.footnote']}</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ================= SECTION 3: PHYSICAL CONTACT DETAILS, LOCATION, & DUBAI MAP (Reference Style) ================= */}
        <section className="py-24 bg-sand text-ink px-6 md:px-8 relative overflow-hidden border-t border-ink/10">
          {/* Fine grid design back-grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,13,24,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(10,13,24,0.035)_1px,transparent_1px)] bg-[size:5.0rem_5.0rem] pointer-events-none" />

          {/* Accent lighting dots */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-white/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto space-y-12 relative z-10">

            {/* Header: side-by-side on desktop */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-10 border-b border-ink/10">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tight text-ink uppercase leading-none">
                {content['contact.details.title']}
              </h2>
              <p className="text-ink/60 font-sans text-sm sm:text-base max-w-lg leading-relaxed md:text-end">
                {content['contact.details.intro']}
              </p>
            </div>

            {/* Split layout: GET IN TOUCH vs CONTACT INFORMATION & BUSINESS HOURS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:items-stretch">

              {/* Left Column (7/12 cols): GET IN TOUCH Form card */}
              <div className="lg:col-span-7 bg-[#FFFFFF] p-8 md:p-10 rounded-[28px] border border-slate-200/60 shadow-sm text-start">
                <div className="pb-4 mb-8 border-b border-slate-200">
                  <h3 className="font-display font-bold text-lg text-ink uppercase tracking-wider">
                    {content['contact.form.title']}
                  </h3>
                </div>

                <AnimatePresence mode="wait">
                  {!formSubmitted ? (
                    <motion.form
                      key="contact-form"
                      onSubmit={handleSubmitPersonalForm}
                      className="space-y-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {/* Name & Phone Number Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                          <label className="font-sans text-xs font-bold text-ink uppercase tracking-wider block">
                            {t.pages.formName}
                          </label>
                          <input
                            type="text"
                            dir="auto"
                            required
                            value={personalName}
                            onChange={(e) => setPersonalName(e.target.value)}
                            placeholder={t.pages.formNamePlaceholder}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-court-blue transition-all font-sans font-medium"
                          />
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-2">
                          <label className="font-sans text-xs font-bold text-ink uppercase tracking-wider block">
                            {t.pages.formPhone}
                          </label>
                          <input
                            type="tel"
                            required
                            value={personalPhone}
                            onChange={(e) => setPersonalPhone(e.target.value)}
                            placeholder={t.pages.formPhonePlaceholder}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-court-blue transition-all font-sans font-medium"
                          />
                        </div>
                      </div>

                      {/* Email Input */}
                      <div className="space-y-2">
                        <label className="font-sans text-xs font-bold text-ink uppercase tracking-wider block">
                          {t.pages.formEmail}
                        </label>
                        <input
                          type="email"
                          required
                          value={personalEmail}
                          onChange={(e) => setPersonalEmail(e.target.value)}
                          placeholder={t.pages.formEmailPlaceholder}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-court-blue transition-all font-sans font-medium"
                        />
                      </div>

                      {/* Message Input */}
                      <div className="space-y-2">
                        <label className="font-sans text-xs font-bold text-ink uppercase tracking-wider block">
                          {t.pages.formMessage}
                        </label>
                        <textarea
                          rows={4}
                          dir="auto"
                          required
                          value={personalMessage}
                          onChange={(e) => setPersonalMessage(e.target.value)}
                          placeholder={t.pages.formMessagePlaceholder}
                          className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-court-blue transition-all font-sans font-medium resize-none min-h-[120px]"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          className="px-8 py-4 bg-court-blue hover:bg-[#1546bd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-350 cursor-pointer shadow-md shadow-court-blue/20"
                        >
                          {content['contact.form.submit_label']}
                        </button>
                      </div>

                    </motion.form>
                  ) : (
                    <motion.div
                      key="success-card"
                      className="py-12 px-4 text-center space-y-6"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    >
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green/10 text-green border-2 border-green/20">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-2xl font-display font-black text-ink uppercase tracking-tight">
                          {content['contact.form.success_title']}
                        </h4>
                        <p className="text-green text-sm font-semibold">
                          {t.pages.formThanks(personalName)}
                        </p>
                        <p className="text-ink/65 text-xs max-w-sm mx-auto leading-relaxed">
                          {t.pages.formReceivedBefore} <strong className="text-ink ltr-island">{personalEmail}</strong> {t.pages.formReceivedAfter}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setFormSubmitted(false);
                          setPersonalName('');
                          setPersonalEmail('');
                          setPersonalPhone('');
                          setPersonalCompany('');
                          setPersonalMessage('');
                        }}
                        className="px-6 py-2.5 bg-ink text-white hover:bg-court-blue font-sans text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors duration-200 cursor-pointer"
                      >
                        {content['contact.form.success_cta']}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column (5/12 cols): CONTACT INFORMATION & BUSINESS HOURS */}
              <div className="lg:col-span-5 flex flex-col gap-8 lg:h-full justify-between text-start">

                {/* Card 1: CONTACT INFORMATION */}
                <div className="bg-[#FFFFFF] p-8 md:p-10 rounded-[28px] border border-slate-200/60 shadow-sm flex-1 flex flex-col justify-between">
                  <div>
                    <div className="pb-4 mb-6 border-b border-slate-200">
                      <h3 className="font-display font-bold text-lg text-ink uppercase tracking-wider">
                        {content['contact.info.title']}
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {/* Phone */}
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-court-blue/10 rounded-lg flex items-center justify-center text-court-blue border border-court-blue/10 shrink-0 mt-1">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest font-sans">{content['contact.info.phone_label']}</p>
                          <a href={`tel:${content['contact.info.phone'].replace(/\s+/g, '')}`} className="text-[12px] sm:text-xs md:text-sm lg:text-base font-bold text-ink hover:text-court-blue transition-colors block leading-tight">
                            <span className="ltr-island">{content['contact.info.phone']}</span>
                          </a>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-court-blue/10 rounded-lg flex items-center justify-center text-court-blue border border-court-blue/10 shrink-0 mt-1">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest font-sans">{content['contact.info.address_label']}</p>
                          <p className="text-[12px] sm:text-xs md:text-sm lg:text-base font-bold text-ink leading-tight">
                            {content['contact.info.address']}
                          </p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-court-blue/10 rounded-lg flex items-center justify-center text-court-blue border border-court-blue/10 shrink-0 mt-1">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest font-sans">{content['contact.info.email_label']}</p>
                          <a href={`mailto:${content['contact.info.email']}`} className="text-[12px] sm:text-xs md:text-sm lg:text-base font-bold text-ink hover:text-court-blue transition-colors block leading-tight">
                            <span className="ltr-island">{content['contact.info.email']}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: BUSINESS HOURS */}
                <div className="bg-[#FFFFFF] p-8 md:p-10 lg:p-12 rounded-[28px] border border-slate-200/60 shadow-sm flex-1 flex flex-col justify-between">
                  <div>
                    <div className="pb-4 mb-6 border-b border-slate-200">
                      <h3 className="font-display font-bold text-lg text-ink uppercase tracking-wider">
                        {content['contact.hours.title']}
                      </h3>
                    </div>

                    {/* Horizontal Columns layout with larger text size */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4 lg:py-2">
                      {/* Weekday */}
                      <div className="space-y-1.5">
                        <p className="text-slate-400 text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider font-sans leading-tight">
                          {content['contact.hours.weekday_label']}
                        </p>
                        <p className="text-[12px] sm:text-xs md:text-sm lg:text-base font-bold text-ink leading-snug">
                          {content['contact.hours.weekday_value']}
                        </p>
                      </div>

                      {/* Saturday */}
                      <div className="space-y-1.5">
                        <p className="text-slate-400 text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider font-sans leading-tight">
                          {content['contact.hours.saturday_label']}
                        </p>
                        <p className="text-[12px] sm:text-xs md:text-sm lg:text-base font-bold text-ink leading-snug">
                          {content['contact.hours.saturday_value']}
                        </p>
                      </div>

                      {/* Sunday */}
                      <div className="space-y-1.5">
                        <p className="text-slate-400 text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider font-sans leading-tight">
                          {content['contact.hours.sunday_label']}
                        </p>
                        <p className="text-[12px] sm:text-xs md:text-sm lg:text-base font-bold text-ink leading-snug">
                          {content['contact.hours.sunday_value']}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Dubai street map — mouse-parallax background only (owner request: no pins,
                no filters, no overlays — just the map drifting with the cursor like the heroes). */}
            <div className="relative w-full aspect-[21/10] min-h-[380px] max-h-[580px] rounded-[32px] border border-slate-200/60 overflow-hidden shadow-sm bg-[#FFFFFF] select-none">

              {/* Oversized + offset so it can drift with the cursor without exposing the edges. */}
              <motion.div
                style={{ x: parallaxX, y: parallaxY }}
                className="absolute inset-[-5%] z-0 select-none pointer-events-none overflow-hidden scale-105 origin-center"
              >
                <img
                  src={content['contact.map.image']}
                  alt="Map of Dubai"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer" loading="lazy" decoding="async"
                />
              </motion.div>

            </div>

          </div>
        </section>

        <Footer hideTopBorder />


        </div>
      </main>
    </div>
  );
}
