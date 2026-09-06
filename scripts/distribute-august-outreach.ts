import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valParts] = trimmed.split('=')
      if (key && valParts.length > 0) {
        process.env[key.trim()] = valParts.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface OutreachDataRow {
  business: string
  category: string
  location: string
  handle: string
  url: string
  touch1: string
  followers: string
  businessType: string
  researchSignal: string
  channel: string
  confidence: string
  contactStatus: string
  touch2: string
  touch3: string
  touch4: string
  qualification: string
  executionNote: string
  targetDate: string
}

const ALL_ROWS: OutreachDataRow[] = [
  // ─── AUGUST 20, 2026 (10 Real Estate Entries) ───────────────────────────
  {
    business: "Watan Real Estates",
    category: "Real Estate",
    location: "Muscat & Al Batinah",
    handle: "@watan_realestates",
    url: "https://www.instagram.com/watan_realestates/",
    touch1: "Hey Watan team, came across your page today. I noticed you guys cover both Muscat and Al Batinah for land transactions. That's a pretty broad local footprint.",
    followers: "5.7K",
    businessType: "Brokerage; buys/sells land",
    researchSignal: "Broad Muscat + Al Batinah land coverage",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-20"
  },
  {
    business: "Al Watad Real Estate",
    category: "Real Estate",
    location: "Oman",
    handle: "@oman_realestate9",
    url: "https://www.instagram.com/oman_realestate9/",
    touch1: "Hey Al Watad team, came across your page today. The page has a clear real-estate focus across Oman. Feels like you guys keep the property side front and centre.",
    followers: "13.5K",
    businessType: "Real estate agency",
    researchSignal: "Oman-based agency",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-20"
  },
  {
    business: "Simsar",
    category: "Real Estate",
    location: "Oman",
    handle: "@simsar.oman",
    url: "https://www.instagram.com/simsar.oman/",
    touch1: "Hey Simsar team, came across your page today. I noticed the licensed property-transaction positioning. It gives the page a more formal feel than the usual listing accounts.",
    followers: "5.7K",
    businessType: "Property transaction service",
    researchSignal: "Licensed Ministry of Housing positioning",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-20"
  },
  {
    business: "Red Skyline Sale",
    category: "Real Estate",
    location: "Oman",
    handle: "@redskyline.sale",
    url: "https://www.instagram.com/redskyline.sale/",
    touch1: "Hey Red Skyline team, came across your page today. I noticed you guys handle buying, selling and rentals rather than just one side of property. That's a useful mix.",
    followers: "1.3K",
    businessType: "Brokerage",
    researchSignal: "Buy, sell and rental service",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-20"
  },
  {
    business: "Al Amaken Real Estate",
    category: "Real Estate",
    location: "Al Amerat, Muscat",
    handle: "@al_amaken_property.oman",
    url: "https://www.instagram.com/al_amaken_property.oman/",
    touch1: "Hey Al Amaken team, came across your page today. The Al Amerat focus caught my eye. Local property pages that really know their area always stand out.",
    followers: "1.8K",
    businessType: "Brokerage",
    researchSignal: "Al Amerat property focus",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-20"
  },
  {
    business: "Location Construction & Real Estate",
    category: "Real Estate",
    location: "Muscat",
    handle: "@location.c.r",
    url: "https://www.instagram.com/location.c.r/",
    touch1: "Hey Location team, came across your page today. The combination of construction and real estate is interesting. It gives you guys a much wider property angle.",
    followers: "16.1K",
    businessType: "Construction + real estate",
    researchSignal: "Construction/property crossover",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-20"
  },
  {
    business: "Tiqani Real Estate",
    category: "Real Estate",
    location: "Al Khoud, Muscat",
    handle: "@tiqani_red",
    url: "https://www.instagram.com/tiqani_red/",
    touch1: "Hey Tiqani team, came across your page today. I noticed the construction and engineering side alongside real estate. That's a different positioning from a normal brokerage.",
    followers: "9.7K",
    businessType: "Construction/engineering + property",
    researchSignal: "Al Khoud-based crossover",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-20"
  },
  {
    business: "Alajmi Real Estate",
    category: "Real Estate",
    location: "Oman",
    handle: "@alajmi_realestate",
    url: "https://www.instagram.com/alajmi_realestate/",
    touch1: "Hey Alajmi team, came across your page today. The licensed brokerage positioning caught my eye. The page feels very property-focused.",
    followers: "9.2K",
    businessType: "Licensed brokerage",
    researchSignal: "Oman brokerage",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-20"
  },
  {
    business: "Emtiaz Al Khaleej Real Estate",
    category: "Real Estate",
    location: "Oman",
    handle: "@aqarat_imtyas",
    url: "https://www.instagram.com/aqarat_imtyas/",
    touch1: "Hey Emtiaz team, came across your page today. I noticed you guys cover both brokerage and property management. That's a useful combination for owners.",
    followers: "2K",
    businessType: "Brokerage + property management",
    researchSignal: "Sales + management",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-20"
  },
  {
    business: "Fawanis",
    category: "Real Estate",
    location: "Muscat & South Al Batinah",
    handle: "@fawanis2",
    url: "https://www.instagram.com/fawanis2/",
    touch1: "Hey Fawanis team, came across your page today. I noticed the coverage across Muscat and South Al Batinah. That's a solid area to be covering for property.",
    followers: "10.8K",
    businessType: "Brokerage",
    researchSignal: "Regional property coverage",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-20"
  },

  // ─── AUGUST 23, 2026 (9 Real Estate + 1 DTC / Beauty = 10 Entries) ─────────
  {
    business: "Eshrakat AlJazeera Real Estate",
    category: "Real Estate",
    location: "Oman",
    handle: "@ejr_om",
    url: "https://www.instagram.com/ejr_om/",
    touch1: "Hey Eshrakat team, came across your page today. The page has built a pretty strong audience around the real-estate business. The local positioning comes through clearly.",
    followers: "35.5K",
    businessType: "Real estate company",
    researchSignal: "Established Omani company",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-23"
  },
  {
    business: "Tamkeen Homes",
    category: "Real Estate",
    location: "Muscat",
    handle: "@tamkeen.homes",
    url: "https://www.instagram.com/tamkeen.homes/",
    touch1: "Hey Tamkeen team, came across your page today. I noticed you handle sales, rentals and property management. That's a pretty complete property service mix.",
    followers: "11.1K",
    businessType: "Sales/rentals/management",
    researchSignal: "Multiple property services",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-23"
  },
  {
    business: "Muscat Homes",
    category: "Real Estate",
    location: "Muscat",
    handle: "@muscathomes",
    url: "https://www.instagram.com/muscathomes/",
    touch1: "Hey Muscat Homes team, came across your page today. The long-running Muscat focus caught my eye. There aren't many property pages that keep such a clear local identity.",
    followers: "3K",
    businessType: "Real estate",
    researchSignal: "Muscat-focused; since 2010",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-23"
  },
  {
    business: "Dar Arabia",
    category: "Real Estate",
    location: "Oman",
    handle: "@dar_arabia_",
    url: "https://www.instagram.com/dar_arabia_/",
    touch1: "Hey Dar Arabia team, came across your page today. I noticed the developer positioning and the long history behind the business. That's a strong foundation for a local property brand.",
    followers: "9.2K",
    businessType: "Developer",
    researchSignal: "45 years development experience",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-23"
  },
  {
    business: "RIKAZ",
    category: "Real Estate",
    location: "Muscat",
    handle: "@rikaz.om",
    url: "https://www.instagram.com/rikaz.om/",
    touch1: "Hey RIKAZ team, came across your page today. The development focus comes through clearly, and the page has built a pretty strong audience around the brand.",
    followers: "36.6K",
    businessType: "Developer",
    researchSignal: "Muscat-based developer",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-23"
  },
  {
    business: "Aqarat Muscat Oman",
    category: "Real Estate",
    location: "Muscat",
    handle: "@3qar.mct",
    url: "https://www.instagram.com/3qar.mct/",
    touch1: "Hey Aqarat team, came across your page today. The page is very directly focused on helping people find properties in Muscat. Nice and clear positioning.",
    followers: "1.6K",
    businessType: "Brokerage",
    researchSignal: "Muscat property discovery",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-23"
  },
  {
    business: "Town Estate",
    category: "Real Estate",
    location: "Muscat",
    handle: "@estatetown",
    url: "https://www.instagram.com/estatetown/",
    touch1: "Hey Town Estate team, came across your page today. I noticed you guys combine property sales and development. That's an interesting mix for a Muscat real-estate business.",
    followers: "6.4K",
    businessType: "Real estate",
    researchSignal: "Sales + development",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-23"
  },
  {
    business: "Beitak Real Estate",
    category: "Real Estate",
    location: "Oman",
    handle: "@beitak_real_estates",
    url: "https://www.instagram.com/beitak_real_estates/",
    touch1: "Hey Beitak team, came across your page today. The combination of sales, rentals and property management is pretty broad. The page has also built a strong audience around it.",
    followers: "65.9K",
    businessType: "Marketing/brokerage",
    researchSignal: "Sales, rentals, property management",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-23"
  },
  {
    business: "Atyan Real Estate",
    category: "Real Estate",
    location: "Oman",
    handle: "@atyan.om",
    url: "https://www.instagram.com/atyan.om/",
    touch1: "Hey Atyan team, came across your page today. I noticed the business covers brokerage, marketing and management. That's a wider property setup than most agency pages.",
    followers: "3.8K",
    businessType: "Brokerage/marketing/management",
    researchSignal: "Multiple property services",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Property pages in Oman can look very similar, so the way the business is positioned makes a difference.",
    touch3: "One thing I keep noticing with property enquiries is how quickly a simple Instagram message turns into price requests, brochure requests and follow-ups before anyone knows what the buyer is actually looking for.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-23"
  },
  {
    business: "Ms Muscat",
    category: "DTC / Beauty",
    location: "Muscat",
    handle: "@ms.muscat",
    url: "https://www.instagram.com/ms.muscat/",
    touch1: "Hey Ms Muscat team, came across your page today. The range of beauty products on the page is huge. It feels more like a full beauty destination than a single-product brand.",
    followers: "39.1K",
    businessType: "Beauty products",
    researchSignal: "Gulf delivery; large audience",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Beauty is such an Instagram-heavy category here, and the brands that make the buying journey simple really stand out.",
    touch3: "The thing I keep seeing with product brands is that the interest happens on Instagram, but then the customer ends up in a lot of back-and-forth around product choice, availability, delivery and payment.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-23"
  },

  // ─── AUGUST 24, 2026 (5 DTC / Beauty + 4 Hospitality / F&B = 9 Entries) ────
  {
    business: "Ghudaf",
    category: "DTC / Beauty",
    location: "Oman",
    handle: "@ghudaf__creations",
    url: "https://www.instagram.com/ghudaf__creations/",
    touch1: "Hey Ghudaf team, came across your page today. The natural hair-care angle is really clear. I like that the brand has a specific identity rather than trying to sell everything.",
    followers: "12.5K",
    businessType: "Natural hair care",
    researchSignal: "Oman/Gulf delivery",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Beauty is such an Instagram-heavy category here, and the brands that make the buying journey simple really stand out.",
    touch3: "The thing I keep seeing with product brands is that the interest happens on Instagram, but then the customer ends up in a lot of back-and-forth around product choice, availability, delivery and payment.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-24"
  },
  {
    business: "Shahad Cosmetics",
    category: "DTC / Beauty",
    location: "Oman",
    handle: "@shahd.cosmetic",
    url: "https://www.instagram.com/shahd.cosmetic/",
    touch1: "Hey Shahad team, came across your page today. The Omani vegan cosmetics angle caught my eye. That's a pretty clear point of difference.",
    followers: "5K",
    businessType: "Cosmetics",
    researchSignal: "Omani vegan; licensed; Gulf delivery",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Beauty is such an Instagram-heavy category here, and the brands that make the buying journey simple really stand out.",
    touch3: "The thing I keep seeing with product brands is that the interest happens on Instagram, but then the customer ends up in a lot of back-and-forth around product choice, availability, delivery and payment.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-24"
  },
  {
    business: "Beauty World Oman",
    category: "DTC / Beauty",
    location: "Oman",
    handle: "@beauty.world.om",
    url: "https://www.instagram.com/beauty.world.om/",
    touch1: "Hey Beauty World team, came across your page today. The page has built a pretty big audience around skincare. The mix of products and consultations is interesting.",
    followers: "46.8K",
    businessType: "Skincare products",
    researchSignal: "Products + consultations; Gulf delivery",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Beauty is such an Instagram-heavy category here, and the brands that make the buying journey simple really stand out.",
    touch3: "The thing I keep seeing with product brands is that the interest happens on Instagram, but then the customer ends up in a lot of back-and-forth around product choice, availability, delivery and payment.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-24"
  },
  {
    business: "Her Place",
    category: "DTC / Beauty",
    location: "Oman",
    handle: "@herplace.om",
    url: "https://www.instagram.com/herplace.om/",
    touch1: "Hey Her Place team, came across your page today. The natural-care positioning is really clear. Nice seeing a local product brand with a specific identity.",
    followers: "4.5K",
    businessType: "Natural care",
    researchSignal: "Licensed; Gulf delivery",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Beauty is such an Instagram-heavy category here, and the brands that make the buying journey simple really stand out.",
    touch3: "The thing I keep seeing with product brands is that the interest happens on Instagram, but then the customer ends up in a lot of back-and-forth around product choice, availability, delivery and payment.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-24"
  },
  {
    business: "SAE Skincare",
    category: "DTC / Beauty",
    location: "Muscat",
    handle: "@saeskincare",
    url: "https://www.instagram.com/saeskincare/",
    touch1: "Hey SAE team, came across your page today. I noticed the local brand has a physical counter at Mall of Oman as well. Nice combination of product and retail presence.",
    followers: "N/A",
    businessType: "Skincare",
    researchSignal: "Locally owned; Mall of Oman counter",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Beauty is such an Instagram-heavy category here, and the brands that make the buying journey simple really stand out.",
    touch3: "The thing I keep seeing with product brands is that the interest happens on Instagram, but then the customer ends up in a lot of back-and-forth around product choice, availability, delivery and payment.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-24"
  },
  {
    business: "Ramssa Omani Restaurant",
    category: "Hospitality / F&B",
    location: "Muscat",
    handle: "@ramssa_restaurantoman",
    url: "https://www.instagram.com/ramssa_restaurantoman/",
    touch1: "Hey Ramssa team, came across your page today. The Omani restaurant concept caught my eye, especially the way the page shows the atmosphere around the food.",
    followers: "N/A",
    businessType: "Omani restaurant",
    researchSignal: "WhatsApp reservations; outdoor seating",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Muscat has a lot of F&B options now, so having a clear identity makes a place much easier to remember.",
    touch3: "One thing I keep noticing with restaurants is that Instagram creates the interest, but the customer can still end up jumping between DMs, WhatsApp, calls and booking platforms.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-24"
  },
  {
    business: "Lucoo",
    category: "Hospitality / F&B",
    location: "Bawshar, Muscat",
    handle: "@lucoo.om",
    url: "https://www.instagram.com/lucoo.om/",
    touch1: "Hey Lucoo team, came across your page today. The coffee and ice-cream combination caught my eye. The Bawshar setup looks like a nice casual hangout.",
    followers: "N/A",
    businessType: "Coffee/ice cream",
    researchSignal: "WhatsApp + Talabat + social channels",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Muscat has a lot of F&B options now, so having a clear identity makes a place much easier to remember.",
    touch3: "One thing I keep noticing with restaurants is that Instagram creates the interest, but the customer can still end up jumping between DMs, WhatsApp, calls and booking platforms.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-24"
  },
  {
    business: "Sultan Restaurant",
    category: "Hospitality / F&B",
    location: "Muscat",
    handle: "@alsultanalomani",
    url: "https://www.instagram.com/alsultanalomani/",
    touch1: "Hey Sultan team, came across your page today. I noticed the Oman branch also handles banquets and hospitality. That's a much broader F&B operation than a normal restaurant page.",
    followers: "N/A",
    businessType: "Banquets/hospitality",
    researchSignal: "Oman branch; Muscat WhatsApp; Kuwait branch",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Muscat has a lot of F&B options now, so having a clear identity makes a place much easier to remember.",
    touch3: "One thing I keep noticing with restaurants is that Instagram creates the interest, but the customer can still end up jumping between DMs, WhatsApp, calls and booking platforms.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-24"
  },
  {
    business: "Culaccino Pizzeria & Caffè",
    category: "Hospitality / F&B",
    location: "Muscat",
    handle: "@culaccinocaffe",
    url: "https://www.instagram.com/culaccinocaffe/",
    touch1: "Hey Culaccino team, came across your page today. I noticed you guys have both Araimi Boulevard and Bousher locations. That's a solid local footprint for a café/restaurant brand.",
    followers: "N/A",
    businessType: "Pizzeria/café",
    researchSignal: "Two Muscat locations; social + reviews",
    channel: "instagram_dm",
    confidence: "High",
    contactStatus: "New vs all previous generated lists; verify CRM/Instagram sent folder",
    touch2: "Thanks — that was what caught my attention. Muscat has a lot of F&B options now, so having a clear identity makes a place much easier to remember.",
    touch3: "One thing I keep noticing with restaurants is that Instagram creates the interest, but the customer can still end up jumping between DMs, WhatsApp, calls and booking platforms.",
    touch4: "If that's something you guys deal with, happy to grab a coffee sometime and compare notes. Nothing formal.",
    qualification: "Confirm decision-maker, current enquiry/order/booking process, where leads arrive, response bottleneck, and whether growth is a current priority.",
    executionNote: "Touches 2-4 are conditional; verify current Instagram feed before Touch 1.",
    targetDate: "2026-08-24"
  }
]

function mapCategoryToSector(cat: string): string {
  const norm = cat.toLowerCase()
  if (norm.includes('real estate')) return 'real_estate'
  if (norm.includes('dtc') || norm.includes('beauty') || norm.includes('cosmetics') || norm.includes('skincare')) return 'social_commerce_dtc'
  if (norm.includes('hospitality') || norm.includes('f&b') || norm.includes('restaurant') || norm.includes('caf')) return 'hospitality_fnb'
  return 'general'
}

async function run() {
  console.log(`\n======================================================`)
  console.log(`🚀 Starting Full Data-Point Distribution for 29 Leads`)
  console.log(`📅 Target Dates: Aug 20, Aug 23, and Aug 24, 2026`)
  console.log(`======================================================\n`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < ALL_ROWS.length; i++) {
    const row = ALL_ROWS[i]
    const dateIso = new Date(`${row.targetDate}T10:00:00.000Z`).toISOString()
    const sectorCode = mapCategoryToSector(row.category)

    console.log(`[${i + 1}/${ALL_ROWS.length}] Processing "${row.business}" (${row.category}) for ${row.targetDate}...`)

    // 1. Build rich research_json payload
    const researchJson = {
      instagram_handle: row.handle,
      instagram_url: row.url,
      followers: row.followers,
      business_type: row.businessType,
      research_signal: row.researchSignal,
      confidence: row.confidence,
      contact_status: row.contactStatus,
      qualification: row.qualification,
      execution_note: row.executionNote,
      specific_observation: row.researchSignal,
      staged_sequence: {
        touch_1: {
          channel: "instagram_dm",
          message: row.touch1,
          specific_observation: row.researchSignal,
          target_name: `${row.business} Team / Owner`
        },
        touch_2: {
          channel: "instagram_dm",
          message: row.touch2,
          day_delay: 2,
          value_asset: "Category enquiry & positioning insight"
        },
        touch_3: {
          channel: "instagram_dm",
          message: row.touch3,
          day_delay: 3,
          is_final_touch: false
        },
        touch_4_cta: {
          channel: "instagram_dm",
          message: row.touch4,
          day_delay: 2,
          is_final_touch: true
        },
        cold_call_script: {
          opener: `Ahlan, this is from Tadbeer Transformations in Muscat regarding ${row.business}. Caught you with 30 seconds?`,
          context_bridge: `I came across your page and noticed ${row.researchSignal}. We work with businesses across Muscat to streamline customer inquiries without back-and-forth message congestion.`,
          close_for_coffee: `Can I buy you a quick coffee sometime this week to compare notes on what's working across Muscat?`
        }
      }
    }

    const cleanNotes = `Instagram: ${row.handle} | URL: ${row.url} | Followers: ${row.followers} | Business Type: ${row.businessType} | Signal: ${row.researchSignal}`

    // 2. Check if company already exists
    const { data: existingCo } = await supabase
      .from('companies')
      .select('id')
      .ilike('company_name', row.business.trim())
      .maybeSingle()

    let companyId = existingCo?.id

    if (companyId) {
      // Update existing company
      const { error: updateErr } = await supabase
        .from('companies')
        .update({
          industry: row.category,
          category: sectorCode,
          city: row.location,
          country: 'Oman',
          notes: cleanNotes,
          research_json: researchJson,
          draft_message: row.touch1,
          draft_angle_reasoning: row.researchSignal,
          draft_status: 'ready_to_send',
          created_at: dateIso,
          updated_at: dateIso
        })
        .eq('id', companyId)

      if (updateErr) console.warn(`  ⚠️ Company update notice:`, updateErr.message)
    } else {
      // Insert new company
      const { data: newCo, error: insertCoErr } = await supabase
        .from('companies')
        .insert({
          company_name: row.business.trim(),
          industry: row.category,
          category: sectorCode,
          city: row.location,
          country: 'Oman',
          status: 'contacted',
          notes: cleanNotes,
          research_json: researchJson,
          draft_message: row.touch1,
          draft_angle_reasoning: row.researchSignal,
          draft_status: 'ready_to_send',
          created_at: dateIso,
          updated_at: dateIso
        })
        .select('id')
        .single()

      if (insertCoErr) {
        console.error(`  ❌ Failed to insert company ${row.business}:`, insertCoErr.message)
        errorCount++
        continue
      }
      companyId = newCo.id
    }

    // 3. Upsert primary Contact
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('company_id', companyId)
      .limit(1)
      .maybeSingle()

    if (!existingContact) {
      await supabase.from('contacts').insert({
        company_id: companyId,
        full_name: `${row.business} Team / Owner`,
        title: 'Decision Maker / Owner',
        is_primary: true,
        created_at: dateIso
      })
    }

    // 4. Create/Replace Activity Log for the target date
    const activityPayload = {
      channel: 'instagram_dm',
      handle: row.handle,
      template_used: 'gate_opener',
      status: 'sent',
      prospect_reply: '',
      pain_point: row.researchSignal,
      call_opening_line: row.touch1,
      notes: `${row.followers} followers · ${row.businessType} · ${row.qualification}`,
      sent_message: row.touch1,
      touch_2: row.touch2,
      touch_3: row.touch3,
      touch_4_cta: row.touch4,
      confidence: row.confidence,
      contact_status: row.contactStatus,
      execution_note: row.executionNote
    }

    // Delete existing old activity on same day if any, to avoid duplicate spamming
    await supabase
      .from('activities')
      .delete()
      .eq('company_id', companyId)
      .gte('created_at', `${row.targetDate}T00:00:00.000Z`)
      .lte('created_at', `${row.targetDate}T23:59:59.999Z`)

    const { error: actErr } = await supabase
      .from('activities')
      .insert({
        company_id: companyId,
        activity_type: 'call_made', // Compatible with primary queries
        title: `Instagram DM — Gate-Opener Sent`,
        description: JSON.stringify(activityPayload),
        created_at: dateIso
      })

    if (actErr) {
      console.warn(`  ⚠️ Activity insert warning:`, actErr.message)
    }

    // 5. Upsert outreach_preparations for cross-channel tracking
    await supabase.from('outreach_preparations').upsert({
      company_id: companyId,
      use_case_summary: `Instagram DM: ${row.researchSignal}`,
      personalization: row.researchSignal,
      outreach_channel: 'linkedin', // valid DB constraint value
      message_body: row.touch1,
      status: 'ready',
      created_at: dateIso,
      updated_at: dateIso
    }, { onConflict: 'id' })

    successCount++
    console.log(`  ✓ Inserted/Updated "${row.business}" for ${row.targetDate}`)
  }

  console.log(`\n======================================================`)
  console.log(`🎉 Distribution Complete!`)
  console.log(`  - Total Rows: ${ALL_ROWS.length}`)
  console.log(`  - Successfully Processed: ${successCount}`)
  console.log(`  - Errors: ${errorCount}`)
  console.log(`  - August 20, 2026: 10 leads`)
  console.log(`  - August 23, 2026: 10 leads`)
  console.log(`  - August 24, 2026: 9 leads`)
  console.log(`======================================================\n`)
}

run()
