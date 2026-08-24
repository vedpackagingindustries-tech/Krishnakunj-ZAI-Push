// ---------------------------------------------------------------------------
// Single Source of Truth for Public Temple Data
// All public-facing pages should import from here.
// Admin can override via CMS / settings in future.
// ---------------------------------------------------------------------------

export const TEMPLE = {
  name: 'कृष्णकुंज माँ कर्मा धाम',
  nameShort: 'श्री कृष्णकुंज माँ कर्मा धाम',
  address: 'सिविल लाईन रोड, (अकरजन) खैरागढ़, (छ.ग.)',
  whatsapp: '9589781615',
  upiId: 'sahubhagwat392@indianbk',
  organization: 'जिला साहू संघ खैरागढ़-छुईखदान-गंडई',
  estimatedCost: '₹25 लाख',
  pranPratishthaDate: 'फरवरी 2027',
} as const;

export const JAI_SLOGANS =
  '।।जय कर्मा।।      ।।जय भामाशाह।।    ।।जय राजिम।।';

export const NAV_LINKS = [
  { label: 'मुख्यपृष्ठ', href: '/' },
  { label: 'वीडियो', href: '/videos' },
  { label: 'संपर्क', href: '/contact' },
] as const;

export const FOOTER_LINKS = [
  { label: 'मुख्यपृष्ठ', href: '/' },
  { label: 'वीडियो', href: '/videos' },
  { label: 'संपर्क', href: '/contact' },
  { label: 'दान करें', href: '/donate' },
] as const;

export const COMMITTEE_MEMBERS = [
  { name: 'श्री गिरधारी साहू', post: 'अध्यक्ष', phone: '9691065812' },
  { name: 'श्री भागवत साहू', post: 'सचिव', phone: '8103144031' },
  { name: 'श्रीमती कांति साहू', post: 'कोषाध्यक्ष', phone: '9340159613' },
  { name: 'श्री फुलदास साहू', post: 'सामग्री प्रभारी', phone: '9589781615' },
  { name: 'श्री सुशील साहू', post: 'उपकोषाध्यक्ष', phone: '9009250736' },
  { name: 'श्रीमती प्रमिला साहू', post: 'प्रचार सचिव', phone: '9907271071' },
] as const;

export const CONSTRUCTION_STAGES = [
  { label: 'भूमि कार्य' },
  { label: 'नींव' },
  { label: 'निर्माण कार्य' },
  { label: 'गर्भगृह' },
  { label: 'अन्य कार्य' },
] as const;

export const DONATION_PRESET_AMOUNTS = [100, 501, 1001, 2001, 5001, 11001] as const;

export const MIN_DONATION_AMOUNT = 100;
