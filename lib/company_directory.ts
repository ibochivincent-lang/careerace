export interface CompanyHiringContact {
  id: string;
  company: string;
  category: 'Maritime / Offshore' | 'Software / Cloud' | 'AI / Robotics' | 'Engineering / Industrial' | 'Medical / Healthcare' | 'Management / Operations';
  contactEmail: string;
  typicalRoles: string[];
  location: string;
  careersUrl: string;
  notes?: string;
}

export const VERIFIED_COMPANY_HIRING_CONTACTS: CompanyHiringContact[] = [
  {
    id: 'maersk-marine',
    company: 'Maersk',
    category: 'Maritime / Offshore',
    contactEmail: 'careers.marine@maersk.com',
    typicalRoles: ['Engine Cadet', 'Marine Systems Engineer', 'Vessel Superintendent', 'Electro-Technical Officer'],
    location: 'Rotterdam, Netherlands / Global Fleet',
    careersUrl: 'https://www.maersk.com/careers',
    notes: 'Direct crewing & cadetship intake for container fleet engine & bridge departments.'
  },
  {
    id: 'abs-marine',
    company: 'American Bureau of Shipping (ABS)',
    category: 'Maritime / Offshore',
    contactEmail: 'recruiting@eagle.org',
    typicalRoles: ['Naval Architect', 'Marine Structural Engineer', 'Class Surveyor', 'Hydrodynamics Analyst'],
    location: 'Houston, TX / Global Offices',
    careersUrl: 'https://ww2.eagle.org/en/careers.html',
    notes: 'Direct technical bureau classification and marine structural engineering desk.'
  },
  {
    id: 'chevron-shipping',
    company: 'Chevron Shipping',
    category: 'Maritime / Offshore',
    contactEmail: 'talent.acquisition@chevron.com',
    typicalRoles: ['3rd Marine Engineer Officer', 'Gas Cargo Engineer', 'Marine Technical Specialist'],
    location: 'London, UK / Global Fleet',
    careersUrl: 'https://careers.chevron.com',
    notes: 'Commercial tanker, LNG carrier, and marine offshore talent desk.'
  },
  {
    id: 'subsea7-marine',
    company: 'Subsea 7',
    category: 'Maritime / Offshore',
    contactEmail: 'careers.uk@subsea7.com',
    typicalRoles: ['Subsea Systems Engineer', 'Ocean Robotics Engineer', 'Offshore Pipelay Specialist'],
    location: 'Aberdeen, UK',
    careersUrl: 'https://www.subsea7.com/en/careers.html',
    notes: 'Deepwater seabed robotics and dynamic positioning offshore vessels.'
  },
  {
    id: 'sbm-offshore',
    company: 'SBM Offshore',
    category: 'Maritime / Offshore',
    contactEmail: 'careers@sbmoffshore.com',
    typicalRoles: ['Marine Power Plants Specialist', 'FPSO Mechanical Engineer', 'Decarbonization Engineer'],
    location: 'Monaco / Global Offshore',
    careersUrl: 'https://www.sbmoffshore.com/careers',
    notes: 'Floating production systems & offshore renewable power plants.'
  },
  {
    id: 'vard-marine',
    company: 'Vard Marine',
    category: 'Maritime / Offshore',
    contactEmail: 'careers@vardmarine.com',
    typicalRoles: ['Vessel Technical Superintendent', 'Naval Architect', 'Hydrodynamics Analyst'],
    location: 'Vancouver, Canada',
    careersUrl: 'https://vardmarine.com/careers',
    notes: 'Specialized polar research vessel and ship design technical group.'
  },
  {
    id: 'stolt-tankers',
    company: 'Stolt Tankers',
    category: 'Maritime / Offshore',
    contactEmail: 'crewing@stolt.com',
    typicalRoles: ['Chief Marine Engineer', '2nd Marine Engineer', 'Chemical Tanker Cadet'],
    location: 'Rotterdam, Netherlands',
    careersUrl: 'https://www.stolt-nielsen.com/careers',
    notes: 'Specialized chemical tanker fleet crew recruitment.'
  },
  {
    id: 'siemens-energy-marine',
    company: 'Siemens Energy Marine',
    category: 'Maritime / Offshore',
    contactEmail: 'careers.marine@siemens-energy.com',
    typicalRoles: ['Marine Automation Engineer', 'Electric Propulsion Specialist', 'Power Management Engineer'],
    location: 'Oslo, Norway',
    careersUrl: 'https://www.siemens-energy.com/global/en/company/jobs.html',
    notes: 'BlueDrive electric vessel propulsion and integrated automation systems.'
  },
  {
    id: 'bourbon-offshore',
    company: 'Bourbon Offshore',
    category: 'Maritime / Offshore',
    contactEmail: 'recruitment@bourbonoffshore.com',
    typicalRoles: ['Graduate Marine Field Engineer', 'Trainee Dynamic Positioning Officer', 'Auxiliary Mechanic'],
    location: 'Port Harcourt, Nigeria / Marseille, France',
    careersUrl: 'https://www.bourbonoffshore.com/en/careers',
    notes: 'Offshore support vessel operations and marine cadet recruitment.'
  },
  {
    id: 'vercel-infra',
    company: 'Vercel',
    category: 'Software / Cloud',
    contactEmail: 'careers@vercel.com',
    typicalRoles: ['Full-Stack Developer', 'Frontend Engineer', 'Edge Infrastructure Engineer'],
    location: 'Remote Worldwide',
    careersUrl: 'https://vercel.com/careers',
    notes: 'Global developer experience, Next.js, and edge computing infrastructure.'
  },
  {
    id: 'stripe-infra',
    company: 'Stripe',
    category: 'Software / Cloud',
    contactEmail: 'recruiting@stripe.com',
    typicalRoles: ['Software Engineer', 'Backend Distributed Systems Engineer', 'API Platform Engineer'],
    location: 'Remote / San Francisco, CA / Dublin, Ireland',
    careersUrl: 'https://stripe.com/jobs',
    notes: 'Economic infrastructure and global payment networks.'
  },
  {
    id: 'affirm-tech',
    company: 'Affirm',
    category: 'Software / Cloud',
    contactEmail: 'universityrecruiting@affirm.com',
    typicalRoles: ['Software Engineer Intern', 'Backend Financial Systems Engineer', 'ML Engineer'],
    location: 'Remote, United States',
    careersUrl: 'https://www.affirm.com/careers',
    notes: 'Financial technology and high-availability ledger services.'
  },
  {
    id: 'mysten-labs',
    company: 'Mysten Labs (Walrus / Sui)',
    category: 'Software / Cloud',
    contactEmail: 'talent@mystenlabs.com',
    typicalRoles: ['Protocol Engineer', 'Distributed Storage Engineer', 'Full-Stack Developer'],
    location: 'Remote Worldwide',
    careersUrl: 'https://jobs.ashbyhq.com/mystenlabs',
    notes: 'Creators of Sui Network and Walrus decentralized storage protocol.'
  },
  {
    id: 'anthropic-ai',
    company: 'Anthropic',
    category: 'AI / Robotics',
    contactEmail: 'hiring@anthropic.com',
    typicalRoles: ['Research Engineer', 'Systems Engineer', 'Full-Stack Product Engineer'],
    location: 'San Francisco, CA / Remote',
    careersUrl: 'https://jobs.lever.co/anthropic',
    notes: 'Frontier AI safety research and Claude architecture.'
  },
  {
    id: 'xai-infra',
    company: 'xAI',
    category: 'AI / Robotics',
    contactEmail: 'careers@x.ai',
    typicalRoles: ['Supercomputing Infrastructure Engineer', 'Distributed Systems Engineer', 'AI Research Engineer'],
    location: 'Palo Alto, CA / Memphis, TN',
    careersUrl: 'https://x.ai/careers',
    notes: 'Colossus cluster engineering and frontier multimodal AI.'
  },
  {
    id: 'anduril-defense',
    company: 'Anduril Industries',
    category: 'AI / Robotics',
    contactEmail: 'recruiting@anduril.com',
    typicalRoles: ['Autonomous Systems Engineer', 'Robotics Software Engineer', 'Firmware Engineer'],
    location: 'Costa Mesa, CA / Seattle, WA',
    careersUrl: 'https://www.anduril.com/careers',
    notes: 'Lattice OS and sovereign defense autonomous platforms.'
  },
  {
    id: 'muon-space',
    company: 'Muon Space',
    category: 'Engineering / Industrial',
    contactEmail: 'jobs@muonspace.com',
    typicalRoles: ['Environmental Test Engineering Intern', 'Satellite Systems Engineer', 'Hardware Co-op'],
    location: 'Mountain View, CA',
    careersUrl: 'https://www.muonspace.com/careers',
    notes: 'Earth monitoring satellite constellations and space hardware.'
  },
  {
    id: 'wabtec-industrial',
    company: 'Wabtec',
    category: 'Engineering / Industrial',
    contactEmail: 'careers@wabtec.com',
    typicalRoles: ['Manufacturing Engineering Co-op', 'Transducer Systems Engineer', 'Quality Engineer'],
    location: 'Waltham, MA / Pittsburgh, PA',
    careersUrl: 'https://www.wabteccorp.com/careers',
    notes: 'Locomotive propulsion, rail technology, and industrial transducers.'
  },
  {
    id: 'siemens-healthineers',
    company: 'Siemens Healthineers',
    category: 'Medical / Healthcare',
    contactEmail: 'careers.healthcare@siemens-healthineers.com',
    typicalRoles: ['Lead Healthcare Systems Engineer', 'Medical Informatics Engineer', 'Clinical Software Architect'],
    location: 'Erlangen, Germany / Remote',
    careersUrl: 'https://www.siemens-healthineers.com/careers',
    notes: 'Medical imaging AI, laboratory diagnostics, and clinical informatics systems.'
  },
  {
    id: 'epic-systems',
    company: 'Epic Systems',
    category: 'Medical / Healthcare',
    contactEmail: 'careers@epic.com',
    typicalRoles: ['Healthcare Software Developer', 'Integration Engineer', 'Clinical Systems Specialist'],
    location: 'Verona, WI / Hybrid',
    careersUrl: 'https://www.epic.com/careers',
    notes: 'Electronic health record (EHR) platforms and clinical interoperability.'
  },
  {
    id: 'philips-healthcare',
    company: 'Philips Healthcare',
    category: 'Medical / Healthcare',
    contactEmail: 'talent.acquisition@philips.com',
    typicalRoles: ['Clinical Informatics Architect', 'Telehealth Systems Engineer', 'Biomedical Software Lead'],
    location: 'Cambridge, MA / Hybrid',
    careersUrl: 'https://www.philips.com/a-w/careers/healthtech.html',
    notes: 'Patient monitoring telemetry, connected care devices, and healthcare informatics.'
  },
  {
    id: 'illumina-genomics',
    company: 'Illumina',
    category: 'Medical / Healthcare',
    contactEmail: 'careers@illumina.com',
    typicalRoles: ['Bioinformatics Software Engineer', 'Genomic Informatics Lead', 'Data Systems Specialist'],
    location: 'San Diego, CA / Hybrid',
    careersUrl: 'https://www.illumina.com/company/careers.html',
    notes: 'Genomic sequencing platforms, clinical informatics, and DNA variant pipelines.'
  },
  {
    id: 'asml-operations',
    company: 'ASML',
    category: 'Management / Operations',
    contactEmail: 'careers@asml.com',
    typicalRoles: ['Semiconductor Operations Lead', 'Industrial Operations Manager', 'Manufacturing Director'],
    location: 'Veldhoven, Netherlands / Wilton, CT',
    careersUrl: 'https://www.asml.com/en/careers',
    notes: 'Extreme ultraviolet (EUV) photolithography manufacturing and operations management.'
  },
  {
    id: 'maersk-fleet-mgmt',
    company: 'Maersk Fleet Management',
    category: 'Management / Operations',
    contactEmail: 'fleet.operations@maersk.com',
    typicalRoles: ['Global Fleet Operations Manager', 'Vessel Superintendent', 'Maritime Decarbonization Lead'],
    location: 'Rotterdam, Netherlands / Copenhagen, Denmark',
    careersUrl: 'https://www.maersk.com/careers',
    notes: 'Commercial container fleet superintendency, maritime logistics, and green corridor operations.'
  }
];
