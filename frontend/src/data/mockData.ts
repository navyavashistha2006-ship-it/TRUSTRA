export interface PriceReference {
  location: string;
  serviceType: string;
  routeContext: string;
  min: number;
  median: number;
  max: number;
  currency: string;
}

export interface ComplaintData {
  location: string;
  serviceType: string;
  complaintCount: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  topIssues: string[];
}

export interface IncidentData {
  id: string;
  location: string;
  serviceType: string;
  category: 'Overcharging' | 'Harassment' | 'Fake Guide' | 'Unlicensed Operator' | 'Bait & Switch' | 'Safety Alert';
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  title: string;
  details: string;
  date: string;
}

export const MOCK_PRICES: PriceReference[] = [
  {
    location: "Jaipur",
    serviceType: "Taxi",
    routeContext: "Airport to Amer Fort",
    min: 600,
    median: 850,
    max: 1300,
    currency: "₹"
  },
  {
    location: "Jaipur",
    serviceType: "Guide",
    routeContext: "Amer Fort Tour",
    min: 400,
    median: 600,
    max: 1100,
    currency: "₹"
  },
  {
    location: "Jaipur",
    serviceType: "Homestay",
    routeContext: "Old City Heritage Room",
    min: 1500,
    median: 2500,
    max: 4500,
    currency: "₹"
  },
  {
    location: "Goa",
    serviceType: "Rental",
    routeContext: "Scooter Day Rent (Vagator)",
    min: 350,
    median: 500,
    max: 900,
    currency: "₹"
  },
  {
    location: "Goa",
    serviceType: "Taxi",
    routeContext: "Dabolim Airport to Calangute",
    min: 1200,
    median: 1600,
    max: 2400,
    currency: "₹"
  },
  {
    location: "Goa",
    serviceType: "Homestay",
    routeContext: "Beachside Room (Anjuna)",
    min: 2200,
    median: 3800,
    max: 6500,
    currency: "₹"
  },
  {
    location: "Manali",
    serviceType: "Trek Operator",
    routeContext: "Solang Valley Day Hike",
    min: 1000,
    median: 1800,
    max: 3000,
    currency: "₹"
  },
  {
    location: "Manali",
    serviceType: "Taxi",
    routeContext: "Mall Road to Solang Valley",
    min: 600,
    median: 900,
    max: 1500,
    currency: "₹"
  },
  {
    location: "Agra",
    serviceType: "Guide",
    routeContext: "Taj Mahal Guided Tour",
    min: 500,
    median: 800,
    max: 1500,
    currency: "₹"
  },
  {
    location: "Agra",
    serviceType: "Taxi",
    routeContext: "Cantt Station to Taj East Gate",
    min: 250,
    median: 400,
    max: 700,
    currency: "₹"
  },
  {
    location: "Mumbai",
    serviceType: "Taxi",
    routeContext: "Colaba to Mumbai Airport",
    min: 650,
    median: 900,
    max: 1400,
    currency: "₹"
  },
  {
    location: "Mumbai",
    serviceType: "Guide",
    routeContext: "Dharavi Guided Walking Tour",
    min: 600,
    median: 900,
    max: 1300,
    currency: "₹"
  }
];

export const MOCK_COMPLAINTS: ComplaintData[] = [
  {
    location: "Jaipur",
    serviceType: "Taxi",
    complaintCount: 42,
    severity: "HIGH",
    topIssues: ["Demanding extra commissions for hotel stops", "Aggressive behavior", "Detours to partner shops"]
  },
  {
    location: "Jaipur",
    serviceType: "Guide",
    complaintCount: 18,
    severity: "MODERATE",
    topIssues: ["Pushing expensive gem shops", "Unlicensed operators claiming to be official"]
  },
  {
    location: "Goa",
    serviceType: "Rental",
    complaintCount: 29,
    severity: "MODERATE",
    topIssues: ["Forfeiting deposit for minor/pre-existing scratches", "Providing low-maintenance vehicles"]
  },
  {
    location: "Goa",
    serviceType: "Taxi",
    complaintCount: 51,
    severity: "HIGH",
    topIssues: ["Refusing to run meters", "Charging high night surcharges", "Intimidating app-based cab aggregators"]
  },
  {
    location: "Agra",
    serviceType: "Guide",
    complaintCount: 35,
    severity: "HIGH",
    topIssues: ["Fake ID badges", "Coercing tourists into buying high-priced souvenirs", "Fabricated historical stories"]
  },
  {
    location: "Manali",
    serviceType: "Taxi",
    complaintCount: 12,
    severity: "LOW",
    topIssues: ["High rates during snow seasons", "Long queues"]
  }
];

export const MOCK_INCIDENTS: IncidentData[] = [
  {
    id: "inc-01",
    location: "Jaipur",
    serviceType: "Taxi",
    category: "Bait & Switch",
    severity: "HIGH",
    title: "En-route Embellishment & Detour forced stop",
    details: "Driver claimed the booked hotel was closed/unsafe and insisted on taking the tourist to another hotel owned by a 'relative' where prices were tripled.",
    date: "2026-08-10"
  },
  {
    id: "inc-02",
    location: "Jaipur",
    serviceType: "Guide",
    category: "Fake Guide",
    severity: "MODERATE",
    title: "Commission Scheme inside Gem Market",
    details: "Unlicensed guide led tourists to a gem market shop, pressuring them to purchase synthetic stones marketed as authentic gems.",
    date: "2026-08-12"
  },
  {
    id: "inc-03",
    location: "Goa",
    serviceType: "Taxi",
    category: "Overcharging",
    severity: "HIGH",
    title: "Calangute Taxi Union Overcharging Dispute",
    details: "Local taxi operators surrounded app-cab and forced passengers out, demanding double the rate for private transfer.",
    date: "2026-08-15"
  },
  {
    id: "inc-04",
    location: "Agra",
    serviceType: "Guide",
    category: "Fake Guide",
    severity: "CRITICAL",
    title: "Unlicensed Guide Entry Counterfeit scam",
    details: "Scammer posed as official guide at the ticket counter, sold fake fast-track tickets, and abandoned tourists inside.",
    date: "2026-08-05"
  },
  {
    id: "inc-05",
    location: "Goa",
    serviceType: "Rental",
    category: "Bait & Switch",
    severity: "MODERATE",
    title: "Pre-existing scratch fine extortion",
    details: "Rental shop operator claimed security deposit (₹5000) for a pre-existing scratch. Refused to return tourist passport until paid.",
    date: "2026-08-01"
  }
];
