// Single source of truth for the WhatsApp conversion path (primary lead channel, all pages).
// Default = the client's real WhatsApp Business number (confirmed Jul 2026);
// NEXT_PUBLIC_WHATSAPP_NUMBER (no + or spaces) still overrides per environment.
// Never hardcode wa.me numbers elsewhere.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971558833836';

export function waHref(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
