const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function seed() {
  console.log('Seeding...');

  // Officials
  const eo = await db.officialMember.count();
  if (eo === 0) {
    await db.officialMember.createMany({ data: [
      { name: 'श्री गिरधारी साहू', designation: 'अध्यक्ष', phone: '9691065812', displayOrder: 1, isActive: true },
      { name: 'श्री भागवत साहू', designation: 'सचिव', phone: '8103144031', displayOrder: 2, isActive: true },
      { name: 'श्रीमती कांति साहू', designation: 'कोषाध्यक्ष', phone: '9340159613', displayOrder: 3, isActive: true },
      { name: 'श्री फुलदास साहू', designation: 'सामग्री प्रभारी', phone: '9589781615', displayOrder: 4, isActive: true },
      { name: 'श्री सुशील साहू', designation: 'उपकोषाध्यक्ष', phone: '9009250736', displayOrder: 5, isActive: true },
      { name: 'श्रीमती प्रमिला साहू', designation: 'प्रचार सचिव', phone: '9907271071', displayOrder: 6, isActive: true },
    ]});
    console.log('Officials done');
  }

  // CMS
  const cms = [
    { key: 'hero_title', value: 'कृष्णकुंज माँ कर्मा धाम', type: 'text', label: 'हीरो शीर्षक', group: 'hero' },
    { key: 'hero_subtitle', value: 'प्रिय स्वजातीय बंधुओं एवं पदाधिकारीयो', type: 'text', label: 'हीरो उपशीर्षक', group: 'hero' },
    { key: 'hero_cta_primary', value: '🙏 अभी दान करें', type: 'text', label: 'प्राथमिक CTA', group: 'hero' },
    { key: 'hero_cta_primary_link', value: '/donate', type: 'url', label: 'CTA लिंक', group: 'hero' },
    { key: 'hero_cta_secondary', value: 'मंदिर निर्माण देखें', type: 'text', label: 'द्वितीयक CTA', group: 'hero' },
    { key: 'temple_name', value: 'कृष्णकुंज माँ कर्मा धाम', type: 'text', label: 'मंदिर नाम', group: 'temple' },
    { key: 'temple_address', value: 'सिविल लाईन रोड, (अकरजन) खैरागढ़, (छ.ग.)', type: 'text', label: 'मंदिर पता', group: 'temple' },
    { key: 'temple_estimated_cost', value: '2500000', type: 'number', label: 'अनुमानित लागत', group: 'temple' },
    { key: 'donation_heading', value: 'मंदिर निर्माण हेतु दान करें', type: 'text', label: 'दान शीर्षक', group: 'donation' },
    { key: 'donation_message', value: 'आपकी श्रद्धा और सहयोग इस पावन मंदिर निर्माण कार्य में महत्वपूर्ण योगदान है।', type: 'text', label: 'दान संदेश', group: 'donation' },
    { key: 'footer_copyright', value: '© 2025 कृष्णकुंज माँ कर्मा धाम — सर्वाधिकार सुरक्षित', type: 'text', label: 'कॉपीराइट', group: 'footer' },
    { key: 'footer_thank_you', value: 'इस पावन कार्य में आपके सहयोग के लिए आभार!', type: 'text', label: 'धन्यवाद', group: 'footer' },
  ];
  for (const c of cms) {
    await db.cmsContent.upsert({ where: { key: c.key }, update: {}, create: c });
  }
  console.log('CMS done');

  // Website Settings
  const ws = [
    { key: 'site_title', value: 'कृष्णकुंज माँ कर्मा धाम', label: 'साइट शीर्षक' },
    { key: 'meta_title', value: 'कृष्णकुंज माँ कर्मा धाम — मंदिर निर्माण दान', label: 'मेटा शीर्षक' },
    { key: 'contact_phone', value: '9691065812', label: 'संपर्क फोन' },
    { key: 'contact_whatsapp', value: '9691065812', label: 'WhatsApp' },
    { key: 'min_donation_amount', value: '100', label: 'न्यूनतम दान' },
    { key: 'upi_id', value: 'sahubhagwat392@indianbk', label: 'UPI ID' },
    { key: 'upi_name', value: 'कृष्णकुंज माँ कर्मा धाम', label: 'UPI नाम' },
    { key: 'show_upi', value: 'true', label: 'UPI दिखाएं' },
  ];
  for (const s of ws) {
    await db.websiteSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log('Settings done');

  // Construction
  const cs = await db.constructionStage.count();
  if (cs === 0) {
    await db.constructionStage.createMany({ data: [
      { label: 'भूमि पूजन', description: 'मंदिर भूमि का पवित्रीकरण', progress: 100, displayOrder: 1, isCompleted: true },
      { label: 'खुदाई कार्य', description: 'नींव खुदाई एवं तैयारी', progress: 100, displayOrder: 2, isCompleted: true },
      { label: 'नींव निर्माण', description: 'मंदिर नींव एवं बेसमेंट', progress: 100, displayOrder: 3, isCompleted: true },
      { label: 'दीवार निर्माण', description: 'भित्तियों एवं दीवारों का निर्माण', progress: 85, displayOrder: 4, isCompleted: false },
      { label: 'शिखर निर्माण', description: 'शिखर/गुंबद निर्माण', progress: 40, displayOrder: 5, isCompleted: false },
      { label: 'मूर्ति स्थापना', description: 'दिव्य मूर्तियों की प्राण-प्रतिष्ठा', progress: 0, displayOrder: 6, isCompleted: false },
      { label: 'अंतिम सजावट', description: 'मंदिर की अंतिम सजावट', progress: 0, displayOrder: 7, isCompleted: false },
    ]});
    console.log('Construction done');
  }

  console.log('All seeded!');
}

seed().catch(console.error).finally(() => process.exit(0));
