import type { Plan } from "@/lib/store";

/** A skill-based way to earn. No made-up pay figures: freelance rates depend on you and the client. */
export type Gig = {
  title: string; type: string; platform?: string; url?: string;
  why: string; steps: string[]; speed: string;
};

const CHIP_ALIAS: Record<string, string> = {
  "Web development": "Coding", "Mobile apps": "Coding", "Fashion / tailoring": "Fashion", "Makeup": "Beauty",
};

// Free-text skills ("I am a developer", "react dev", "logo designer") map to a skill group
const KEYWORDS: [string, RegExp][] = [
  ["Coding", /\b(dev|devs|developer|developers|development|programmer|programming|coder|coding|software|frontend|front-end|backend|back-end|full-?stack|react|next\.?js|node|python|javascript|typescript|html|css|php|laravel|flutter|android|ios|web|apps?|code)\b/i],
  ["Graphic design", /\b(design|designer|graphic|graphics|ui|ux|logo|canva|figma|brand|branding|illustrat\w*)\b/i],
  ["Writing", /\b(writer|writing|copywrit\w*|content|blog|blogger|proofread\w*|ghostwrit\w*)\b/i],
  ["Video editing", /\b(video|youtube|premiere|capcut|motion|animat\w*)\b/i],
  ["Teaching", /\b(teach\w*|tutor\w*|lecturer|coach\w*)\b/i],
  ["Social media", /\b(social|smm|community|instagram|tiktok)\b/i],
  ["Sales", /\b(sales|selling|marketer|marketing|affiliate)\b/i],
  ["Data entry", /\b(data entry|typing|typist)\b/i],
  ["Data analysis", /\b(data analy\w*|excel|power ?bi|sql|spreadsheet)\b/i],
  ["Photography", /\b(photo|photograph\w*)\b/i],
  ["Customer support", /\b(customer|support|call cent\w*)\b/i],
  ["Virtual assistant", /\b(virtual assistant|assistant|admin)\b/i],
  ["Translation", /\b(translat\w*|interpret\w*|yoruba|igbo|hausa|french)\b/i],
  ["Fashion", /\b(fashion|tailor\w*|seamstress|sewing)\b/i],
  ["Cooking", /\b(cook\w*|chef|baker|baking|catering|food)\b/i],
  ["Beauty", /\b(makeup|make-up|hair|barber|beauty|nails)\b/i],
];

