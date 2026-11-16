/** Versioned, dependency-free email templates shared by previews and live sends. */
export type EmailKind = 'owner' | 'customer';
export type EmailOrder = {
  id: string; created_at: string; customer_name: string | null;
  customer_email: string | null; customer_phone: string | null;
  shipping: Record<string, unknown> | null;
  items: { id: string; title: string; qty: number; price_aed: number; image?: string | null }[];
  amount_aed: number; locale?: 'en' | 'ar'; review?: boolean; test?: boolean;
};
export const EMAIL_TEMPLATE_VERSION = '1';
export const SITE_URL = 'https://courthub.ae';
export const SUPPORT_PHONE = '+971 55 883 3836';
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const copy = (v: unknown) => esc(String(v ?? '').replace(/\u2014|&mdash;|&#8212;|&#x2014;/gi, ', '));
const money = (v: number) => `AED ${Number(v).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const orderReference = (id: string) => id.slice(0, 8).toUpperCase();
function imageUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    // Product photos only. Customer-entered URLs can never become tracking images.
    return u.protocol === 'https:' && !u.username && !u.password &&
      (u.hostname === 'courthub.ae' || u.hostname === 'rtbwvbgdbxztrdcthzrb.supabase.co') ? u.href : null;
  } catch { return null; }
}
function addressLines(shipping: EmailOrder['shipping']): string[] {
  const address = shipping?.address as Record<string, unknown> | undefined;
  if (!address || typeof address !== 'object') return [];
  return [shipping?.name, address.line1, address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '), address.country]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}
export function renderOrderEmail(order: EmailOrder, kind: EmailKind, test = false) {
  const ar = kind === 'customer' && order.locale === 'ar';
  const ref = orderReference(order.id);
  const first = order.customer_name?.trim().split(/\s+/)[0];
  const date = new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-AE', {
    timeZone: 'Asia/Dubai', dateStyle: 'long', timeStyle: 'short',
  }).format(new Date(order.created_at));
  const heading = kind === 'owner' ? 'New order received.' : ar ? 'شكراً لطلبك!' : `Thanks for your order${first ? `, ${first}` : ''}!`;
  const intro = kind === 'owner' ? 'A customer has placed an order and payment has been confirmed. Here are the details.' :
    ar ? 'تم تأكيد طلبك واستلام الدفع. يسعدنا اختيارك كورت هب لتجهيزات البادل.' : 'Your order is confirmed and payment has been received. Thank you for choosing Court Hub for your padel gear.';
  const subject = `${test ? '[TEST] ' : ''}${kind === 'owner' ? `New paid order #${ref} | Court Hub` : ar ? `تأكيد طلبك #${ref} | Court Hub` : `Your order #${ref} is confirmed | Court Hub`}`;
  const units = order.items.reduce((n, i) => n + i.qty, 0);
  const label = (en: string, arabic: string) => ar ? arabic : en;
  const rows = order.items.map((item) => {
    const img = imageUrl(item.image);
    return `<tr><td width="86" valign="top" style="padding:18px 12px 18px 0;border-bottom:1px solid #DDE8F7">${img ? `<img src="${esc(img)}" alt="${copy(item.title)}" width="74" height="74" style="display:block;width:74px;height:74px;object-fit:contain;background:#EAF3FF;border-radius:12px" />` : '<div style="width:74px;height:74px;background:#EAF3FF;border-radius:12px"></div>'}</td><td valign="middle" style="padding:18px 0;border-bottom:1px solid #DDE8F7"><p style="margin:0 0 8px;font-size:14px;line-height:21px;font-weight:700;color:#0A2A66">${copy(item.title)}</p><p style="margin:0;color:#657A9C;font-size:12px;line-height:20px">${label('Quantity', 'الكمية')}: ${item.qty} &nbsp;·&nbsp; ${copy(money(item.price_aed))} ${label('each', 'للقطعة')}</p></td><td valign="middle" align="right" style="padding:18px 0 18px 10px;border-bottom:1px solid #DDE8F7;font-size:14px;font-weight:700;white-space:nowrap;color:#0A2A66" dir="ltr">${copy(money(item.qty * item.price_aed))}</td></tr>`;
  }).join('');
  const address = addressLines(order.shipping);
  const details = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td valign="top" class="stack" style="padding:24px 16px 8px 0;width:50%"><p style="margin:0 0 10px;color:#657A9C;font-size:10px;letter-spacing:1.5px;font-weight:700">${label('CUSTOMER', 'العميل')}</p><p style="margin:0;font-size:13px;line-height:22px;color:#0A2A66">${copy(order.customer_name || label('Court Hub customer', 'عميل كورت هب'))}${order.customer_email ? `<br />${esc(order.customer_email)}` : ''}${order.customer_phone ? `<br /><span dir="ltr">${esc(order.customer_phone)}</span>` : ''}</p></td><td valign="top" class="stack" style="padding:24px 0 8px;width:50%"><p style="margin:0 0 10px;color:#657A9C;font-size:10px;letter-spacing:1.5px;font-weight:700">${label('DELIVERY ADDRESS', 'عنوان التوصيل')}</p><p style="margin:0;font-size:13px;line-height:22px;color:#0A2A66">${address.length ? address.map(copy).join('<br />') : label('Contact the customer to confirm delivery details.', 'سيتم التواصل معك لتأكيد تفاصيل التوصيل.')}</p></td></tr></table>`;
  const whatsapp = `https://wa.me/971558833836?text=${encodeURIComponent(ar ? `مرحباً كورت هب، أحتاج مساعدة بشأن الطلب #${ref}.` : `Hi Court Hub, I need help with order #${ref}.`)}`;
  const next = kind === 'owner' ? 'Review the order in your admin dashboard and contact the customer to arrange delivery.' :
    ar ? 'سيتواصل معك فريقنا عبر الهاتف أو واتساب لترتيب التوصيل. احتفظ برقم الطلب للرجوع إليه.' : 'Our team will contact you by phone or WhatsApp to arrange delivery. Keep your order number for reference.';
  const button = kind === 'owner' ? 'VIEW ORDER DASHBOARD' : label('CHAT WITH COURT HUB', 'تواصل مع كورت هب');
  const testNote = test ? `<tr><td style="padding:14px 24px;background:#CFE1FB;color:#0A2A66;text-align:center;font-size:12px;line-height:19px;font-weight:700">TEST EMAIL · SAMPLE ORDER<br /><span style="font-weight:400">No purchase has been made. No payment has been taken.</span></td></tr>` : '';
  const review = kind === 'owner' && order.review ? '<p style="padding:14px;background:#FFF2D9;color:#7B4800;font-size:13px;line-height:20px;border-radius:8px">Please review this order before dispatch. The payment arrived after its reservation expired, or the charged amount differs from the item summary.</p>' : '';
  const html = `<!doctype html><html lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light" /><title>${esc(subject)}</title><style>body{margin:0;padding:0}table{border-collapse:collapse}a{color:#1F5FD6} @media(max-width:480px){.pad{padding-left:22px!important;padding-right:22px!important}.stack{display:block!important;width:100%!important}.title{font-size:30px!important}}</style></head><body style="margin:0;padding:0;background:#EAF3FF;font-family:Arial,Helvetica,sans-serif;color:#0A2A66"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${copy(`${test ? 'Sample order. ' : ''}${intro} #${ref}`)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#EAF3FF"><tr><td align="center" style="padding:30px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:22px;overflow:hidden">${testNote}<tr><td class="pad" style="background:#0A2A66;padding:30px 38px;border-bottom:5px solid #8EC5FF" dir="ltr"><a href="${SITE_URL}" style="text-decoration:none;color:#FFFFFF;font-size:30px;font-weight:900;letter-spacing:-1px">COURT <span style="color:#8EC5FF">HUB</span></a><p style="margin:10px 0 0;color:#B9D7FF;letter-spacing:1.4px;font-size:9px;line-height:16px">PADEL EQUIPMENT &amp; COURT CONSTRUCTION</p></td></tr><tr><td class="pad" style="padding:34px 38px 0"><p style="margin:0 0 14px;color:#1F5FD6;font-size:10px;font-weight:700;letter-spacing:1.8px">${kind === 'owner' ? 'ORDER NOTIFICATION' : label('ORDER CONFIRMED', 'تم تأكيد الطلب')}</p><h1 class="title" style="margin:0 0 16px;font-size:36px;line-height:1.15;letter-spacing:-1px;color:#0A2A66">${copy(heading)}</h1><p style="margin:0;font-size:14px;line-height:24px;color:#526C93">${copy(intro)}</p>${review}<table role="presentation" width="100%" style="margin-top:24px;background:#F0F6FF;border-radius:12px"><tr><td style="padding:18px"><p style="margin:0 0 6px;color:#657A9C;font-size:10px;letter-spacing:1px">${label('ORDER NUMBER', 'رقم الطلب')}</p><p style="margin:0;font-size:20px;font-weight:700;color:#0A2A66" dir="ltr">#${copy(ref)}</p></td><td align="right" style="padding:18px;font-size:11px;line-height:19px;color:#526C93">${copy(date)}<br />${label('Dubai time', 'بتوقيت دبي')} · ${units} ${label(units === 1 ? 'item' : 'items', 'قطع')}</td></tr></table></td></tr><tr><td class="pad" style="padding:8px 38px 0"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}<tr><td colspan="2" style="padding:22px 0;color:#526C93;font-size:12px;font-weight:700">${label('TOTAL PAID', 'الإجمالي المدفوع')}</td><td align="right" style="padding:22px 0;font-size:23px;font-weight:800;color:#0A2A66;white-space:nowrap" dir="ltr">${copy(money(order.amount_aed))}</td></tr></table>${details}</td></tr><tr><td class="pad" style="padding:24px 38px 34px"><table role="presentation" width="100%" style="background:#EAF3FF;border-radius:12px"><tr><td style="padding:20px"><p style="margin:0 0 8px;color:#0A2A66;font-size:14px;font-weight:700">${kind === 'owner' ? 'Next step' : label('What happens next?', 'ما الخطوة التالية؟')}</p><p style="margin:0;color:#526C93;font-size:13px;line-height:22px">${copy(next)}</p></td></tr></table><table role="presentation" style="margin-top:24px" width="100%"><tr><td align="center" bgcolor="#1F5FD6" style="border-radius:28px"><a href="${esc(kind === 'owner' ? `${SITE_URL}/admin/orders` : whatsapp)}" style="display:block;padding:17px 20px;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:11px;letter-spacing:1px">${button}</a></td></tr></table></td></tr><tr><td class="pad" align="center" style="background:#0A2A66;padding:26px 38px"><p style="margin:0 0 10px;color:#FFFFFF;font-size:13px;font-weight:700">${label('Need a hand? We are here for you.', 'هل تحتاج إلى مساعدة؟ نحن هنا لخدمتك.')}</p><p style="margin:0;font-size:13px;line-height:24px"><a href="tel:+971558833836" style="color:#B9D7FF;text-decoration:none" dir="ltr">${SUPPORT_PHONE}</a><br /><a href="mailto:Court.hub.ae@gmail.com" style="color:#B9D7FF;text-decoration:none">Court.hub.ae@gmail.com</a></p><p style="margin:18px 0 0;font-size:10px;line-height:18px;color:#B9D7FF">COURT HUB · DUBAI, UAE<br /><a href="${SITE_URL}" style="color:#B9D7FF;text-decoration:none">courthub.ae</a></p></td></tr></table><p style="margin:18px 0 0;font-size:10px;line-height:17px;color:#657A9C">${test ? 'Template preview v1 · Fictional order details for testing only.' : label('This email confirms your order. It is not a tax invoice.', 'هذه الرسالة تأكيد لطلبك وليست فاتورة ضريبية.')}</p></td></tr></table></body></html>`;
  const text = [test ? 'TEST EMAIL. SAMPLE ORDER. No purchase or payment has been made.' : '', 'COURT HUB', heading, intro,
    `Order #${ref}`, `${date} (Dubai time)`, ...order.items.map((i) => `${i.title.replace(/\u2014/g, ',')} | Qty ${i.qty} | ${money(i.price_aed)} each | ${money(i.qty * i.price_aed)}`),
    `Total paid: ${money(order.amount_aed)}`, order.customer_name, order.customer_email, order.customer_phone, ...address,
    kind === 'owner' && order.review ? 'REVIEW REQUIRED before dispatch.' : '', next,
    kind === 'owner' ? `${SITE_URL}/admin/orders` : whatsapp, `Support: ${SUPPORT_PHONE}`, 'Court.hub.ae@gmail.com', SITE_URL].filter(Boolean).join('\n\n');
  return { subject, html, text };
}
