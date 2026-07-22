import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length > 0) process.env[k.trim()] = v.join('=').trim();
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const UPDATES = [
  {
    companyName: '350 Youth Clothing',
    contactName: 'Abdul Aziz',
    industry: 'Retail/Fashion',
    specificObservation: 'online visibility and how customers browse and enquire',
    tagline: 'From invisible online to impossible to miss.',
    subtitle: 'Transforming a strong offline youth fashion presence into a discoverable, browsable, and repeatable digital sales channel.',
    heroStats: [
      { value: 'Zero', unit: 'Visibility', label: 'Verified Online Presence' },
      { value: 'Multi-Channel', unit: 'Discovery', label: 'Customer Discovery Potential' },
      { value: '3 Pillars', unit: 'Framework', label: 'Growth, Access, Retention' },
      { value: 'One System', unit: 'Storefront', label: 'Simple Digital Storefront' },
    ],
    diagnosisIntro: `Our research into 350 Youth Clothing's public digital footprint returned no verified website and no Google Business presence. This is not a judgment on the quality of the business itself, but it is a clear and measurable commercial gap. In retail, particularly youth fashion where trends move quickly and customers often browse before buying, invisibility online almost always means lost customers to competitors who show up first in a search or have an easy way to preview products. The following diagnosis focuses on what this absence likely means in practice, without assuming anything about internal operations we cannot verify.`,
    leaks: [
      { type: 'GAP', title: 'No Digital Discoverability', description: 'A customer searching for "youth clothing near me" or similar terms in the local area would currently have no way to find 350 Youth Clothing through search engines or Google Maps.', impact: 'Lost Local Search Foot Traffic' },
      { type: 'GAP', title: 'No Way to Browse Before Buying', description: 'Youth fashion customers, especially teens and young adults, are used to browsing collections, checking styles, and comparing prices online before deciding where to shop.', impact: 'Lower Early Intent Conversion' },
      { type: 'RISK', title: 'Dependence on Walk-In and Word of Mouth Only', description: 'If the business currently relies solely on foot traffic and word of mouth, growth is naturally capped by physical visibility and local reputation alone.', impact: 'Vulnerable to Online Competitors' },
    ],
    solutionIntro: 'The goal of this solution is deliberately simple: give 350 Youth Clothing a digital front door that customers can find, browse, and act on, without adding operational complexity to the business. This ties directly into making more money by capturing search-based demand, operating better by reducing repetitive manual questions, and improving customer experience by giving shoppers a clear way to see what\'s available before they visit.',
    phases: [
      { phaseNum: 1, title: 'Digital Foundation Setup', description: 'A simple, mobile-friendly website or landing page, plus a properly configured Google Business listing with location, hours, and contact details.', timeline: '2-4 weeks', intervention: 'Mobile Website & Google Business Listing', futureState: 'Increased local discoverability and credible first impression.' },
      { phaseNum: 2, title: 'Product Discovery & WhatsApp Commerce', description: 'A simple visual catalogue of current collections linked directly to a WhatsApp ordering or enquiry button.', timeline: '4-6 weeks', intervention: 'WhatsApp Visual Catalogue', futureState: 'Higher quality enquiries, faster conversion, less staff admin.' },
      { phaseNum: 3, title: 'Repeat Customer Follow-Up', description: 'A lightweight customer list and simple WhatsApp broadcast approach for new arrivals, restocks, or seasonal offers.', timeline: '6-8 weeks', intervention: 'Lightweight VIP Customer List', futureState: 'More repeat visits and stronger customer loyalty.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abdul,

Hope you're doing well.

We looked into 350 Youth Clothing and noticed a few areas around online visibility and how customers browse and enquire that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    proposalValidUntil: 'August 22, 2026',
  },
  {
    companyName: 'Lights And Fans Shop',
    contactName: 'Abdul Aziz',
    industry: 'Retail/Electrical',
    specificObservation: 'online visibility and how customers ask about products',
    tagline: 'Turning product questions into product sales.',
    subtitle: 'Building a simple digital bridge that helps customers discover, compare, and buy lighting and fan products with confidence.',
    heroStats: [
      { value: 'Zero', unit: 'Presence', label: 'Verified Online Presence' },
      { value: 'High Research', unit: 'Category', label: 'Product Comparison Behavior' },
      { value: '3 Pillars', unit: 'Focus', label: 'Visibility, Clarity, Speed' },
      { value: 'One System', unit: 'Enquiry', label: 'Connected Enquiry Flow' },
    ],
    diagnosisIntro: `Our research found no website and no Google Business listing for Lights And Fans Shop. In a product category where customers typically want to see options, understand specifications, and compare pricing before visiting a store, this absence represents a real and identifiable commercial gap. The following observations focus on what is publicly verifiable and what can be reasonably inferred from typical customer behavior in this retail category.`,
    leaks: [
      { type: 'GAP', title: 'Invisible to Local Product Searches', description: 'Customers searching for "lighting shop near me" or "fan shop [area]" currently have no way to discover this business through search engines or maps.', impact: 'Lost Local Buyer Traffic' },
      { type: 'GAP', title: 'No Way to Pre-Browse Products or Pricing', description: 'Buyers in this category often want to see product types, styles, and price ranges before deciding where to shop or request a quote.', impact: 'Missed High-Intent Buyers' },
      { type: 'RISK', title: 'Manual, Repetitive Sales Conversations', description: 'If customers currently need to call or visit just to ask basic questions about stock, size, or pricing, this likely consumes significant staff time on repetitive queries.', impact: 'Staff Time Loss on Basic Enquiries' },
    ],
    solutionIntro: 'This solution focuses on making Lights And Fans Shop easier to find, easier to understand, and faster to buy from. It supports making more money by capturing local search demand, operating better by reducing repetitive basic questions, and improving customer experience by giving buyers clarity before they commit to a purchase or quote request.',
    phases: [
      { phaseNum: 1, title: 'Local Digital Presence Setup', description: 'A simple website with location, contact details, and product categories, plus a properly set up Google Business listing.', timeline: '2-4 weeks', intervention: 'Local SEO Website & Google Business Setup', futureState: 'Improved local search visibility and inbound enquiries.' },
      { phaseNum: 2, title: 'Product Catalogue & WhatsApp Enquiry Flow', description: 'A simple visual catalogue organized by product category, linked to a direct WhatsApp enquiry button.', timeline: '4-6 weeks', intervention: 'WhatsApp Product Catalogue', futureState: 'Faster sales conversations and reduced repetitive queries.' },
      { phaseNum: 3, title: 'Quote & Repeat Business Tracking', description: 'A lightweight system to log quote requests and past customers for simple follow-up.', timeline: '6-8 weeks', intervention: 'Lightweight Quote & Follow-Up Tracker', futureState: 'Better quote conversion and stronger referral business.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abdul,

Hope you're doing well.

We looked into Lights And Fans Shop and noticed a few areas around online visibility and how customers ask about products that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    proposalValidUntil: 'August 22, 2026',
  },
  {
    companyName: 'Flower Story',
    contactName: 'Abdul Hameed',
    industry: 'Retail/Florist',
    specificObservation: 'turning your strong Instagram following into more orders and repeat customers',
    tagline: 'From likes to loyal customers.',
    subtitle: 'Converting Flower Story\'s strong social following into a smoother ordering journey and stronger repeat purchase engine.',
    heroStats: [
      { value: '73K', unit: 'Followers', label: 'Instagram Followers' },
      { value: 'High Engagement', unit: 'Discovery', label: 'Social Discovery Strength' },
      { value: '3 Pillars', unit: 'Strategy', label: 'Conversion, Efficiency, Loyalty' },
      { value: 'One System', unit: 'Orders', label: 'Order & Occasion Tracking' },
    ],
    diagnosisIntro: `Flower Story has clearly succeeded at building audience attention, with a substantial and active Instagram following. The diagnosis below focuses not on visibility, which is already strong, but on what typically happens after a follower becomes interested: the ordering process, service consistency, and repeat purchase behavior. These are common friction points for social-first florists and are the most likely areas where additional revenue and efficiency are currently being left on the table.`,
    leaks: [
      { type: 'GAP', title: 'Strong Attention, Uncertain Conversion Path', description: 'With 73K followers actively engaging with content, the volume of interest is significant, but there is no publicly visible structured path from "interested in a post" to "order placed."', impact: 'Interest Drop-off Before Order' },
      { type: 'GAP', title: 'Likely Manual, Conversation-by-Conversation Ordering', description: 'Florist businesses at this scale typically manage orders through individual WhatsApp or DM conversations, which work but can become inconsistent as volume grows.', impact: 'Slower Response During Peak Times' },
      { type: 'GAP', title: 'Occasion-Based Repeat Purchases Underused', description: 'Flowers are frequently purchased around recurring, predictable occasions such as birthdays, anniversaries, and gifting moments, which create natural repeat purchase opportunities.', impact: 'Missed Repeat Occasion Revenue' },
    ],
    solutionIntro: 'The approach here respects what Flower Story has already built. Rather than changing the creative brand or content strategy, the solution focuses on making the path from interest to order smoother, and on turning one-time buyers into repeat customers. This directly supports making more money through better conversion and repeat purchases, operating better through reduced manual back-and-forth, and improving customer experience through faster, clearer ordering.',
    phases: [
      { phaseNum: 1, title: 'Order Journey Audit & Flow Design', description: 'A review of the current enquiry-to-order process, followed by simple, standardized WhatsApp response templates and a clear ordering flow.', timeline: '2-4 weeks', intervention: 'Standardized WhatsApp Order Intake', futureState: 'Faster response times and higher conversion rate.' },
      { phaseNum: 2, title: 'Simple Catalogue & Ordering Support', description: 'A lightweight product and pricing overview linked directly to WhatsApp, reducing repetitive back-and-forth.', timeline: '4-6 weeks', intervention: 'Digital Bouquet & Price Guide', futureState: 'Shorter sales conversations and quicker confirmations.' },
      { phaseNum: 3, title: 'Occasion-Based Repeat Purchase System', description: 'A simple system to record customer occasions (birthdays, anniversaries) and send timely, respectful reminders.', timeline: '6-8 weeks', intervention: 'Occasion Reminder Engine', futureState: 'Increased repeat orders and stronger customer retention.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abdul,

Hope you're doing well.

We looked into Flower Story and noticed a few areas around turning your strong Instagram following into more orders and repeat customers that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    proposalValidUntil: 'August 22, 2026',
  },
  {
    companyName: 'Perfumes Icud',
    contactName: 'Abdullah',
    industry: 'Retail/Fragrance',
    specificObservation: 'helping customers choose the right fragrance online and come back for repeat purchases',
    tagline: 'Making every scent story make sense to the right customer.',
    subtitle: 'Refining an existing online fragrance store to better serve and convert local customers, while improving guidance and repeat purchases.',
    heroStats: [
      { value: 'Existing', unit: 'Storefront', label: 'E-Commerce Storefront' },
      { value: 'Localization Gap', unit: 'Alignment', label: 'Market Alignment Opportunity' },
      { value: '3 Pillars', unit: 'Growth', label: 'Trust, Guidance, Repeat Sales' },
      { value: 'One System', unit: 'Journey', label: 'Localized Customer Journey' },
    ],
    diagnosisIntro: `Perfumes Icud's existing e-commerce presence at ioudstore.com is a real asset, but our review of the publicly visible storefront content raised a specific concern around market alignment, along with broader opportunities common to fragrance retail. The following diagnosis separates what we directly observed from what is a reasonable category-based hypothesis.`,
    leaks: [
      { type: 'RISK', title: 'Storefront May Be Misaligned With Oman Customers', description: 'Publicly visible content on the storefront references shipping and offers oriented toward Saudi Arabia, which may create confusion or reduce trust for Oman-based buyers landing on the same site.', impact: 'Local Checkout Abandonment' },
      { type: 'GAP', title: 'Limited Visible Guidance for Fragrance Selection', description: 'Fragrance buyers frequently want help understanding scent families, longevity, and occasion suitability before committing to a purchase, especially for gifting.', impact: 'Uncertain Buyer Drop-off' },
      { type: 'GAP', title: 'Repeat Purchase and Gifting Behavior Not Fully Activated', description: 'Fragrance is a category with strong natural repeat purchase potential, especially around gifting occasions, but this depends on tracking customer preferences over time.', impact: 'Unused Lifetime Value Potential' },
    ],
    solutionIntro: 'This solution is about sharpening an existing asset rather than building something new. It supports making more money by improving local conversion, operating better by reducing confusion at checkout, and improving customer experience through better guidance and more relevant repeat engagement.',
    phases: [
      { phaseNum: 1, title: 'Local Market Alignment Review', description: 'A focused review and correction of shipping information, currency, and messaging to clearly reflect Oman as a served market.', timeline: '2-4 weeks', intervention: 'Oman Storefront Localization', futureState: 'Increased trust and reduced checkout hesitation.' },
      { phaseNum: 2, title: 'Fragrance Guidance & Product Clarity', description: 'Simple, clear guidance content and WhatsApp support to help customers select the right fragrance.', timeline: '4-6 weeks', intervention: 'WhatsApp Fragrance Selector', futureState: 'Higher conversion rates and fewer uncertain purchases.' },
      { phaseNum: 3, title: 'Repeat Purchase & Preference Tracking', description: 'A simple system to record customer preferences and past purchases, enabling relevant follow-up.', timeline: '6-8 weeks', intervention: 'Scent Preference CRM', futureState: 'Increased repeat purchases and higher customer lifetime value.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abdullah,

Hope you're doing well.

We looked into Perfumes Icud and noticed a few areas around helping customers choose the right fragrance online and come back for repeat purchases that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    proposalValidUntil: 'August 22, 2026',
  },
  {
    companyName: 'Obaidani Stores',
    contactName: 'Abbas',
    industry: 'Retail/Menswear',
    specificObservation: 'connecting your branches and digital presence into one smoother customer journey',
    tagline: 'Six decades of heritage, one connected customer journey.',
    subtitle: 'Unifying Al Obaidani\'s branch network, tailoring services, and digital presence into a single, seamless customer experience.',
    heroStats: [
      { value: '1964', unit: 'Heritage', label: 'Established Heritage Brand' },
      { value: '32', unit: 'Outlets', label: 'Retail Outlets Nationwide' },
      { value: '2', unit: 'Factories', label: 'Production Factories' },
      { value: 'One Journey', unit: 'Connected', label: 'Connected Online & Branch Experience' },
    ],
    diagnosisIntro: `Al Obaidani's public presence reflects genuine scale and heritage strength, including a wide branch network, established production capability, and an active website and social presence. The following diagnosis is focused not on whether the brand is strong, it clearly is, but on whether the individual strong pieces (branches, tailoring, digital channels) are working together as one connected customer journey, or operating somewhat independently.`,
    leaks: [
      { type: 'GAP', title: 'Branch Network Strength Not Fully Connected Digitally', description: 'With 32 outlets, customers benefit enormously from convenience and accessibility, but the digital experience may not be clearly guiding customers to the most relevant branch based on their location or need.', impact: 'Friction in Online-to-Store Journey' },
      { type: 'GAP', title: 'Custom Tailoring Journey May Rely on Manual Coordination', description: 'Custom-made dishdashas require measurements, fabric preferences, and repeat order history, which are typically valuable to track digitally for consistency and convenience.', impact: 'Inconsistent Cross-Branch Sizing Data' },
      { type: 'GAP', title: 'Seasonal and Repeat Customer Engagement Potential', description: 'Traditional menswear naturally has strong seasonal purchase patterns, particularly around Eid and other cultural occasions, which represent a significant repeat-engagement opportunity.', impact: 'Uncaptured Seasonal Repeat Revenue' },
    ],
    solutionIntro: 'Given Al Obaidani\'s scale, the solution here is about connection, not construction. It focuses on linking existing strengths together to support making more money through better seasonal engagement, operating better through more consistent tailoring data across branches, and improving customer experience through smoother digital-to-branch journeys.',
    phases: [
      { phaseNum: 1, title: 'Full Customer Journey Audit', description: 'A comprehensive review of the current website, branch information, and customer touchpoints from first discovery through to in-store service.', timeline: '2-4 weeks', intervention: 'Omnichannel Customer Journey Audit', futureState: 'Clear, prioritized view of biggest impact opportunities.' },
      { phaseNum: 2, title: 'Connected Tailoring & Branch System', description: 'A simple, centralized system to record customer measurements, preferences, and order history, accessible across branches.', timeline: '4-8 weeks', intervention: 'Centralized Measurement & Order OS', futureState: 'Consistent customer service across all 32 branches.' },
      { phaseNum: 3, title: 'Seasonal & Repeat Customer Engagement', description: 'A structured seasonal communication approach reaching past customers with relevant, well-timed updates.', timeline: '8-12 weeks', intervention: 'Automated Seasonal Eid Engine', futureState: 'Increased repeat purchases during peak seasonal periods.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abbas,

Hope you're doing well.

We looked into Al Obaidani Stores and noticed a few areas around connecting your branches and digital presence into one smoother customer journey that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    proposalValidUntil: 'August 22, 2026',
  },
  {
    companyName: 'Smart City',
    contactName: 'Abbas',
    industry: 'Retail/Electronics',
    specificObservation: 'how customers find the business and reach out with questions',
    tagline: 'Building the digital front door your customers are already looking for.',
    subtitle: 'Establishing a simple, practical online presence that helps customers find, understand, and buy from Smart City with confidence.',
    heroStats: [
      { value: 'Limited', unit: 'Visibility', label: 'Current Digital Visibility' },
      { value: 'Local Search', unit: 'Channel', label: 'Untapped Discovery Channel' },
      { value: '3 Pillars', unit: 'Approach', label: 'Visibility, Access, Growth' },
      { value: 'One System', unit: 'Front Door', label: 'Simple Digital Front Door' },
    ],
    diagnosisIntro: `Our research into Smart City's public digital footprint found very limited visibility. This section focuses on what that gap likely means in practical commercial terms, based on how retail customers typically behave when searching for and choosing where to shop.`,
    leaks: [
      { type: 'GAP', title: 'Limited Discoverability for Local Customers', description: 'Customers searching online for relevant products or services in the area currently have little to no way of finding Smart City through search or maps.', impact: 'Missed Nearby Search Intent' },
      { type: 'GAP', title: 'No Clear Way for Customers to Understand Offerings', description: 'Without a website or clear online information, potential customers have no way to understand what the business sells or offers before making direct contact.', impact: 'Buyer Hesitation & Friction' },
      { type: 'RISK', title: 'Reliance on Direct Contact for Basic Information', description: 'If customers must call or visit in person just to learn basic information, this creates unnecessary friction that may discourage first contact altogether.', impact: 'Lost Prospects to Competitors' },
    ],
    solutionIntro: 'This solution is intentionally simple and foundational. It focuses on making more money by capturing currently missed local search demand, operating better by reducing repetitive basic information requests, and improving customer experience by giving people an easy first step to learn about the business.',
    phases: [
      { phaseNum: 1, title: 'Basic Digital Presence Setup', description: 'A simple website with essential business information, plus a properly configured Google Business listing.', timeline: '2-4 weeks', intervention: 'Digital Presence & Google Setup', futureState: 'Improved local discoverability and first touchpoint.' },
      { phaseNum: 2, title: 'Customer Enquiry & Communication Layer', description: 'A simple WhatsApp-based enquiry channel connected to the new digital presence.', timeline: '4-6 weeks', intervention: 'WhatsApp Customer Enquiry Flow', futureState: 'Higher-quality enquiries and faster response times.' },
      { phaseNum: 3, title: 'Repeat Communication & Simple Customer Tracking', description: 'A lightweight customer list for simple, relevant follow-up communication.', timeline: '6-8 weeks', intervention: 'Customer Follow-Up List', futureState: 'Improved retention and customer relationship growth.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abbas,

Hope you're doing well.

We looked into Smart City and noticed a few areas around how customers find the business and reach out with questions that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    proposalValidUntil: 'August 22, 2026',
  },
  {
    companyName: 'Supermarket Comex',
    contactName: 'Ahmed Said Alhazi',
    industry: 'Retail/Supermarket',
    specificObservation: 'practical ways to improve customer convenience and communication',
    tagline: 'Building on trust, making everyday shopping easier.',
    subtitle: 'Using our existing relationship as a foundation to explore practical improvements in customer convenience and communication.',
    heroStats: [
      { value: 'Existing', unit: 'Relationship', label: 'Relationship Context' },
      { value: 'High Frequency', unit: 'Model', label: 'Repeat Visit Business Model' },
      { value: '3 Pillars', unit: 'Pillars', label: 'Convenience, Communication, Retention' },
      { value: 'One System', unit: 'Layer', label: 'Simple Customer Communication Layer' },
    ],
    diagnosisIntro: `Because this is grounded in an existing relationship rather than fresh public research, the following diagnosis focuses on general, well-established supermarket customer experience patterns rather than specific claims about Comex's internal systems. These are offered as reasonable starting points for a deeper conversation, not confirmed findings.`,
    leaks: [
      { type: 'GAP', title: 'Digital Communication Can Strengthen Repeat Visits', description: 'Supermarkets that proactively communicate offers, promotions, and updates to customers typically see stronger repeat visit patterns than those relying solely on in-store signage.', impact: 'Uncaptured Repeat Shopping Visits' },
      { type: 'GAP', title: 'Customer Journey May Be Primarily In-Store Only', description: 'If most customer interaction currently happens only during a physical visit, there may be limited touchpoints to re-engage customers between visits.', impact: 'No Touchpoints Between Visits' },
      { type: 'GAP', title: 'Basic Digital Support Can Reduce Simple In-Store Questions', description: 'Common customer questions around product availability, hours, or offers can often be addressed through a simple digital channel, freeing up staff time.', impact: 'In-Store Staff Time Overhead' },
    ],
    solutionIntro: 'Given the existing relationship, this solution is intentionally exploratory and low-pressure. It focuses on making more money through better repeat visit engagement, operating better through reduced basic in-store questions, and improving customer experience through simple, convenient communication.',
    phases: [
      { phaseNum: 1, title: 'Customer Convenience & Access Review', description: 'A short, collaborative review of current customer touchpoints and communication.', timeline: '2-4 weeks', intervention: 'Convenience & Touchpoint Audit', futureState: 'Clear list of practical, low-effort improvements.' },
      { phaseNum: 2, title: 'Simple Customer Communication Channel', description: 'A simple, opt-in WhatsApp channel for store updates and offers.', timeline: '4-6 weeks', intervention: 'Opt-In WhatsApp Store Update Channel', futureState: 'Increased repeat visit frequency and neighborhood engagement.' },
      { phaseNum: 3, title: 'Basic Inquiry & Feedback Support', description: 'A simple digital touchpoint for store hours, locations, and quick customer feedback.', timeline: '6-8 weeks', intervention: 'Digital Info & Feedback Touchpoint', futureState: 'Reduced basic in-store questions and better customer insights.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Ahmed,

Hope you're doing well.

Following up on our existing connection with Comex, we looked into a few practical ways to improve customer convenience and communication for Supermarket Comex.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    proposalValidUntil: 'August 22, 2026',
  },
];

async function runDatabaseUpdate() {
  console.log('Starting Supabase database sync for 7 target companies...');

  const sessionDate = '2026-07-22';
  let { data: session } = await supabase
    .from('daily_outreach_sessions')
    .select('*')
    .eq('session_date', sessionDate)
    .maybeSingle();

  if (!session) {
    const { data: user } = await supabase.from('users').select('*').limit(1).single();
    const { data: newSess } = await supabase
      .from('daily_outreach_sessions')
      .insert({ user_id: user?.id, session_date: sessionDate, target_count: 10 })
      .select()
      .single();
    session = newSess;
  }

  for (const item of UPDATES) {
    const { data: company } = await supabase
      .from('companies')
      .select('*, contacts(*)')
      .ilike('company_name', `%${item.companyName}%`)
      .maybeSingle();

    if (!company) {
      console.error(`Company ${item.companyName} not found in DB!`);
      continue;
    }

    const primaryContact = company.contacts?.[0];
    if (primaryContact && item.contactName) {
      await supabase
        .from('contacts')
        .update({ full_name: item.contactName })
        .eq('id', primaryContact.id);
    }

    const proposalData = {
      coverTitleFormat: `Tadbeer × ${company.company_name}`,
      tagline: item.tagline,
      subtitle: item.subtitle,
      specificObservation: item.specificObservation,
      preparedDate: 'July 2026',
      aboutTadbeerContext: `Tadbeer Transformation (Tadbeer TT) is Oman's premier system architecture and operational scaling partner based in Madinat Qaboos, Muscat. We empower GCC enterprises to eliminate operational bottlenecks and scale seamlessly by deploying custom software solutions, AI technology & machine learning workflows, data-driven digital marketing, and human capital transformation frameworks.`,
      executiveSummaryText: item.diagnosisIntro,
      contextualMetrics: item.heroStats.map(s => ({
        value: s.value,
        label: s.label,
        context: `${s.unit} - ${s.label}`,
        source: 'Operational Intelligence Audit'
      })),
      heroStats: item.heroStats,
      diagnosisIntro: item.diagnosisIntro,
      leaks: item.leaks,
      solutionIntro: item.solutionIntro,
      phases: item.phases,
      ctaHeading: 'Book a Free Business Audit',
      ctaSubtext: 'Schedule a complimentary short session to walk through the observations and see if it\'s useful for your business.',
      ctaUrl: 'https://www.tadbeertt.com',
      ctaPhone: '+968 7630 7656',
      ctaEmail: 'operation@tadbeertt.com',
      proposalValidUntil: item.proposalValidUntil,
      additionalSections: [
        {
          title: 'WhatsApp Message',
          content: item.whatsappMessage.split('\n').filter(l => l.trim()),
        },
      ],
    };

    const messageBodyJson = JSON.stringify(proposalData);

    const { data: existingPrep } = await supabase
      .from('outreach_preparations')
      .select('*')
      .eq('company_id', company.id)
      .eq('use_case_summary', 'PROPOSAL')
      .maybeSingle();

    let prepRecord;
    if (existingPrep) {
      const { data: updated } = await supabase
        .from('outreach_preparations')
        .update({
          contact_id: primaryContact?.id || existingPrep.contact_id,
          message_body: messageBodyJson,
          status: 'ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPrep.id)
        .select()
        .single();
      prepRecord = updated;
    } else {
      const { data: created } = await supabase
        .from('outreach_preparations')
        .insert({
          company_id: company.id,
          contact_id: primaryContact?.id || null,
          use_case_summary: 'PROPOSAL',
          outreach_channel: 'email',
          message_body: messageBodyJson,
          status: 'ready',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      prepRecord = created;
    }

    if (session) {
      const { data: existingItem } = await supabase
        .from('daily_outreach_items')
        .select('*')
        .eq('session_id', session.id)
        .eq('company_id', company.id)
        .maybeSingle();

      if (!existingItem) {
        const { data: maxPos } = await supabase
          .from('daily_outreach_items')
          .select('position')
          .eq('session_id', session.id)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextPos = (maxPos?.position || 0) + 1;

        await supabase.from('daily_outreach_items').insert({
          session_id: session.id,
          company_id: company.id,
          preparation_id: prepRecord?.id || null,
          position: nextPos,
          status: 'prepared',
        });
      } else {
        await supabase
          .from('daily_outreach_items')
          .update({ preparation_id: prepRecord?.id })
          .eq('id', existingItem.id);
      }
    }

    console.log(`✓ Updated proposal & prep for ${company.company_name}`);
  }

  console.log('Database sync complete!');
}

runDatabaseUpdate().catch(err => {
  console.error('Error running DB update:', err);
  process.exit(1);
});