const GIGS: Record<string, Gig[]> = {
  Coding: [
    { title: "Freelance web or app development", type: "Freelancing", platform: "Upwork", url: "https://www.upwork.com",
      why: "Clients post small fixes and builds every day, and you set your rate.",
      steps: ["Create a profile with 2–3 projects you built (GitHub or a live link)", "Send 5 short, specific applications a day", "Take a small fixed-price job first to earn reviews"], speed: "1–3 weeks to a first job" },
    { title: "Sell small coding services", type: "Freelancing", platform: "Fiverr", url: "https://www.fiverr.com",
      why: "Narrow, clearly priced offers are easy for buyers to say yes to.",
      steps: ["List 2 specific offers, e.g. “fix a bug in your React site” or “landing page in 48 hours”", "Add screenshots of past work", "Reply to messages quickly. Response time affects ranking"], speed: "1–4 weeks" },
    { title: "Build websites for local businesses", type: "Local gig",
      why: "Many nearby shops and services have no website or a weak one, and they pay directly.",
      steps: ["List 10 businesses near you with no site or a poor one", "Message each with one concrete improvement idea", "Offer a simple package: one-page site plus a WhatsApp button"], speed: "Days to 2 weeks" },
    { title: "Apply for remote developer jobs", type: "Remote job", platform: "Remote OK", url: "https://remoteok.com",
      why: "Slower to land, but steadier than one-off gigs once you have projects to show.",
      steps: ["Polish your GitHub and portfolio", "Apply to roles that match your stack", "Also check weworkremotely.com"], speed: "Weeks to months" },
  ],
  "Graphic design": [
    { title: "Logo, flyer and social post design", type: "Freelancing", platform: "Fiverr", url: "https://www.fiverr.com",
      why: "Small businesses constantly need logos, flyers and posts.", steps: ["List 2 clear packages with delivery times", "Show a before and after in your portfolio", "Offer a fast first delivery to earn reviews"], speed: "1–3 weeks" },
    { title: "Design for local businesses and events", type: "Local gig",
      why: "Shops, churches, schools and event organizers need flyers and banners often.", steps: ["Make 3 sample flyers for real nearby businesses", "Share them on WhatsApp status and Instagram", "Offer a bundle: logo plus 5 social posts"], speed: "Days to 2 weeks" },
  ],
  Writing: [
    { title: "Freelance writing and copywriting", type: "Freelancing", platform: "Upwork", url: "https://www.upwork.com",
      why: "Blogs, product descriptions and emails are always in demand.", steps: ["Write 3 sample pieces in a niche you know", "Apply to 5 jobs a day with a short pitch", "Start with small fixed-price jobs"], speed: "1–3 weeks" },
    { title: "Write for local businesses", type: "Local gig",
      why: "Business owners need product descriptions, captions and website text.", steps: ["Pick 10 local brands you like", "Send one improved caption or description as a free sample", "Offer a monthly content package"], speed: "Days to 2 weeks" },
  ],
  "Video editing": [
    { title: "Edit videos for creators and brands", type: "Freelancing", platform: "Fiverr", url: "https://www.fiverr.com",
      why: "Short-form video editing is in constant demand.", steps: ["Make 3 sample edits (reel, YouTube cut, promo)", "List one package with a clear turnaround", "Reach out to small creators with a free sample"], speed: "1–3 weeks" },
  ],
  Teaching: [
    { title: "Online tutoring", type: "Teaching", platform: "Preply", url: "https://preply.com",
      why: "Students pay for help in subjects and exams you know well.", steps: ["Pick one subject you are strong in", "Create a profile and a short intro video", "Offer a low-priced trial lesson"], speed: "1–3 weeks" },
    { title: "Home lessons and exam prep", type: "Local gig",
      why: "Parents in your area pay for reliable lesson teachers.", steps: ["Tell 10 parents or school groups", "Offer a first-lesson discount", "Ask for referrals after each month"], speed: "Days to 2 weeks" },
  ],
  "Social media": [
    { title: "Manage social media for small businesses", type: "Freelancing", platform: "Upwork", url: "https://www.upwork.com",
      why: "Many small businesses want posting and replies handled for them.", steps: ["Pick one niche (restaurants, salons, shops)", "Make a sample 1-week content plan", "Pitch 10 businesses with that plan"], speed: "1–3 weeks" },
  ],
  Sales: [
    { title: "Commission sales and affiliate selling", type: "Sell", platform: "Jumia JForce", url: "https://jforce.jumia.com.ng",
      why: "You earn a commission when people buy through you.", steps: ["Check the programme terms and your eligibility", "Pick products your contacts already want", "Promote on WhatsApp and social media honestly"], speed: "1–3 weeks" },
  ],
  "Data entry": [
    { title: "Data entry and admin tasks", type: "Freelancing", platform: "Upwork", url: "https://www.upwork.com",
      why: "Spreadsheet and typing jobs are common starter work.", steps: ["Practise speed and accuracy", "Apply to small data jobs", "Also try the microtask platforms on this page"], speed: "1–2 weeks" },
  ],
  "Data analysis": [
    { title: "Spreadsheet and data analysis gigs", type: "Freelancing", platform: "Upwork", url: "https://www.upwork.com",
      why: "Small businesses pay to clean data and build reports.", steps: ["Build 2 sample dashboards", "Offer a quick report or cleanup service", "Reach out to local businesses with a free sample"], speed: "1–4 weeks" },
  ],
  Photography: [
    { title: "Shoot events and products", type: "Local gig",
      why: "Small brands and event hosts need photos.", steps: ["Shoot 10 sample photos for a friend or local brand", "Share them with clear prices", "Offer a product-photo bundle"], speed: "Days to 2 weeks" },
    { title: "Sell your photos", type: "Sell", platform: "Shutterstock", url: "https://submit.shutterstock.com",
      why: "Stock sites pay per download, but slowly.", steps: ["Upload sharp, well-lit, original photos", "Add accurate keywords", "Treat it as a side stream"], speed: "Months" },
  ],
  "Customer support": [
    { title: "Remote customer support", type: "Remote job", platform: "Remote OK", url: "https://remoteok.com",
      why: "Some companies hire support agents remotely.", steps: ["Prepare a short CV with your writing skills", "Apply to support roles that allow your location", "Be ready for a written test"], speed: "Weeks" },
  ],
  "Virtual assistant": [
    { title: "Virtual assistant work", type: "Freelancing", platform: "Upwork", url: "https://www.upwork.com",
      why: "Busy owners pay for email, scheduling and research help.", steps: ["List the tasks you can do well", "Create a profile focused on those tasks", "Apply to 5 jobs a day"], speed: "1–3 weeks" },
  ],
  Translation: [
    { title: "Translation and language gigs", type: "Freelancing", platform: "Upwork", url: "https://www.upwork.com",
      why: "Local-language and French translation is requested by businesses.", steps: ["Make 2 sample translations", "Apply to translation jobs", "Offer proofreading as well"], speed: "1–3 weeks" },
  ],
  Fashion: [
    { title: "Sell custom outfits and alterations", type: "Sell",
      why: "People pay for custom work and quick alterations.", steps: ["Post 5 photos of your best work", "Take pre-orders on WhatsApp and Instagram", "Collect a deposit before you cut fabric"], speed: "Days to 2 weeks" },
  ],
  Cooking: [
    { title: "Sell food, snacks or catering", type: "Sell",
      why: "Pre-orders let you earn without much upfront cost.", steps: ["Pick 1–2 items you make well", "Post them on WhatsApp status with a cut-off time", "Deliver in batches to save costs"], speed: "Days" },
  ],
  Beauty: [
    { title: "Book clients for makeup, hair or grooming", type: "Local gig",
      why: "Repeat clients and referrals build steady income.", steps: ["Post before-and-after photos", "Offer a first-booking discount", "Ask every client for a referral"], speed: "Days to 2 weeks" },
  ],
};

