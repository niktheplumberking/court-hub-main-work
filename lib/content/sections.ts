// ============================================================================
// Site Content Studio — display registry.
//
// Turns the flat key space of lib/content/defaults.json into the structure a
// NON-TECHNICAL editor sees: pages in order, sections with plain-English
// names/hints, numbered key-groups (topic1..4, route1..3, q1..7) folded into
// one umbrella section. A field belongs to a section when the second segment
// of its key (`page.<segment>.field`) is in that section's `prefixes`.
// `anchor` is an element id on the live page the preview iframe can scroll to.
// ============================================================================
import type { ContentPage } from './get';

export interface StudioSection {
  id: string;
  title: string;
  /** One-liner telling the editor WHERE this lives on the page. */
  hint: string;
  /** Second key segments folded into this section, in display order. */
  prefixes: string[];
  /** Optional element id on the live page for preview scroll-to. */
  anchor?: string;
}

export interface StudioPage {
  page: ContentPage;
  title: string;
  /** Route the preview iframe loads; null = not currently shown on the site. */
  path: string | null;
  sections: StudioSection[];
}

export const STUDIO_PAGES: StudioPage[] = [
  {
    page: 'home',
    title: 'Home',
    path: '/',
    sections: [
      { id: 'hero', title: 'Hero — opening screen', hint: 'The big night-courts screen: titles, intro line, buttons, background photo.', prefixes: ['hero'] },
      { id: 'numbers', title: 'Numbers strip', hint: '"Court Hub in numbers" and the four animated stats.', prefixes: ['numbers'] },
      { id: 'services', title: 'Our Services cards', hint: 'The three white cards: Shop, Court Construction, Tournaments.', prefixes: ['services'], anchor: 'services' },
      { id: 'top_sellers', title: 'Shop Top Sellers', hint: 'Headings around the product rail (products themselves come from the shop).', prefixes: ['top_sellers'] },
      { id: 'construct', title: 'Construct Your Court panel', hint: 'The dark turnkey-construction panel with the three court types.', prefixes: ['construct'] },
      { id: 'about_teaser', title: 'Who We Are teaser', hint: 'The "Crafted for the Obsessed" block near the bottom.', prefixes: ['about_teaser'] },
    ],
  },
  {
    page: 'about',
    title: 'About Us',
    path: '/about',
    sections: [
      { id: 'hero', title: 'Hero — opening screen', hint: 'Framed hero: titles, bottom copy, buttons, background photo.', prefixes: ['hero'] },
      { id: 'story', title: 'Our Story', hint: '"Metallurgy meets sport science" — story text, photo, three stats.', prefixes: ['story'] },
      { id: 'blueprint', title: 'Mission & Vision intro', hint: 'The headline block that introduces the four pillars.', prefixes: ['blueprint'] },
      { id: 'topics', title: 'The four pillars', hint: 'Mission, Vision, Structural Acoustics, Climatic Shield — title, text and image for each.', prefixes: ['topic1', 'topic2', 'topic3', 'topic4'] },
      { id: 'positioning', title: 'About Court Hub block', hint: '"Engineering the future of play" — paragraphs, two photos with badges.', prefixes: ['positioning'] },
      { id: 'cta', title: 'Ready-to-build banner', hint: 'The WhatsApp call-to-action banner near the bottom.', prefixes: ['cta'] },
      { id: 'bestsellers', title: 'Best sellers strip', hint: 'Labels on the product cards at the very bottom.', prefixes: ['bestsellers'] },
    ],
  },
  {
    page: 'contact',
    title: 'Contact Us',
    path: '/contact',
    sections: [
      { id: 'hero', title: 'Hero — opening screen', hint: 'Framed hero: titles, bottom copy, background photo.', prefixes: ['hero'] },
      { id: 'routing', title: 'Transit-desk intro', hint: '"Choose your transit desk" heading and description.', prefixes: ['routing'] },
      { id: 'routes', title: 'The three inquiry desks', hint: 'Court Construction / Pro Shop / Tournaments cards, incl. the pre-written WhatsApp messages.', prefixes: ['route1', 'route2', 'route3'] },
      { id: 'dispatch', title: 'WhatsApp link generator', hint: 'The dark "Instant Link Generator" card — including the WhatsApp number it sends to.', prefixes: ['dispatch'] },
      { id: 'details', title: 'Contact info & hours', hint: 'Phone, address, email and the business-hours table.', prefixes: ['details', 'info', 'hours'] },
      { id: 'form', title: 'Get-in-touch form headings', hint: 'Titles around the classic contact form.', prefixes: ['form'] },
      { id: 'map', title: 'Map', hint: 'The Dubai map image.', prefixes: ['map'] },
    ],
  },
  {
    page: 'construct',
    title: 'Construct Your Court',
    path: '/construct-your-court',
    sections: [
      { id: 'hero', title: 'Hero — opening screen', hint: 'Framed hero: titles, subtitle, buttons, background photo.', prefixes: ['hero'] },
      { id: 'court_types_intro', title: 'Four Ways To Build intro', hint: 'The heading and intro above the court-type cards.', prefixes: ['court_types'] },
      { id: 'court_types', title: 'The four court models', hint: 'Panoramic, Classic, Super Pro, Indoor — name, tag and description for each.', prefixes: ['court_type1', 'court_type2', 'court_type3', 'court_type4'] },
      { id: 'build_form', title: 'Build animation & quote form', hint: 'Copy around the court-building animation and its WhatsApp quote form.', prefixes: ['build_form'], anchor: 'construction' },
    ],
  },
  {
    page: 'shop',
    title: 'Shop',
    path: '/shop',
    sections: [
      { id: 'header', title: 'Collection header', hint: 'The eyebrow, big heading and intro line above the products. (Products, prices and photos update automatically from your Products list — only this wording is editable.)', prefixes: ['header'] },
    ],
  },
  {
    page: 'terms',
    title: 'Terms of Service',
    path: '/terms',
    sections: [
      { id: 'header', title: 'Page header', hint: 'The badge line, page title and intro paragraph. Type a single dash (-) in the badge to hide it once real legal copy is in.', prefixes: ['header'] },
      { id: 'sections', title: 'Terms sections', hint: 'Each numbered section is one heading + one text block. Sections 5–6 are spare: fill them to add more, empty them to hide.', prefixes: ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'] },
    ],
  },
  {
    page: 'privacy',
    title: 'Privacy Policy',
    path: '/privacy',
    sections: [
      { id: 'header', title: 'Page header', hint: 'The badge line, page title and intro paragraph. Type a single dash (-) in the badge to hide it once real legal copy is in.', prefixes: ['header'] },
      { id: 'sections', title: 'Policy sections', hint: 'Each numbered section is one heading + one text block. Sections 4–6 are spare: fill them to add more, empty them to hide.', prefixes: ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'] },
    ],
  },
];

/** Section a key belongs to on its page (fallback: last section). */
export function sectionForKey(key: string): { page: StudioPage; section: StudioSection } | null {
  const [pageId, prefix] = key.split('.');
  const page = STUDIO_PAGES.find((p) => p.page === pageId);
  if (!page) return null;
  const section = page.sections.find((s) => s.prefixes.includes(prefix));
  return { page, section: section ?? page.sections[page.sections.length - 1] };
}
