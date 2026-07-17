import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const USERS = [
  { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", full_name: "Ahmed Al-Rashid", email: "ahmed@tadbeer.com", role: "admin" },
  { id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", full_name: "Ismail Khan", email: "ismail@tadbeer.com", role: "closer" },
  { id: "c3d4e5f6-a7b8-9012-cdef-123456789012", full_name: "Fatima Hassan", email: "fatima@tadbeer.com", role: "bd_rep" },
];

const COMPANIES = [
  { company_name: "Saudi Digital Solutions", industry: "Technology", country: "Saudi Arabia", city: "Riyadh", employee_count: 250, status: "prospect" },
  { company_name: "Gulf AI Systems", industry: "AI & Machine Learning", country: "UAE", city: "Dubai", employee_count: 120, status: "prospect" },
  { company_name: "Emirates Marketing Group", industry: "Marketing", country: "UAE", city: "Abu Dhabi", employee_count: 80, status: "contacted" },
  { company_name: "Riyadh Tech Hub", industry: "Technology", country: "Saudi Arabia", city: "Riyadh", employee_count: 500, status: "prospect" },
  { company_name: "Bahrain HR Consultants", industry: "Human Resources", country: "Bahrain", city: "Manama", employee_count: 45, status: "prospect" },
  { company_name: "Kuwait Innovation Labs", industry: "Technology", country: "Kuwait", city: "Kuwait City", employee_count: 75, status: "in_call_queue" },
  { company_name: "Oman Digital Marketing Co", industry: "Marketing", country: "Oman", city: "Muscat", employee_count: 60, status: "prospect" },
  { company_name: "Qatar Software House", industry: "Software Development", country: "Qatar", city: "Doha", employee_count: 180, status: "prospect" },
  { company_name: "Egypt AI Research Center", industry: "AI & Machine Learning", country: "Egypt", city: "Cairo", employee_count: 90, status: "contacted" },
  { company_name: "Jordan Tech Startups", industry: "Technology", country: "Jordan", city: "Amman", employee_count: 30, status: "prospect" },
  { company_name: "Lebanon Digital Agency", industry: "Digital Agency", country: "Lebanon", city: "Beirut", employee_count: 40, status: "prospect" },
  { company_name: "Morocco AI Academy", industry: "Education & AI", country: "Morocco", city: "Casablanca", employee_count: 55, status: "prospect" },
  { company_name: "Saudi Health Tech", industry: "Healthcare IT", country: "Saudi Arabia", city: "Jeddah", employee_count: 320, status: "meeting_booked" },
  { company_name: "Dubai Fintech Corp", industry: "Financial Technology", country: "UAE", city: "Dubai", employee_count: 200, status: "opportunity" },
  { company_name: "Abu Dhabi Smart City", industry: "Smart City / IoT", country: "UAE", city: "Abu Dhabi", employee_count: 400, status: "prospect" },
  { company_name: "Riyadh E-Commerce Platform", industry: "E-Commerce", country: "Saudi Arabia", city: "Riyadh", employee_count: 150, status: "contacted" },
  { company_name: "Kuwait Education Tech", industry: "EdTech", country: "Kuwait", city: "Kuwait City", employee_count: 85, status: "prospect" },
  { company_name: "Bahrain Blockchain Solutions", industry: "Blockchain", country: "Bahrain", city: "Manama", employee_count: 35, status: "prospect" },
  { company_name: "Oman Cybersecurity Group", industry: "Cybersecurity", country: "Oman", city: "Muscat", employee_count: 65, status: "won" },
  { company_name: "Qatar Data Analytics Ltd", industry: "Data Analytics", country: "Qatar", city: "Doha", employee_count: 110, status: "lost" },
];

const CONTACTS = [
  { company_index: 0, full_name: "Mohammed Al-Farsi", title: "CTO", email: "mohammed@saudidigital.sa", whatsapp: "+966501234567", is_primary: true },
  { company_index: 1, full_name: "Sarah Al-Maktoum", title: "CEO", email: "sarah@gulfai.ae", whatsapp: "+971509876543", is_primary: true },
  { company_index: 2, full_name: "Khalid Bin Hamad", title: "Marketing Director", email: "khalid@emiratesmktg.ae", whatsapp: "+971555551234", is_primary: true },
  { company_index: 3, full_name: "Abdullah Al-Otaibi", title: "VP Engineering", email: "abdullah@riyadhtech.sa", whatsapp: "+966507654321", is_primary: true },
  { company_index: 4, full_name: "Noura Al-Khalifa", title: "Managing Partner", email: "noura@bahrainhr.bh", whatsapp: "+97333123456", is_primary: true },
  { company_index: 5, full_name: "Yousef Al-Sabah", title: "Innovation Lead", email: "yousef@kuwaitinnovate.kw", whatsapp: "+96599887766", is_primary: true },
  { company_index: 6, full_name: "Aisha Al-Lawati", title: "Digital Director", email: "aisha@omandigital.om", whatsapp: "+96891234567", is_primary: true },
  { company_index: 7, full_name: "Omar Al-Thani", title: "Head of Development", email: "omar@qatarsoftware.qa", whatsapp: "+97455123456", is_primary: true },
  { company_index: 8, full_name: "Layla Ibrahim", title: "AI Research Lead", email: "layla@egyptai.eg", whatsapp: "+201012345678", is_primary: true },
  { company_index: 9, full_name: "Rami Al-Khatib", title: "Founder & CEO", email: "rami@jordantech.jo", whatsapp: "+962791234567", is_primary: true },
];

export async function seedDatabase() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Seeding service lines...");
  const { data: serviceLines } = await supabase.from("service_lines").select("id, name");
  const serviceLineMap = new Map(serviceLines?.map((sl) => [sl.name, sl.id]) || []);

  console.log("Seeding companies...");
  for (const company of COMPANIES) {
    const { data: inserted } = await supabase
      .from("companies")
      .upsert(company, { onConflict: "company_name" })
      .select("id")
      .single();

    if (inserted) {
      const contact = CONTACTS.find((c) => c.company_index === COMPANIES.indexOf(company));
      if (contact) {
        await supabase.from("contacts").upsert(
          { company_id: inserted.id, full_name: contact.full_name, title: contact.title, email: contact.email, whatsapp: contact.whatsapp, is_primary: contact.is_primary },
          { onConflict: "id" }
        );
      }
    }
  }

  console.log("Seed completed!");
}
