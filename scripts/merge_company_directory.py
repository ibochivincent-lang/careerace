import json

# Read existing company_directory.ts
with open('lib/company_directory.ts', 'r', encoding='utf-8') as f:
    orig_code = f.read()

# Read the extracted verified maritime contacts
with open('lib/verified_maritime_contacts.json', 'r', encoding='utf-8') as f:
    maritime_list = json.load(f)

# Extract non-maritime contacts from the original company_directory
# We know VERIFIED_COMPANY_HIRING_CONTACTS is an array. Let us parse it or keep original entries.
# Let's extract the non-maritime entries and original verified maritime entries.
import re

# We can also write a clean typescript file that has the full directory:
# original entries (Maersk, ABS, Chevron, Subsea 7, SBM Offshore, Vard Marine, etc., plus Tech/AI/Medical/Management)
# + the 321 verified maritime contacts (without duplicating emails)

seen_emails = set()

# Let's load existing items by evaluating or parsing JSON-like structures
# Or write a clean generator in python
header = '''export interface CompanyHiringContact {
  id: string;
  company: string;
  category: 'Maritime / Offshore' | 'Software / Cloud' | 'AI / Robotics' | 'Engineering / Industrial' | 'Medical / Healthcare' | 'Management / Operations';
  contactEmail: string;
  typicalRoles: string[];
  location: string;
  careersUrl: string;
  notes?: string;
}

export const VERIFIED_COMPANY_HIRING_CONTACTS: CompanyHiringContact[] = '''

