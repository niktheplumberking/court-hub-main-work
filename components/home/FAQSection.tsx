'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ContentMap } from '@/lib/content/get';

const MotionLink = motion.create(Link);

// ─── PLACEHOLDER COPY — replace with client-provided copy (contract §8) ───
const SUBHEADER =
  'Everything you need to know about gear, academy coaching, and court construction.';

const FAQS = [
  {
    question: "What makes padel different from tennis?",
    answer: "Padel is played on a smaller, enclosed court with glass walls, using solid stringless rackets. It's more focused on strategy, reflexes, and positioning than raw power, making it incredibly social and faster to learn."
  },
  {
    question: "I'm a complete beginner – can I join?",
    answer: "Absolutely. Our Court Hub Academy has dedicated 'First Serve' programs for total beginners. We provide the equipment, the coach, and a friendly environment to learn the basics in your first session."
  },
  {
    question: "What do I need to get started?",
    answer: "Just athletic wear and non-marking court shoes. We provide professional-grade Bullpadel rackets and balls if you don't have your own. As you progress, we can help you choose the right gear from our Pro Shop."
  },
  {
    question: "Can I try a racket before I buy?",
    answer: "Yes — message us on WhatsApp to arrange a showroom visit at our Al Quoz space in Dubai. Visits are by appointment, so you get one-on-one time to handle the rackets, compare shapes and weights, and get honest advice before you commit." // placeholder claim (showroom location & appointment model) — confirm with client
  },
  {
    question: "How do I order gear or request a court build?",
    answer: "Gear is simple — browse the Pro Shop online, add to cart, and check out; we deliver across the UAE. For court construction, share your site details through the Construct Your Court page or message us on WhatsApp, and our team will scope, quote, and schedule your build."
  },
  {
    question: "What happens after I send a court build inquiry?",
    answer: "A build consultant reviews your site details and replies on WhatsApp within one working day. From there we arrange a site survey, lock in a fixed line-item quote, and schedule your build — you'll know exactly what's happening at every stage." // placeholder claim (response time & process) — confirm with client
  },
  {
    question: "Do you deliver outside Dubai — or internationally?",
    answer: "We deliver gear to all seven emirates via tracked courier, and court construction projects run UAE-wide. International shipping isn't part of standard checkout yet — if you're ordering from abroad, message us on WhatsApp and we'll quote it case by case." // placeholder claim (delivery scope & international policy) — confirm with client
  }
];

interface FAQ {
  question: string;
  answer: string;
}

