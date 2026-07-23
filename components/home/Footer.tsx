'use client';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Instagram, Mail, MapPin, Phone, MessageCircle } from 'lucide-react';
import { waHref } from '@/lib/whatsapp';

const MotionLink = motion.create(Link);

// ─── PLACEHOLDER COPY — replace with client-provided copy (contract §8) ───
const COMMUNITY = {
  label: 'Community',
  blurb: 'Join the circuit — first to hear about exclusive drops, court openings, and community sessions.',
  cta: 'Join the circuit',
  waMessage: 'Hi Court Hub — add me to the community list.',
};
// ─── END PLACEHOLDER COPY ───

export default function Footer({ hideTopBorder = false }: { hideTopBorder?: boolean }) {
  const footerClassName = `bg-ink text-white py-16 md:py-24 px-6 md:px-8 overflow-hidden${hideTopBorder ? '' : ' border-t border-white/5'}`;
  return (
    <footer id="footer" className={footerClassName}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-12 md:gap-16">
        
        {/* Brand & Mission */}
        <div className="md:col-span-3 space-y-6 md:space-y-8">
          <div className="flex items-center gap-1.5 font-sans font-bold text-2xl md:text-3xl tracking-wide">
            <span>COURT</span>
            <span className="text-lime">HUB</span>
          </div>
          <p className="text-white/40 text-base md:text-lg font-medium leading-relaxed max-w-sm">
            Powers every part of the game. Professional courts, elite equipment, and the championship spirit.
          </p>
          <div className="flex gap-3 md:gap-4">
            <motion.a
              href="https://www.instagram.com/used_rackets" // confirm handle with client
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Court Hub on Instagram"
              whileHover={{ y: -5, color: '#C8FF3D' }}
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </motion.a>
            {/* Twitter/Facebook removed — no known accounts. Re-add when the client confirms handles:
            <motion.a href="https://x.com/..." target="_blank" rel="noopener noreferrer" whileHover={{ y: -5, color: '#C8FF3D' }} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
              <Twitter className="w-5 h-5" />
            </motion.a>
            <motion.a href="https://facebook.com/..." target="_blank" rel="noopener noreferrer" whileHover={{ y: -5, color: '#C8FF3D' }} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
              <Facebook className="w-5 h-5" />
            </motion.a>
            */}
          </div>
        </div>

        {/* Links */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          <h4 className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">Menu</h4>
          <nav className="flex flex-col gap-3 md:gap-4">
            {[
              { label: 'Home', href: '/' },
              { label: 'About Us', href: '/about' },
              { label: 'Construct Your Court', href: '/construct-your-court' },
              { label: 'Shop', href: '/shop' },
              { label: 'Contact Us', href: '/contact' },
            ].map((item) => (
              <MotionLink
                key={item.label}
                href={item.href}
                whileHover={{ scale: 1.08, originX: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-white font-display font-bold md:text-lg hover:text-lime transition-colors w-fit block"
              >
                {item.label}
              </MotionLink>
            ))}
          </nav>
        </div>

        {/* Compete — Tournaments section */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          <h4 className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">Compete</h4>
          <nav className="flex flex-col gap-3 md:gap-4">
            {[
              { label: 'Tournaments', href: '/tournaments' },
              { label: 'Leaderboards', href: '/leaderboards' },
              { label: 'Admin (demo)', href: '/tournaments/admin' },
            ].map((item) => (
              <MotionLink
                key={item.label}
                href={item.href}
                whileHover={{ scale: 1.08, originX: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-white font-display font-bold md:text-lg hover:text-lime transition-colors w-fit block"
              >
                {item.label}
              </MotionLink>
            ))}
          </nav>
        </div>

        <div className="md:col-span-2 space-y-4 md:space-y-6">
          <h4 className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">Company</h4>
          <nav className="flex flex-col gap-3 md:gap-4">
            {[
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
            ].map((item) => (
              <MotionLink
                key={item.label}
                href={item.href}
                whileHover={{ scale: 1.08, originX: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-white/60 font-medium hover:text-white transition-colors w-fit block"
              >
                {item.label}
              </MotionLink>
            ))}
          </nav>
        </div>

        {/* Community / Contact — honest WhatsApp CTA (newsletter form had no backend) */}
        <div className="md:col-span-3 space-y-6 md:space-y-8">
          <h4 className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">{COMMUNITY.label}</h4>
          <div className="space-y-4">
            <p className="text-xs md:text-sm text-white/60">{COMMUNITY.blurb}</p>
            <motion.a
              href={waHref(COMMUNITY.waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 w-full bg-lime text-ink rounded-full p-4 md:p-5 font-bold text-xs md:text-sm uppercase tracking-widest hover:bg-white transition-colors duration-300"
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              {COMMUNITY.cta}
            </motion.a>
          </div>
          <div className="pt-6 md:pt-8 space-y-3 md:space-y-4 border-t border-white/5">
            <div className="flex items-center gap-3 text-white/40 text-[11px] md:text-xs">
              <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>contact@courthub.com</span>
            </div>
            <div className="flex items-center gap-3 text-white/40 text-[11px] md:text-xs">
              <Phone className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>+971 4 000 0000</span>
            </div>
            <div className="flex items-center gap-3 text-white/40 text-[11px] md:text-xs">
              <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="leading-snug">Al Quoz Industrial 3, Dubai, UAE</span>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-16 md:mt-24 pt-8 md:pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
        <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 text-center md:text-left">
          © 2026 COURT HUB GROUP. ALL RIGHTS RESERVED.
        </p>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] text-white/20">
          <span className="text-lime font-bold italic">MADE FOR LEADERS</span>
          <span className="opacity-10 text-white font-bold hidden md:inline">|</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green" />
            SYSTEM OPERATIONAL
          </span>
        </div>
      </div>
    </footer>
  );
}