export function normalizeSkills(skills: string[] = [], other = ""): string[] {
  const out = new Set<string>();
  for (const s of skills) out.add(CHIP_ALIAS[s] ?? s);
  const text = [...skills, other].join(" . ");
  for (const [name, rx] of KEYWORDS) if (rx.test(text)) out.add(name);
  return [...out].filter((s) => GIGS[s]);
}

/** Interleaves gigs across the user's skills so every skill is represented. */
export function matchGigs(skills: string[] = [], other = "", limit = 12): Gig[] {
  const groups = normalizeSkills(skills, other).map((s) => GIGS[s]);
  const out: Gig[] = [];
  for (let i = 0; out.length < limit && groups.some((g) => i < g.length); i++) {
    for (const g of groups) if (g[i] && out.length < limit) out.push(g[i]);
  }
  return out;
}

const toOpportunity = (g: Gig): Plan["opportunities"][number] => ({
  title: g.title, type: g.type, effort: "Medium", steps: g.steps, speed: g.speed,
  ...(g.url ? { url: g.url } : {}),
  ...(g.platform ? { platform: g.platform } : {}),
});

/** Plan opportunities: skill-based gigs first, then one quick-start item for surveys and microtasks. */
export function buildOpportunities(skills: string[] = [], other = ""): Plan["opportunities"] {
  const skillGigs = matchGigs(skills, other, 3).map(toOpportunity);
  const generic: Plan["opportunities"] = skillGigs.length ? [] : [{
    title: `Offer ${other.trim() || "your skill"} as a service`, type: "Local gig", effort: "Medium", speed: "Days to 2 weeks",
    steps: ["Write one sentence on what you do and who it helps", "Message 10 people or businesses with a clear offer", "Ask your first customers for a referral"],
  }];
  const quick: Plan["opportunities"][number] = {
    title: "Surveys and microtasks for quick starter cash", type: "Microtasks", effort: "Low", speed: "Days",
    url: "/earn", platform: "MindBank list",
    steps: ["Join 2 platforms from the list", "Fill in your profile fully", "Do tasks in spare gaps and cash out at the minimum"],
  };
  return [...skillGigs, ...generic, quick];
}