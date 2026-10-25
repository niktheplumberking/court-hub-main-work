import type { Metadata } from 'next';
import type { Locale } from './i18n/locale';
import { localePath } from './i18n/locale';
import type { ShopProduct } from './shop/catalog';
import { plainText } from './copy';
import { WHATSAPP_NUMBER } from './whatsapp';

export const SITE_URL = 'https://courthub.ae';
export const SHARE_IMAGE = '/brand/court-hub-share-v1.4.png';
export const SITE_TITLE = {
  en: 'Court Hub | Padel Rackets & Court Construction in Dubai, UAE',
  ar: 'Court Hub | مضارب البادل وإنشاء الملاعب في دبي والإمارات',
};
export const SITE_DESCRIPTION = {
  en: 'Discover padel rackets and equipment at Court Hub in Dubai, UAE. Shop in AED, compare product conditions and discuss your court construction project on WhatsApp.',
  ar: 'اكتشف مضارب ومعدات البادل لدى Court Hub في دبي والإمارات. تسوق بالدرهم، وقارن حالة المنتجات، وتواصل عبر واتساب لمناقشة مشروع إنشاء ملعبك.',
};
export const absoluteUrl = (path: string) => new URL(path, SITE_URL).href;

export function languageAlternates(path: string) {
  return { en: absoluteUrl(path), ar: absoluteUrl(localePath('ar', path)), 'x-default': absoluteUrl(path) };
}

export function pageMetadata(path: string, locale: Locale, options: { title: string; description: string; noindex?: boolean }): Metadata {
  const title = plainText(options.title);
  const description = plainText(options.description);
  const url = absoluteUrl(localePath(locale, path));
  const image = absoluteUrl(SHARE_IMAGE);
  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: 'website', siteName: 'Court Hub', title, description, url,
      locale: locale === 'ar' ? 'ar_AE' : 'en_AE', alternateLocale: [locale === 'ar' ? 'en_AE' : 'ar_AE'],
      images: [{ url: image, width: 1200, height: 630,
        alt: 'COURT HUB: padel equipment and court construction in Dubai, UAE' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    robots: options.noindex ? { index: false, follow: true } : {
      index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
  };
}

export const QUICK_ANSWERS = {
  en: [
    { question: 'What does Court Hub offer?', answer: 'Court Hub is based in Dubai, UAE. Explore padel rackets and equipment in our online shop, or contact our team about court construction.' },
    { question: 'How do I enquire about building a padel court?', answer: 'Open Construct Your Court, enter your name, email or phone number and court location, then select Chat on WhatsApp to discuss your project with our team.' },
    { question: 'Where can I check a racket’s price and condition?', answer: 'Each product page shows its price in AED, availability and any listed condition. Check those details before adding the racket to your bag.' },
    { question: 'How can I contact Court Hub?', answer: 'Visit Contact Us for our Dubai address, phone and email, or use the WhatsApp link to speak with our team.' },
  ],
  ar: [
    { question: 'ماذا تقدم Court Hub؟', answer: 'يقع مقر Court Hub في دبي، الإمارات. استكشف مضارب ومعدات البادل في متجرنا الإلكتروني، أو تواصل مع فريقنا بشأن إنشاء الملاعب.' },
    { question: 'كيف أستفسر عن إنشاء ملعب بادل؟', answer: 'افتح صفحة أنشئ ملعبك، وأدخل اسمك وبريدك الإلكتروني أو رقم هاتفك وموقع الملعب، ثم اضغط على الدردشة عبر واتساب لمناقشة مشروعك مع فريقنا.' },
    { question: 'أين أجد سعر المضرب وحالته؟', answer: 'تعرض صفحة كل منتج سعره بالدرهم الإماراتي ومدى توفره وحالته عند تحديدها. راجع هذه التفاصيل قبل إضافة المضرب إلى حقيبتك.' },
    { question: 'كيف أتواصل مع Court Hub؟', answer: 'تفضل بزيارة صفحة تواصل معنا للاطلاع على عنواننا في دبي ورقم الهاتف والبريد الإلكتروني، أو استخدم رابط واتساب للتحدث مع فريقنا.' },
  ],
};

export function organizationSchema() {
  return {
    '@context': 'https://schema.org', '@type': 'OnlineStore', '@id': `${SITE_URL}/#organization`, name: 'Court Hub', url: SITE_URL,
    logo: absoluteUrl('/brand/court-hub-logo-v1.4.png'), image: absoluteUrl(SHARE_IMAGE), description: SITE_DESCRIPTION.en,
    telephone: `+${WHATSAPP_NUMBER}`, email: 'support@courthub.ae',
    address: { '@type': 'PostalAddress', streetAddress: '51A Street, Al Warqa 3', addressLocality: 'Dubai', addressCountry: 'AE' },
  };
}

export function homeSchema(locale: Locale) {
  return [
    { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'Court Hub', url: SITE_URL, inLanguage: ['en', 'ar'], publisher: { '@id': `${SITE_URL}/#organization` } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', '@id': `${absoluteUrl(localePath(locale, '/'))}#quick-answers`,
      inLanguage: locale, mainEntity: QUICK_ANSWERS[locale].map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) },
  ];
}

export function productMetadata(product: ShopProduct, locale: Locale) {
  const description = product.desc ? plainText(product.desc).slice(0, 160) : locale === 'ar'
    ? `${product.name}. السعر ${product.price} درهم إماراتي. راجع الحالة والتوفر لدى Court Hub في دبي.`
    : `${product.name} at Court Hub, Dubai, UAE. AED ${product.price}. View product condition and current availability.`;
  return pageMetadata(`/shop/${product.slug}`, locale, { title: `${product.name} | Court Hub`, description });
}

export function productSchema(product: ShopProduct, locale: Locale) {
  const url = absoluteUrl(localePath(locale, `/shop/${product.slug}`));
  return [
    { '@context': 'https://schema.org', '@type': 'Product', '@id': `${url}#product`, name: product.name,
      image: product.images.map(absoluteUrl), ...(product.desc ? { description: plainText(product.desc) } : {}),
      sku: product.id, ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
      ...(product.categoryName ? { category: product.categoryName } : {}),
      offers: { '@type': 'Offer', url, price: product.price, priceCurrency: 'AED',
        availability: `https://schema.org/${product.inStock ? 'InStock' : 'OutOfStock'}`,
        ...(product.condition ? { itemCondition: `https://schema.org/${product.condition === 'new' ? 'NewCondition' : 'UsedCondition'}` } : {}),
        seller: { '@id': `${SITE_URL}/#organization` } } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: locale === 'ar' ? 'الرئيسية' : 'Home', item: absoluteUrl(localePath(locale, '/')) },
      { '@type': 'ListItem', position: 2, name: locale === 'ar' ? 'المتجر' : 'Shop', item: absoluteUrl(localePath(locale, '/shop')) },
      { '@type': 'ListItem', position: 3, name: product.name, item: url },
    ] },
  ];
}

/** Prevent catalogue/CMS text from ending an inline script element. */
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