# Original base contacts to ensure Maersk, ABS, Stripe, Vercel, etc. stay exact
base_contacts = [
  {
    "id": "maersk-marine",
    "company": "Maersk",
    "category": "Maritime / Offshore",
    "contactEmail": "careers.marine@maersk.com",
    "typicalRoles": ["Engine Cadet", "Marine Systems Engineer", "Vessel Superintendent", "Electro-Technical Officer"],
    "location": "Rotterdam, Netherlands / Global Fleet",
    "careersUrl": "https://www.maersk.com/careers",
    "notes": "Direct crewing & cadetship intake for container fleet engine & bridge departments."
  },
  {
    "id": "abs-marine",
    "company": "American Bureau of Shipping (ABS)",
    "category": "Maritime / Offshore",
    "contactEmail": "recruiting@eagle.org",
    "typicalRoles": ["Naval Architect", "Marine Structural Engineer", "Class Surveyor", "Hydrodynamics Analyst"],
    "location": "Houston, TX / Global Offices",
    "careersUrl": "https://ww2.eagle.org/en/careers.html",
    "notes": "Direct technical bureau classification and marine structural engineering desk."
  },
  {
    "id": "chevron-shipping",
    "company": "Chevron Shipping",
    "category": "Maritime / Offshore",
    "contactEmail": "talent.acquisition@chevron.com",
    "typicalRoles": ["3rd Marine Engineer Officer", "Gas Cargo Engineer", "Marine Technical Specialist"],
    "location": "London, UK / Global Fleet",
    "careersUrl": "https://careers.chevron.com",
    "notes": "Commercial tanker, LNG carrier, and marine offshore talent desk."
  },
  {
    "id": "subsea7-marine",
    "company": "Subsea 7",
    "category": "Maritime / Offshore",
    "contactEmail": "careers.uk@subsea7.com",
    "typicalRoles": ["Subsea Systems Engineer", "Ocean Robotics Engineer", "Offshore Pipelay Specialist"],
    "location": "Aberdeen, UK",
    "careersUrl": "https://www.subsea7.com/en/careers.html",
    "notes": "Deepwater seabed robotics and dynamic positioning offshore vessels."
  },
  {
    "id": "sbm-offshore",
    "company": "SBM Offshore",
    "category": "Maritime / Offshore",
    "contactEmail": "careers@sbmoffshore.com",
    "typicalRoles": ["Marine Power Plants Specialist", "FPSO Mechanical Engineer", "Decarbonization Engineer"],
    "location": "Monaco / Global Offshore",
    "careersUrl": "https://www.sbmoffshore.com/careers",
    "notes": "Floating production systems & offshore renewable power plants."
  },
  {
    "id": "vard-marine",
    "company": "Vard Marine",
    "category": "Maritime / Offshore",
    "contactEmail": "careers@vardmarine.com",
    "typicalRoles": ["Vessel Technical Superintendent", "Naval Architect", "Hydrodynamics Analyst"],
    "location": "Vancouver, Canada",
    "careersUrl": "https://vardmarine.com/careers",
    "notes": "Specialized vessel design and naval architectural consultancy."
  },
  {
    "id": "vercel-cloud",
    "company": "Vercel",
    "category": "Software / Cloud",
    "contactEmail": "careers@vercel.com",
    "typicalRoles": ["Staff Frontend Systems Engineer", "Next.js Infrastructure Architect", "Edge Network Engineer"],
    "location": "San Francisco, CA / Remote",
    "careersUrl": "https://vercel.com/careers",
    "notes": "Frontend cloud infrastructure and high-throughput edge systems."
  },
  {
    "id": "stripe-payments",
    "company": "Stripe",
    "category": "Software / Cloud",
    "contactEmail": "recruiting@stripe.com",
    "typicalRoles": ["Payment Infrastructure Engineer", "Distributed Systems Specialist", "API Platform Engineer"],
    "location": "San Francisco, CA / Dublin, Ireland",
    "careersUrl": "https://stripe.com/jobs",
    "notes": "Global financial infrastructure and ultra-reliable settlement engines."
  },
  {
    "id": "cloudflare-edge",
    "company": "Cloudflare",
    "category": "Software / Cloud",
    "contactEmail": "jobs@cloudflare.com",
    "typicalRoles": ["Edge Compute Engineer", "Network Security Architect", "Systems Performance Engineer"],
    "location": "Austin, TX / London, UK",
    "careersUrl": "https://www.cloudflare.com/careers",
    "notes": "Global DNS, edge serverless workers, and distributed cyber resilience."
  },
  {
    "id": "anthropic-ai",
    "company": "Anthropic",
    "category": "AI / Robotics",
    "contactEmail": "talent@anthropic.com",
    "typicalRoles": ["AI Safety Systems Engineer", "RLHF Pipeline Architect", "LLM Alignment Lead"],
    "location": "San Francisco, CA",
    "careersUrl": "https://jobs.lever.co/anthropic",
    "notes": "Frontier AI safety research and frontier LLM architecture."
  },
  {
    "id": "xai-infra",
    "company": "xAI",
    "category": "AI / Robotics",
    "contactEmail": "careers@x.ai",
    "typicalRoles": ["Supercomputing Infrastructure Engineer", "Distributed Systems Engineer", "AI Research Engineer"],
    "location": "Palo Alto, CA / Memphis, TN",
    "careersUrl": "https://x.ai/careers",
    "notes": "Colossus cluster engineering and frontier multimodal AI."
  },
  {
    "id": "anduril-defense",
    "company": "Anduril Industries",
    "category": "AI / Robotics",
    "contactEmail": "recruiting@anduril.com",
    "typicalRoles": ["Autonomous Systems Engineer", "Robotics Software Engineer", "Firmware Engineer"],
    "location": "Costa Mesa, CA / Seattle, WA",
    "careersUrl": "https://www.anduril.com/careers",
    "notes": "Lattice OS and sovereign defense autonomous platforms."
  },
  {
    "id": "muon-space",
    "company": "Muon Space",
    "category": "Engineering / Industrial",
    "contactEmail": "jobs@muonspace.com",
    "typicalRoles": ["Environmental Test Engineering Intern", "Satellite Systems Engineer", "Hardware Co-op"],
    "location": "Mountain View, CA",
    "careersUrl": "https://www.muonspace.com/careers",
    "notes": "Earth monitoring satellite constellations and space hardware."
  },
  {
    "id": "wabtec-industrial",
    "company": "Wabtec",
    "category": "Engineering / Industrial",
    "contactEmail": "careers@wabtec.com",
    "typicalRoles": ["Manufacturing Engineering Co-op", "Transducer Systems Engineer", "Quality Engineer"],
    "location": "Waltham, MA / Pittsburgh, PA",
    "careersUrl": "https://www.wabteccorp.com/careers",
    "notes": "Locomotive propulsion, rail technology, and industrial transducers."
  },
  {
    "id": "siemens-healthineers",
    "company": "Siemens Healthineers",
    "category": "Medical / Healthcare",
    "contactEmail": "careers.healthcare@siemens-healthineers.com",
    "typicalRoles": ["Lead Healthcare Systems Engineer", "Medical Informatics Engineer", "Clinical Software Architect"],
    "location": "Erlangen, Germany / Remote",
    "careersUrl": "https://www.siemens-healthineers.com/careers",
    "notes": "Medical imaging AI, laboratory diagnostics, and clinical informatics systems."
  },
  {
    "id": "epic-systems",
    "company": "Epic Systems",
    "category": "Medical / Healthcare",
    "contactEmail": "careers@epic.com",
    "typicalRoles": ["Healthcare Software Developer", "Integration Engineer", "Clinical Systems Specialist"],
    "location": "Verona, WI / Hybrid",
    "careersUrl": "https://www.epic.com/careers",
    "notes": "Electronic health record (EHR) platforms and clinical interoperability."
  },
  {
    "id": "philips-healthcare",
    "company": "Philips Healthcare",
    "category": "Medical / Healthcare",
    "contactEmail": "talent.acquisition@philips.com",
    "typicalRoles": ["Clinical Informatics Architect", "Telehealth Systems Engineer", "Biomedical Software Lead"],
    "location": "Cambridge, MA / Hybrid",
    "careersUrl": "https://www.philips.com/a-w/careers/healthtech.html",
    "notes": "Patient monitoring telemetry, connected care devices, and healthcare informatics."
  },
  {
    "id": "illumina-genomics",
    "company": "Illumina",
    "category": "Medical / Healthcare",
    "contactEmail": "careers@illumina.com",
    "typicalRoles": ["Bioinformatics Software Engineer", "Genomic Informatics Lead", "Data Systems Specialist"],
    "location": "San Diego, CA / Hybrid",
    "careersUrl": "https://www.illumina.com/company/careers.html",
    "notes": "Genomic sequencing platforms, clinical informatics, and DNA variant pipelines."
  },
  {
    "id": "asml-operations",
    "company": "ASML",
    "category": "Management / Operations",
    "contactEmail": "careers@asml.com",
    "typicalRoles": ["Semiconductor Operations Lead", "Industrial Operations Manager", "Manufacturing Director"],
    "location": "Veldhoven, Netherlands / Wilton, CT",
    "careersUrl": "https://www.asml.com/en/careers",
    "notes": "Extreme ultraviolet (EUV) photolithography manufacturing and operations management."
  },
  {
    "id": "maersk-fleet-mgmt",
    "company": "Maersk Fleet Management",
    "category": "Management / Operations",
    "contactEmail": "fleet.operations@maersk.com",
    "typicalRoles": ["Global Fleet Operations Manager", "Vessel Superintendent", "Maritime Decarbonization Lead"],
    "location": "Rotterdam, Netherlands / Copenhagen, Denmark",
    "careersUrl": "https://www.maersk.com/careers",
    "notes": "Commercial container fleet superintendency, maritime logistics, and green corridor operations."
  }
]

combined = []
for c in base_contacts:
    seen_emails.add(c["contactEmail"].lower())
    combined.append(c)

for m in maritime_list:
    em = m["contactEmail"].lower()
    if em not in seen_emails:
        seen_emails.add(em)
        combined.append(m)

print(f"Total unified verified contacts: {len(combined)}")

with open('lib/company_directory.ts', 'w', encoding='utf-8') as f:
    f.write(header + json.dumps(combined, indent=2) + ';\n')

print("Updated lib/company_directory.ts successfully!")