interface FAQItemProps {
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

function FAQItem({ faq, isOpen, onToggle, index }: FAQItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position of individual FAQ item
  const { scrollYProgress } = useScroll({
    target: itemRef,
    offset: ["start 90%", "end 10%"]
  });

  // Scale: slightly smaller at edges, peaks at 1.05 in center
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.95, 1, 1.05, 1, 0.95]);

  // Opacity: fades out to 0 at top/bottom thresholds (below 20% or above 80% scroll progress)
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Blur: blurs out to 10px at top/bottom thresholds
  const blur = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    ["blur(10px)", "blur(0px)", "blur(0px)", "blur(10px)"]
  );

  // Dynamic shadow that peaks when item is in the center
  const shadow = useTransform(
    scrollYProgress,
    [0, 0.2, 0.5, 0.8, 1],
    [
      "0px 0px 0px rgba(0,0,0,0)",
      "0px 0px 0px rgba(0,0,0,0)",
      "0px 20px 40px rgba(0,0,0,0.06)",
      "0px 0px 0px rgba(0,0,0,0)",
      "0px 0px 0px rgba(0,0,0,0)"
    ]
  );

  return (
    <motion.div
      ref={itemRef}
      style={{ scale, opacity, filter: blur, boxShadow: shadow }}
      className={`rounded-[24px] md:rounded-[32px] transition-colors duration-500 overflow-hidden border ${
        isOpen 
          ? 'bg-court-blue text-white border-court-blue md:translate-x-4 shadow-xl' 
          : 'bg-white hover:bg-white/90 text-ink border-black/5'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-6 md:p-10 flex items-center justify-between text-left group"
      >
        <span className={`text-lg md:text-2xl font-display font-bold tracking-tight ${
          isOpen ? 'text-white' : 'text-ink'
        }`}>
          {faq.question}
        </span>
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
          isOpen ? 'bg-white text-court-blue' : 'bg-court-blue text-white group-hover:scale-110'
        }`}>
          {isOpen ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-6 pb-8 md:px-10 md:pb-12 border-t border-white/10 pt-4 md:pt-6">
              <p className="text-base md:text-xl font-medium leading-relaxed opacity-80 max-w-2xl">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FAQSupportBox({ content }: { content?: ContentMap }) {
  const boxRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position of support box
  const { scrollYProgress } = useScroll({
    target: boxRef,
    offset: ["start 90%", "end 10%"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.95, 1, 1.02, 1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const blur = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    ["blur(10px)", "blur(0px)", "blur(0px)", "blur(10px)"]
  );

  return (
    <motion.div
      ref={boxRef}
      style={{ scale, opacity, filter: blur }}
      className="mt-6 p-8 bg-court-blue/10 border border-court-blue/20 rounded-[32px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
    >
      <div>
        <h4 className="text-ink font-display font-bold text-lg md:text-xl uppercase italic">{content?.['faq.support.title'] ?? 'Still have questions?'}</h4>
        <p className="text-ink/60 text-xs md:text-sm mt-1">{content?.['faq.support.description'] ?? 'Our support team is ready to assist you anytime.'}</p>
      </div>
      <MotionLink
        href="/contact"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-3 bg-court-blue text-white rounded-full font-bold uppercase tracking-wider text-[11px] hover:bg-lime hover:text-ink transition-all shadow-md cursor-pointer"
      >
        {content?.['faq.support.cta'] ?? 'Contact Support'}
      </MotionLink>
    </motion.div>
  );
}

export default function FAQSection({ content }: { content?: ContentMap }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const faqs = FAQS.map((faq, i) => ({
    question: content?.[`faq.q${i + 1}.question`] ?? faq.question,
    answer: content?.[`faq.q${i + 1}.answer`] ?? faq.answer,
  }));
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.05, 1]);

  return (
    <section id="faq" ref={containerRef} className="bg-sand py-20 md:py-32 px-6 md:px-8 overflow-x-hidden lg:overflow-x-visible">
      <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
        
        {/* Header Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start md:items-end">
          <div className="md:col-span-8">
            <h2 className="text-4xl md:text-8xl font-display font-black leading-[1] md:leading-[0.9] tracking-tighter uppercase text-ink">
              {content?.['faq.header.title_line1'] ?? 'Common Questions,'} <br />
              {content?.['faq.header.title_line2'] ?? 'Clear Answers'}
            </h2>
          </div>
          <div className="md:col-span-4">
            <p className="text-ink/60 text-base md:text-lg font-medium leading-snug md:text-right max-w-xs md:ml-auto">
              {content?.['faq.header.subheader'] ?? SUBHEADER}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-start">
          
          {/* Visual Side - Sticky Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit hidden lg:block">
            <motion.div 
              style={{ scale }}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="relative aspect-[4/5] max-h-[440px] rounded-[48px] overflow-hidden shadow-2xl group"
            >
              <motion.img 
                style={{ y: useTransform(scrollYProgress, [0, 1], ["-20%", "0%"]) }}
                src={content?.['faq.visual.image'] ?? '/images/faq_padel_detail_1779708774500.webp'}
                alt="Padel Player" 
                className="absolute top-0 left-0 w-full h-[120%] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-8 left-8 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-white italic">{content?.['faq.visual.badge'] ?? 'Academy Hub · Live'}</span>
              </div>
            </motion.div>
          </div>

          {/* Accordion Side */}
          <div className="lg:col-span-8 flex flex-col gap-3 md:gap-4">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                index={i}
              />
            ))}

            {/* Support Callout Box to increase scroll height and add CTA */}
            <FAQSupportBox content={content} />
          </div>

        </div>

      </div>
    </section>
  );
}
