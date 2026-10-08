/**
 * Career Path Advisory Engine (FN-06 & FN-07)
 * Evaluates career trajectory, identifies skill gaps for higher tiers,
 * generates 6-to-12 month milestone roadmaps, and provides compensation benchmarks.
 * Grounded in verified industry standards across Software, Maritime, Healthcare, and AI.
 */

export interface SkillGapItem {
  skill: string;
  category: 'core' | 'architecture' | 'leadership' | 'certification';
  urgency: 'high' | 'medium' | 'growth';
  recommendedAction: string;
}

export interface RoadmapMilestone {
  quarter: string;
  focus: string;
  deliverables: string[];
  keyCompetencies: string[];
}

export interface CompensationBenchmark {
  roleTitle: string;
  tier: 'Entry' | 'Mid' | 'Senior' | 'Staff/Lead' | 'Executive' | 'Cadet / Entry' | 'Junior' | 'Mid-Level';
  baseRangeUSD: [number, number];
  dayRateMaritimeUSD?: [number, number];
  maritimeMonthlyStipendUSD?: [number, number];
  marketTrend: 'High Growth' | 'Stable High Demand' | 'Critical Shortage';
}

export interface CareerRank {
  id: string;
  title: string;
  tier: 'Cadet / Entry' | 'Junior' | 'Mid-Level' | 'Senior' | 'Lead / Chief' | 'Executive';
  levelOrder: number;
  requiredCompetencies: string[];
  certifications: string[];
  typicalTimeline: string;
}

export interface CareerPathwayOption {
  title: string;
  type: 'Upward Promotion' | 'Lateral Specialization' | 'Executive Transition';
  description: string;
  prerequisites: string;
}

export interface CareerRoadmapAnalysis {
  currentRole: string;
  targetRole: string;
  currentTier: string;
  targetTier: string;
  skillGaps: SkillGapItem[];
  roadmap: RoadmapMilestone[];
  compensation: CompensationBenchmark;
  advancementAdvice: string[];
  careerLadder?: CareerRank[];
  alternativePathways?: CareerPathwayOption[];
  targetRank?: CareerRank;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6 VERIFIED DISCIPLINE LADDERS & INDUSTRY COMPETENCIES
// ─────────────────────────────────────────────────────────────────────────────
export const DISCIPLINE_CAREER_LADDERS: Record<string, {
  label: string;
  category: string;
  marketTrend: 'High Growth' | 'Stable High Demand' | 'Critical Shortage';
  ranks: CareerRank[];
  lateralPathways: CareerPathwayOption[];
}> = {
  maritime: {
    label: 'Maritime & Marine Engineering',
    category: 'Maritime / Offshore',
    marketTrend: 'Critical Shortage',
    ranks: [
      {
        id: 'mar_wiper',
        title: 'Wiper / Engine Rating',
        tier: 'Cadet / Entry',
        levelOrder: 1,
        requiredCompetencies: ['Engine Room Housekeeping', 'Bilge Cleaning', 'Bunkering Assistance', 'Basic Safety at Sea'],
        certifications: ['STCW Basic Safety Training (BST / VI/1)', 'ENG1 Medical Clearance', 'Seaman Book / CDC'],
        typicalTimeline: '6 - 12 Months Sea Time',
      },
      {
        id: 'mar_oiler',
        title: 'Oiler / Motorman',
        tier: 'Junior',
        levelOrder: 2,
        requiredCompetencies: ['Lubrication & Purifier Monitoring', 'Auxiliary Machinery Rounds', 'Centrifugal Pump Maintenance', 'Engine Watch Support'],
        certifications: ['STCW III/4 Rating Forming Part of an Engineering Watch', 'ENG1 Medical Clearance', 'Seaman Book / CDC'],
        typicalTimeline: '12 - 24 Months in Rank',
      },
      {
        id: 'mar_ab',
        title: 'Able Seaman (AB) / Deck Rating',
        tier: 'Junior',
        levelOrder: 2,
        requiredCompetencies: ['Deck Watchkeeping', 'Mooring & Cargo Operations', 'Steering & Helmsman Duty', 'Safety Equipment Maintenance'],
        certifications: ['STCW II/5 Able Seafarer Deck', 'PSCRB Survival Craft', 'ENG1 Medical Clearance'],
        typicalTimeline: '12 - 24 Months in Rank',
      },
      {
        id: 'mar_cadet',
        title: 'Engine Cadet / Trainee Marine Engineer',
        tier: 'Cadet / Entry',
        levelOrder: 1,
        requiredCompetencies: ['STCW Watchkeeping', 'Engine Room Logbook', 'Centrifugal Pumps & Purifiers', 'Basic Safety Training (BST)'],
        certifications: ['STCW Basic Safety (VI/1)', 'ENG1 Medical Clearance', 'Seaman Book / CDC'],
        typicalTimeline: '12 - 18 Months Sea Time',
      },
      {
        id: 'mar_4th_eng',
        title: '4th Marine Engineer Officer',
        tier: 'Junior',
        levelOrder: 3,
        requiredCompetencies: ['Auxiliary Boilers & Feedwater', 'Fuel Oil Transfer & Separators', 'Bilge & Ballast Systems', 'Compressors & Evaporators'],
        certifications: ['STCW III/1 Officer in Charge of Engineering Watch (OICEW)', 'Proficiency in Survival Craft (PSCRB)'],
        typicalTimeline: '12 - 24 Months in Rank',
      },
      {
        id: 'mar_3rd_eng',
        title: '3rd Marine Engineer Officer',
        tier: 'Mid-Level',
        levelOrder: 4,
        requiredCompetencies: ['Auxiliary Diesel Generators', 'Air Conditioning & Refrigeration', 'Freshwater Generators', 'Planned Maintenance Systems (PMS)'],
        certifications: ['STCW III/1 Advanced Endorsement', 'High Voltage Marine Power Certification (HV-Marine)'],
        typicalTimeline: '18 - 36 Months in Rank',
      },
      {
        id: 'mar_2nd_eng',
        title: '2nd Marine Engineer Officer (First Assistant)',
        tier: 'Senior',
        levelOrder: 5,
        requiredCompetencies: ['2-Stroke & 4-Stroke Main Propulsion Overhaul', 'Fuel Bunkering & Centrifuges', 'MARPOL Annex VI & SOLAS Protocols', 'Crew Task Allocation & Engine Safety'],
        certifications: ['STCW III/2 Second Engineer (Unlimited Power)', 'Advanced Fire Fighting (VI/3)', 'Medical First Aid (VI/4)'],
        typicalTimeline: '24 - 48 Months in Rank',
      },
      {
        id: 'mar_chief_eng',
        title: 'Chief Marine Engineer (STCW III/2)',
        tier: 'Lead / Chief',
        levelOrder: 6,
        requiredCompetencies: ['Chief Engineer License Management', 'Thermal Efficiency Optimization', 'Drydock & Class Renewal Supervision', 'OPEX & Fuel Budget Control', 'Flag State & Port State Control Compliance'],
        certifications: ['STCW III/2 Chief Engineer (Unlimited kW)', 'Ship Security Officer (SSO / VI/5)', 'ERM Engine Resource Management'],
        typicalTimeline: '5+ Years Senior Engineering Experience',
      },
    ],
    lateralPathways: [
      {
        title: 'Vessel Technical Superintendent',
        type: 'Upward Promotion',
        description: 'Transition from sea to shore-based fleet management supervising technical operations, drydockings, and class surveys for multiple vessels.',
        prerequisites: 'Sea time as Chief or 2nd Engineer + Class bureau survey experience',
      },
      {
        title: 'Dynamic Positioning (DP) Technical Specialist',
        type: 'Lateral Specialization',
        description: 'Specialize in offshore DP-2/DP-3 drillships, diving support vessels, and pipelay barges with premium day-rate compensation.',
        prerequisites: 'DP Maintenance certification + Offshore High Voltage experience',
      },
      {
        title: 'Classification Society Surveyor (DNV / ABS / Lloyd’s)',
        type: 'Lateral Specialization',
        description: 'Conduct statutory flag state surveys, newbuild inspections, and incident investigations for premier global classification bureaus.',
        prerequisites: 'Chief Engineer CoC or Naval Architecture degree',
      },
    ],
  },

  software: {
    label: 'Software, Cloud & DevOps',
    category: 'Software / Cloud',
    marketTrend: 'Stable High Demand',
    ranks: [
      {
        id: 'soft_junior',
        title: 'Junior Software Engineer',
        tier: 'Cadet / Entry',
        levelOrder: 1,
        requiredCompetencies: ['JavaScript / TypeScript', 'React / Next.js Basics', 'SQL / PostgreSQL Queries', 'Git Version Control & PR Workflows'],
        certifications: ['AWS Certified Cloud Practitioner', 'GitHub Actions Fundamentals'],
        typicalTimeline: '1 - 2 Years',
      },
      {
        id: 'soft_mid',
        title: 'Full Stack Software Engineer',
        tier: 'Mid-Level',
        levelOrder: 2,
        requiredCompetencies: ['TypeScript & Node.js', 'PostgreSQL & Schema Optimization', 'REST & GraphQL APIs', 'Docker Containerization', 'Automated Unit & E2E Testing'],
        certifications: ['AWS Certified Solutions Architect Associate', 'Docker Certified Associate'],
        typicalTimeline: '2 - 4 Years',
      },
      {
        id: 'soft_senior',
        title: 'Senior Cloud & Distributed Systems Engineer',
        tier: 'Senior',
        levelOrder: 3,
        requiredCompetencies: ['Distributed Systems Architecture', 'Kubernetes (K8s) Cluster Orchestration', 'Microservices Reliability & SRE', 'Redis In-Memory Caching', 'High-Throughput Concurrency'],
        certifications: ['CKA (Certified Kubernetes Administrator)', 'AWS Solutions Architect Professional'],
        typicalTimeline: '4 - 7 Years',
      },
      {
        id: 'soft_staff',
        title: 'Staff / Lead Solutions Architect',
        tier: 'Lead / Chief',
        levelOrder: 4,
        requiredCompetencies: ['Multi-Region Cloud Topology', 'Cross-Functional Architecture Direction', 'Disaster Recovery & 99.99% SLA Delivery', 'SOC2 / ISO 27001 Engineering Governance', 'Cost Optimization (FinOps)'],
        certifications: ['Google Cloud Certified Fellow', 'TOGAF Enterprise Architecture'],
        typicalTimeline: '7 - 10+ Years',
      },
      {
        id: 'soft_principal',
        title: 'Principal Engineer / VP of Engineering',
        tier: 'Executive',
        levelOrder: 5,
        requiredCompetencies: ['Enterprise Technology Strategy', 'Organization-Wide Engineering Standards', 'High-Stakes Vendor & M&A Due Diligence', 'Executive Stakeholder Alignment'],
        certifications: ['Executive Leadership & Systems Strategy'],
        typicalTimeline: '10+ Years',
      },
    ],
    lateralPathways: [
      {
        title: 'Cloud Infrastructure & SRE Specialist',
        type: 'Lateral Specialization',
        description: 'Focus strictly on cloud networking, zero-downtime deployments, Terraform IAC, and incident response pipelines.',
        prerequisites: 'Strong Linux, Kubernetes, and Observability background',
      },
      {
        title: 'Engineering Manager / Director',
        type: 'Upward Promotion',
        description: 'Shift from hands-on architecture to people leadership, team hiring, engineering velocity, and career growth mentoring.',
        prerequisites: 'Senior+ experience with proven cross-functional leadership',
      },
      {
        title: 'Developer Platform Architect',
        type: 'Lateral Specialization',
        description: 'Build internal developer platforms (IDP), CLI tools, SDKs, and build system optimization for hundreds of engineers.',
        prerequisites: 'Deep developer tooling and CI/CD compiler/bundler experience',
      },
    ],
  },

  ai_robotics: {
    label: 'AI, Machine Learning & Robotics',
    category: 'AI / Robotics',
    marketTrend: 'High Growth',
    ranks: [
      {
        id: 'ai_associate',
        title: 'Associate ML / Data Engineer',
        tier: 'Cadet / Entry',
        levelOrder: 1,
        requiredCompetencies: ['Python & NumPy / Pandas', 'PyTorch Basics', 'Data Ingestion & Feature Pipelines', 'Basic Vector Database Indexing'],
        certifications: ['DeepLearning.AI TensorFlow / PyTorch Specialization', 'AWS Machine Learning Specialty'],
        typicalTimeline: '1 - 2 Years',
      },
      {
        id: 'ai_engineer',
        title: 'Machine Learning & Computer Vision Engineer',
        tier: 'Mid-Level',
        levelOrder: 2,
        requiredCompetencies: ['PyTorch Deep Learning', 'Computer Vision (OpenCV / YOLO / Segment Anything)', 'Model Fine-Tuning & Quantization', 'TensorRT & ONNX Runtime Serving', 'Vector Search & RAG Architectures'],
        certifications: ['NVIDIA Certified Associate Generative AI', 'CUDA Parallel Programming'],
        typicalTimeline: '2 - 4 Years',
      },
      {
        id: 'ai_senior_robotics',
        title: 'Senior Autonomous Systems & Robotics Engineer',
        tier: 'Senior',
        levelOrder: 3,
        requiredCompetencies: ['ROS / ROS2 Robot Middleware', 'Sensor Fusion (LiDAR, RADAR, IMU, Cameras)', 'Sim-to-Real Controls & Gazebo/Isaac Sim', 'Autonomous Navigation & SLAM Algorithms', 'Real-Time Embedded C++ Execution'],
        certifications: ['Robotics Operating System (ROS2) Developer Certificate', 'NVIDIA Isaac Robotics Architect'],
        typicalTimeline: '4 - 7 Years',
      },
      {
        id: 'ai_lead_architect',
        title: 'Lead Autonomous Systems & AI Architect',
        tier: 'Lead / Chief',
        levelOrder: 4,
        requiredCompetencies: ['Foundation Model Pre-Training & Distillation', 'Distributed Multi-GPU Cluster Architecture (Slurm / RoCE)', 'Autonomous Fleet Safety Validation', 'Real-Time Edge Low-Latency Pipeline Design', 'Multi-Agent Autonomous Orchestration'],
        certifications: ['Lead AI Researcher / Principal Architect Credentials'],
        typicalTimeline: '7 - 10+ Years',
      },
      {
        id: 'ai_head_director',
        title: 'Head of AI / Autonomous Systems Director',
        tier: 'Executive',
        levelOrder: 5,
        requiredCompetencies: ['AI Research Vision & Hardware Co-Design', 'Safety & Regulatory Standards (ISO 26262 / AI Ethics)', 'Venture & Commercial Autonomy Deployment', 'Enterprise Compute Sourcing & Cluster CapEx'],
        certifications: ['Executive AI Governance & Technology Leadership'],
        typicalTimeline: '10+ Years',
      },
    ],
    lateralPathways: [
      {
        title: 'CUDA Kernel & Hardware Acceleration Specialist',
        type: 'Lateral Specialization',
        description: 'Write custom C++/CUDA kernels, optimize memory bandwidth, and accelerate transformer training and inference for frontier labs.',
        prerequisites: 'Deep C++, GPU microarchitecture, and Triton experience',
      },
      {
        title: 'Autonomous Marine & Ocean Drone Architect',
        type: 'Lateral Specialization',
        description: 'Deploy uncrewed surface vessels (USVs) and subsea autonomous drones with hydrodynamic telemetry and satellite navigation.',
        prerequisites: 'Marine systems understanding + ROS2 / sensor fusion',
      },
      {
        title: 'Humanoid Mechatronics Controls Lead',
        type: 'Lateral Specialization',
        description: 'Lead physical teleoperation, whole-body trajectory control, and dexterous manipulation for next-gen bipedal robotics.',
        prerequisites: 'Deep reinforcement learning + Mechatronics controls background',
      },
    ],
  },

  healthcare: {
    label: 'Healthcare & Clinical Informatics',
    category: 'Medical / Healthcare',
    marketTrend: 'Stable High Demand',
    ranks: [
      {
        id: 'health_analyst',
        title: 'Clinical Data Analyst / Informatics Associate',
        tier: 'Cadet / Entry',
        levelOrder: 1,
        requiredCompetencies: ['Clinical Data Entry & Workflows', 'EHR/EMR Systems Basics (Epic / Cerner)', 'HIPAA Privacy Fundamentals', 'Medical Terminology & ICD-10 / CPT'],
        certifications: ['CAHIMS (Certified Associate in Healthcare Information & Management Systems)', 'HIPAA Compliance Certification'],
        typicalTimeline: '1 - 2 Years',
      },
      {
        id: 'health_specialist',
        title: 'Clinical Informatics Specialist',
        tier: 'Mid-Level',
        levelOrder: 2,
        requiredCompetencies: ['HL7 v2 Message Parsing', 'FHIR API Endpoints & Resources', 'Clinical Decision Support (CDSS)', 'EHR Custom Template & Order Set Design', 'SNOMED-CT & LOINC Semantic Mapping'],
        certifications: ['CPHIMS (Certified Professional in Healthcare Information & Management Systems)', 'Epic Certified Cogito / Bridges Analyst'],
        typicalTimeline: '2 - 5 Years',
      },
      {
        id: 'health_senior_eng',
        title: 'Senior Healthcare Systems & FHIR Integration Engineer',
        tier: 'Senior',
        levelOrder: 3,
        requiredCompetencies: ['SMART on FHIR Application Development', 'DICOM Medical Imaging Pipeline Integration', 'Hospital Interoperability Engine Management (Mirth / Rhapsody)', 'Healthcare Cloud Security (HITRUST / HIPAA)', 'Remote Patient Telemetry Architectures'],
        certifications: ['HL7 FHIR Certified Implementer', 'AWS Certified Healthcare Data Specialty'],
        typicalTimeline: '5 - 8 Years',
      },
      {
        id: 'health_lead_architect',
        title: 'Lead Health Informatics Architect & Compliance Officer',
        tier: 'Lead / Chief',
        levelOrder: 4,
        requiredCompetencies: ['Enterprise Health Information Exchange (HIE) Architecture', 'Clinical Governance & Medical Informatics Leadership', 'Medical Device Software Regulatory Clearance (FDA 510k / SaMD)', 'Hospital-Wide Telehealth Infrastructure'],
        certifications: ['Fellow of AMIA (FAMIA)', 'Certified Healthcare Information Security Leader (CHISL)'],
        typicalTimeline: '8 - 12 Years',
      },
      {
        id: 'health_cmio',
        title: 'Chief Medical Information Officer (CMIO) / Health Tech Director',
        tier: 'Executive',
        levelOrder: 5,
        requiredCompetencies: ['Clinical Transformation & Executive Health Leadership', 'Hospital Clinical Software Budget & Vendor Contracting', 'Patient Care Quality Analytics & Joint Commission Standards'],
        certifications: ['Board Certification in Clinical Informatics (ABPM / ABPath)'],
        typicalTimeline: '12+ Years',
      },
    ],
    lateralPathways: [
      {
        title: 'Medical AI & Diagnostic Algorithm Lead',
        type: 'Lateral Specialization',
        description: 'Train and validate FDA-regulated computer vision algorithms on DICOM MRI, CT, and X-ray clinical datasets.',
        prerequisites: 'DICOM knowledge + PyTorch medical imaging experience',
      },
      {
        title: 'Healthcare Cybersecurity & HITRUST Auditor',
        type: 'Lateral Specialization',
        description: 'Protect hospital networks and connected medical IoT devices against ransomware attacks and unauthorized PHI leaks.',
        prerequisites: 'HIPAA/HITRUST compliance expertise + Network security',
      },
    ],
  },

  marine_ops: {
    label: 'Fleet Operations & Marine Management',
    category: 'Management / Operations',
    marketTrend: 'Critical Shortage',
    ranks: [
      {
        id: 'ops_coordinator',
        title: 'Junior Crewing & Marine Operations Coordinator',
        tier: 'Cadet / Entry',
        levelOrder: 1,
        requiredCompetencies: ['Crew Matrix Compliance (STCW)', 'Port Agency Liaison & Vessel Clearance', 'Bunker Delivery Tracking', 'Marine Document Verification'],
        certifications: ['Institute of Chartered Shipbrokers (ICS) Foundation', 'BIMCO Maritime Documents Certificate'],
        typicalTimeline: '1 - 2 Years',
      },
      {
        id: 'ops_specialist',
        title: 'Vessel Operations & Performance Specialist',
        tier: 'Mid-Level',
        levelOrder: 2,
        requiredCompetencies: ['Voyage Performance Optimization & Speed/Consumption Warranties', 'ISM & ISPS Safety Code Auditing', 'Flag State Inspections Follow-up', 'Port State Control (PSC) Defect Rectification'],
        certifications: ['Internal Auditor ISM-ISPS-MLC (DNV / Lloyd’s)', 'Marine Accident Investigation Fundamentals'],
        typicalTimeline: '2 - 4 Years',
      },
      {
        id: 'ops_superintendent',
        title: 'Fleet Technical Superintendent',
        tier: 'Senior',
        levelOrder: 3,
        requiredCompetencies: ['Vessel OPEX Budgeting & Planned Maintenance Oversight', 'Drydocking Specification, Tendering & Yard Supervision', 'Class Society Survey Renewals (DNV, ABS, ClassNK)', 'Root Cause Analysis (RCA) on Machinery Breakdowns', 'SIRE 2.0 & RightShip Vetting Inspection Readiness'],
        certifications: ['Designated Person Ashore (DPA / IMO MSC/Circ.1071)', 'Superintendent Development Certificate (DNV / Lloyd’s Maritime Academy)'],
        typicalTimeline: '4 - 8 Years',
      },
      {
        id: 'ops_senior_supt',
        title: 'Senior Marine Superintendent & Vetting Manager',
        tier: 'Lead / Chief',
        levelOrder: 4,
        requiredCompetencies: ['Commercial Oil Major / Charterer Vetting Approval', 'Fleet Crisis Management & Emergency Response Team (ERT) Leader', 'Decarbonization & CII (Carbon Intensity Indicator) Strategy', 'Regulatory Compliance with IMO MEPC Guidelines'],
        certifications: ['Company Security Officer (CSO)', 'Lead Maritime Auditor ISO 9001/14001/45001'],
        typicalTimeline: '8 - 12 Years',
      },
      {
        id: 'ops_director',
        title: 'Global Fleet Operations Director & General Manager',
        tier: 'Executive',
        levelOrder: 5,
        requiredCompetencies: ['Global Shipmanagement Fleet Strategy (50+ Vessels)', 'Newbuilding Contract Supervision & Shipyard Negotiations', 'Commercial Marine Insurance & P&I Club Negotiations', 'Executive P&L Accountability'],
        certifications: ['Master in Maritime Affairs / MBA Shipmanagement'],
        typicalTimeline: '12+ Years',
      },
    ],
    lateralPathways: [
      {
        title: 'Maritime Decarbonization & CII Regulatory Specialist',
        type: 'Lateral Specialization',
        description: 'Advise shipowners on alternative fuels (LNG, Methanol, Ammonia), wind-assisted propulsion, and EU-ETS carbon emissions compliance.',
        prerequisites: 'Superintendent or Chief Engineer experience with environmental regulations',
      },
      {
        title: 'Drydock Project Manager & Marine Consultant',
        type: 'Lateral Specialization',
        description: 'Manage multi-million dollar drydock refits in global shipyards (Singapore, Dubai, China) as an independent owner representative.',
        prerequisites: 'Extensive shipyard refit and hull/machinery contract experience',
      },
      {
        title: 'Marine Risk & P&I Club Claims Assessor',
        type: 'Lateral Specialization',
        description: 'Investigate major collisions, pollution incidents, and engine room failures for international mutual insurance clubs.',
        prerequisites: 'Master Mariner or Chief Engineer background + Maritime law understanding',
      },
    ],
  },

  cybersecurity: {
    label: 'Cybersecurity & InfoSec',
    category: 'Cybersecurity',
    marketTrend: 'Critical Shortage',
    ranks: [
      {
        id: 'sec_analyst',
        title: 'Associate SOC Analyst / Security Technician',
        tier: 'Cadet / Entry',
        levelOrder: 1,
        requiredCompetencies: ['SIEM Alert Triage (Splunk, Sentinel)', 'Network Protocols & Packet Capture (Wireshark)', 'Basic Vulnerability Scanning (Nessus)', 'Antivirus & EDR Endpoint Health'],
        certifications: ['CompTIA Security+', 'CompTIA CySA+ (Cybersecurity Analyst)'],
        typicalTimeline: '1 - 2 Years',
      },
      {
        id: 'sec_engineer',
        title: 'Cybersecurity & Incident Response Engineer',
        tier: 'Mid-Level',
        levelOrder: 2,
        requiredCompetencies: ['Incident Response Runbooks & Threat Containment', 'Firewall Rules & Network Segmentation', 'Identity & Access Management (IAM / Okta / Azure AD)', 'OWASP Top 10 Web Application Security', 'Python & Bash Automation for SecOps'],
        certifications: ['GIAC Certified Incident Handler (GCIH)', 'Certified Ethical Hacker (CEH)'],
        typicalTimeline: '2 - 5 Years',
      },
      {
        id: 'sec_senior',
        title: 'Senior Penetration Tester & Cloud Security Engineer',
        tier: 'Senior',
        levelOrder: 3,
        requiredCompetencies: ['Cloud Security Posture Management (CSPM - AWS, GCP, Azure)', 'Zero Trust Network Architecture (ZTNA)', 'Offensive Red Teaming & Active Directory Exploitation', 'Applied Cryptography & Key Management (HSM / KMS)', 'Container & Kubernetes Cluster Hardening'],
        certifications: ['OSCP (Offensive Security Certified Professional)', 'CISSP (Certified Information Systems Security Professional)', 'AWS Certified Security Specialty'],
        typicalTimeline: '5 - 8 Years',
      },
      {
        id: 'sec_lead_architect',
        title: 'Lead Security Architect & Compliance Director',
        tier: 'Lead / Chief',
        levelOrder: 4,
        requiredCompetencies: ['Enterprise Threat Modeling & Attack Surface Reduction', 'ISO 27001, SOC 2 Type II & NIST Cybersecurity Framework Implementation', 'DevSecOps CI/CD Pipeline Gatekeeping', 'Zero-Knowledge Proof & Sovereign Cryptographic Architectures', 'Third-Party Vendor Risk Governance'],
        certifications: ['CCSP (Certified Cloud Security Professional)', 'CISM (Certified Information Security Manager)', 'SABSA Enterprise Security Architect'],
        typicalTimeline: '8 - 12 Years',
      },
      {
        id: 'sec_ciso',
        title: 'Chief Information Security Officer (CISO) / VP Security',
        tier: 'Executive',
        levelOrder: 5,
        requiredCompetencies: ['Board-Level Cyber Risk Presentation', 'Enterprise Security Budget & Insurability', 'National Regulatory & SEC Incident Reporting Compliance', 'Global Security Operations Command'],
        certifications: ['Certified Information Security Manager (CISM)', 'Executive Cybersecurity Governance'],
        typicalTimeline: '12+ Years',
      },
    ],
    lateralPathways: [
      {
        title: 'Sovereign Cryptography & ZK-Identity Engineer',
        type: 'Lateral Specialization',
        description: 'Design zero-knowledge attestation systems, decentralized PKI, and threshold cryptographic vaults (e.g. Walrus / Sui seal).',
        prerequisites: 'Strong mathematical background, Rust, and modern cryptography',
      },
      {
        title: 'Maritime Cyber-Safety Specialist (IMO MSC.428)',
        type: 'Lateral Specialization',
        description: 'Secure operational technology (OT) aboard commercial vessels, including ECDIS, bridge networks, and satellite VSAT terminals against maritime cyber attacks.',
        prerequisites: 'OT / SCADA security understanding + Marine electronics background',
      },
      {
        title: 'Red Team Operations Lead',
        type: 'Lateral Specialization',
        description: 'Lead covert adversary simulations, social engineering, and evasion tactics against enterprise physical and logical perimeters.',
        prerequisites: 'OSCE / OSEP / CRTO certifications with offensive exploitation track record',
      },
    ],
  },
};

// Backwards compatibility dictionary
const ROLE_TIER_COMPETENCIES: Record<string, {
  midSkills: string[];
  seniorSkills: string[];
  leadSkills: string[];
  compensation: {
    entry: [number, number];
    mid: [number, number];
    senior: [number, number];
    lead: [number, number];
  };
}> = {
  software: {
    midSkills: ['TypeScript', 'React & Next.js', 'Node.js', 'PostgreSQL', 'REST & GraphQL APIs', 'Docker', 'Git'],
    seniorSkills: ['Distributed Systems Architecture', 'Cloud Architecture (AWS / GCP)', 'Kubernetes Orchestration', 'Redis In-Memory Caching', 'CI/CD Pipelines', 'Performance Optimization'],
    leadSkills: ['Engineering Leadership', 'Cross-Functional Strategy', 'Microservices Orchestration', 'Disaster Recovery', 'Security & Compliance (SOC2)'],
    compensation: {
      entry: [80000, 105000],
      mid: [110000, 145000],
      senior: [150000, 195000],
      lead: [200000, 260000],
    },
  },
  marine: {
    midSkills: ['STCW Watchkeeping', 'Engine Room Logbook', 'Centrifugal Pumps', 'Auxiliary Boilers', 'Fuel Testing'],
    seniorSkills: ['2-Stroke & 4-Stroke Propulsion', 'Planned Maintenance Systems (PMS)', 'MARPOL Annex VI', 'SOLAS Compliance', 'Dual-Fuel LNG'],
    leadSkills: ['Chief Engineer License (STCW III/2)', 'Drydock Supervision', 'Vessel Superintendent', 'Class Society Survey Renewals', 'Charter Party Management'],
    compensation: {
      entry: [60000, 85000],
      mid: [90000, 120000],
      senior: [130000, 170000],
      lead: [175000, 240000],
    },
  },
  maritime: {
    midSkills: ['STCW Watchkeeping', 'Engine Room Logbook', 'Centrifugal Pumps', 'Auxiliary Boilers', 'Fuel Testing'],
    seniorSkills: ['2-Stroke & 4-Stroke Propulsion', 'Planned Maintenance Systems (PMS)', 'MARPOL Annex VI', 'SOLAS Compliance', 'Dual-Fuel LNG'],
    leadSkills: ['Chief Engineer License (STCW III/2)', 'Drydock Supervision', 'Vessel Superintendent', 'Class Society Survey Renewals', 'Charter Party Management'],
    compensation: {
      entry: [60000, 85000],
      mid: [90000, 120000],
      senior: [130000, 170000],
      lead: [175000, 240000],
    },
  },
  ai: {
    midSkills: ['Python', 'PyTorch', 'Data Pipelines', 'Fine-Tuning', 'Vector Databases', 'Computer Vision (OpenCV / YOLO)'],
    seniorSkills: ['ROS / ROS2', 'Sensor Fusion (LiDAR / RADAR)', 'Autonomous Agent Architecture', 'Model Quantization', 'Distributed Training', 'Evaluation Harnesses'],
    leadSkills: ['Autonomous Systems Architecture', 'Foundation Robotics Infrastructure', 'Real-Time Edge Controls', 'RAG Infra at Scale', 'AI Ethics & Alignment'],
    compensation: {
      entry: [95000, 125000],
      mid: [130000, 175000],
      senior: [180000, 245000],
      lead: [250000, 350000],
    },
  },
  ai_robotics: {
    midSkills: ['Python', 'PyTorch', 'Data Pipelines', 'Fine-Tuning', 'Vector Databases', 'Computer Vision (OpenCV / YOLO)'],
    seniorSkills: ['ROS / ROS2', 'Sensor Fusion (LiDAR / RADAR)', 'Autonomous Agent Architecture', 'Model Quantization', 'Distributed Training', 'Evaluation Harnesses'],
    leadSkills: ['Autonomous Systems Architecture', 'Foundation Robotics Infrastructure', 'Real-Time Edge Controls', 'RAG Infra at Scale', 'AI Ethics & Alignment'],
    compensation: {
      entry: [95000, 125000],
      mid: [130000, 175000],
      senior: [180000, 245000],
      lead: [250000, 350000],
    },
  },
  healthcare: {
    midSkills: ['Clinical Data Entry', 'EHR Systems (Epic, Cerner)', 'HIPAA Basics', 'Medical Terminology', 'Patient Telemetry', 'HL7 v2 Message Parsing'],
    seniorSkills: ['HL7 / FHIR Protocols', 'Clinical Informatics Architecture', 'Epic / Cerner Integration', 'DICOM Image Pipelines', 'Diagnostic Analytics', 'SNOMED-CT Mapping'],
    leadSkills: ['Chief Medical Information Officer', 'Clinical Systems Director', 'Enterprise Health Informatics', 'Hospital Information Security', 'Regulatory Clearance (FDA)'],
    compensation: {
      entry: [75000, 95000],
      mid: [100000, 130000],
      senior: [140000, 185000],
      lead: [190000, 260000],
    },
  },
  marine_ops: {
    midSkills: ['ISM & ISPS Code Management', 'Voyage Performance Tracking', 'Bunker Consumption Monitoring', 'Crew Matrix Compliance', 'Port State Control Preparation'],
    seniorSkills: ['Fleet Technical Superintendent', 'Class Bureau Surveys (DNV, ABS, Lloyd’s)', 'Drydocking Specification & Supervision', 'Vessel OPEX Budgeting', 'SIRE 2.0 & RightShip Vetting'],
    leadSkills: ['Global Fleet Operations Management', 'Maritime Decarbonization & CII Strategy', 'Newbuild Project Management', 'Fleet Emergency Response Leader', 'Commercial P&L Direction'],
    compensation: {
      entry: [70000, 95000],
      mid: [105000, 135000],
      senior: [145000, 190000],
      lead: [195000, 265000],
    },
  },
  cybersecurity: {
    midSkills: ['SIEM Log Monitoring (Splunk, Sentinel)', 'Vulnerability Scans (Nessus)', 'Network Segmentation & Firewalls', 'Identity & Access Management (IAM)', 'Incident Response Runbooks'],
    seniorSkills: ['Zero Trust Network Architecture (ZTNA)', 'Cloud Security Posture Management (CSPM)', 'Penetration Testing & Red Teaming', 'Applied Cryptography & Key Management', 'Container Hardening'],
    leadSkills: ['Lead Security Architect Direction', 'Enterprise Threat Modeling', 'ISO 27001, SOC 2 & NIST Framework Governance', 'CISO Strategic Advisory', 'Zero-Knowledge Sovereign Identity'],
    compensation: {
      entry: [85000, 110000],
      mid: [120000, 155000],
      senior: [160000, 210000],
      lead: [215000, 285000],
    },
  },
};

export function detectDisciplineCategory(
  roleText: string,
  explicitDisciplineId?: string
): 'software' | 'marine' | 'ai' | 'healthcare' | 'marine_ops' | 'cybersecurity' {
  if (explicitDisciplineId) {
    if (explicitDisciplineId === 'maritime' || explicitDisciplineId === 'marine') return 'marine';
    if (explicitDisciplineId === 'software') return 'software';
    if (explicitDisciplineId === 'ai' || explicitDisciplineId === 'ai_robotics') return 'ai';
    if (explicitDisciplineId === 'healthcare') return 'healthcare';
    if (explicitDisciplineId === 'marine_ops') return 'marine_ops';
    if (explicitDisciplineId === 'cybersecurity') return 'cybersecurity';
  }

  const lower = (roleText || '').toLowerCase();
  if (lower.includes('security') || lower.includes('cyber') || lower.includes('infosec') || lower.includes('soc') || lower.includes('zero trust') || lower.includes('pentest')) {
    return 'cybersecurity';
  }
  if (lower.includes('superintendent') || lower.includes('crewing') || lower.includes('marine ops') || lower.includes('fleet') || lower.includes('drydock') || lower.includes('vetting')) {
    return 'marine_ops';
  }
  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('robotics') || lower.includes('deep learning') || lower.includes('llm') || lower.includes('autonomous') || lower.includes('sensor fusion')) {
    return 'ai';
  }
  if (lower.includes('health') || lower.includes('doctor') || lower.includes('clinical') || lower.includes('medical') || lower.includes('nurse') || lower.includes('hospital') || lower.includes('fhir') || lower.includes('ehr')) {
    return 'healthcare';
  }
  if (
    lower.includes('marine') ||
    lower.includes('vessel') ||
    lower.includes('cadet') ||
    lower.includes('maritime') ||
    lower.includes('stcw') ||
    lower.includes('ship') ||
    lower.includes('propulsion') ||
    lower.includes('chief engineer') ||
    lower.includes('wiper') ||
    lower.includes('oiler') ||
    lower.includes('motorman') ||
    lower.includes('seaman')
  ) {
    return 'marine';
  }
  return 'software';
}

export function generateCareerRoadmap(
  currentRole: string,
  targetRole: string,
  candidateSkills: string[] = [],
  disciplineId?: string,
  targetRankId?: string
): CareerRoadmapAnalysis {
  const discipline = detectDisciplineCategory(targetRole || currentRole, disciplineId);
  const data = ROLE_TIER_COMPETENCIES[discipline] || ROLE_TIER_COMPETENCIES.software;

  // Resolve discipline ladder metadata
  const ladderKey = discipline === 'marine' ? 'maritime' : discipline === 'ai' ? 'ai_robotics' : discipline;
  const ladderData = DISCIPLINE_CAREER_LADDERS[ladderKey] || DISCIPLINE_CAREER_LADDERS.software;

  // Resolve specific target rank if provided or matched
  let matchedRank: CareerRank | undefined = undefined;
  if (targetRankId) {
    matchedRank = ladderData.ranks.find((r) => r.id === targetRankId);
  }
  if (!matchedRank && targetRole) {
    matchedRank = ladderData.ranks.find(
      (r) =>
        r.title.toLowerCase().includes(targetRole.toLowerCase()) ||
        targetRole.toLowerCase().includes(r.title.toLowerCase())
    );
  }

  const normalizedCandidateSkills = (candidateSkills || []).map((s) => s.toLowerCase().trim());

  // Determine current tier based on current role
  const isSenior = /senior|lead|principal|staff|chief|head|director|superintendent/i.test(currentRole || '');
  const currentTier = isSenior ? 'Senior' : 'Mid-Level';

  // Determine target tier: If matchedRank exists, it is the absolute source of truth
  let targetTier: 'Cadet / Entry' | 'Junior' | 'Mid-Level' | 'Senior' | 'Staff/Lead' = 'Senior';
  if (matchedRank) {
    if (matchedRank.tier === 'Cadet / Entry') targetTier = 'Cadet / Entry';
    else if (matchedRank.tier === 'Junior') targetTier = 'Junior';
    else if (matchedRank.tier === 'Mid-Level') targetTier = 'Mid-Level';
    else if (matchedRank.tier === 'Senior') targetTier = 'Senior';
    else if (matchedRank.tier === 'Lead / Chief' || (matchedRank.tier as string) === 'Staff/Lead') targetTier = 'Staff/Lead';
    else targetTier = (matchedRank.tier as any) || 'Senior';
  } else {
    const isTargetLead = /lead|principal|chief|director|staff|head|superintendent|cmio|ciso/i.test(targetRole || '');
    const isTargetSenior = /senior|specialist|architect|2nd/i.test(targetRole || '') && !isTargetLead;
    const isTargetCadet = /cadet|trainee|apprentice|intern/i.test(targetRole || '');
    const isTargetJunior = /junior|4th/i.test(targetRole || '') && !isTargetCadet;
    const isTargetMid = /mid|officer|engineer|developer|3rd/i.test(targetRole || '') && !isTargetLead && !isTargetSenior && !isTargetCadet && !isTargetJunior;

    targetTier = isTargetLead
      ? 'Staff/Lead'
      : isTargetSenior
      ? 'Senior'
      : isTargetCadet
      ? 'Cadet / Entry'
      : isTargetJunior
      ? 'Junior'
      : isTargetMid
      ? 'Mid-Level'
      : 'Senior';
  }

  // Resolve target competencies to check against candidate's profile
  let targetCompetencies: string[] = [];
  if (matchedRank && matchedRank.requiredCompetencies.length > 0) {
    targetCompetencies = [...matchedRank.requiredCompetencies];
  } else if (targetTier === 'Staff/Lead') {
    targetCompetencies = [...data.leadSkills];
  } else if (targetTier === 'Senior') {
    targetCompetencies = [...data.seniorSkills];
  } else {
    targetCompetencies = [...data.midSkills];
  }

  const skillGaps: SkillGapItem[] = [];

  for (const comp of targetCompetencies) {
    const hasSkill = normalizedCandidateSkills.some(
      (s) => s.includes(comp.toLowerCase()) || comp.toLowerCase().includes(s)
    );
    if (!hasSkill) {
      skillGaps.push({
        skill: comp,
        category:
          comp.includes('Leadership') || comp.includes('Supervision') || comp.includes('Director')
            ? 'leadership'
            : comp.includes('License') || comp.includes('STCW') || comp.includes('Certification') || comp.includes('SOC2') || comp.includes('DPA')
            ? 'certification'
            : 'architecture',
        urgency: skillGaps.length < 2 ? 'high' : 'medium',
        recommendedAction: `Incorporate production implementation and verified metrics into active CV for ${comp}.`,
      });
    }
  }

  // If candidate already has all base skills, provide advanced specialization growth gaps
  if (skillGaps.length === 0) {
    const advancedPool = matchedRank?.certifications || (targetTier === 'Staff/Lead' ? data.leadSkills : data.seniorSkills);
    for (const adv of advancedPool.slice(0, 3)) {
      skillGaps.push({
        skill: adv,
        category: adv.includes('STCW') || adv.includes('License') ? 'certification' : 'architecture',
        urgency: 'growth',
        recommendedAction: `Deepen production mastery and cryptographic attestation on Walrus for ${adv}.`,
      });
    }
  }

  // Generate 4-Quarter Progression Milestones
  const roadmap: RoadmapMilestone[] = [
    {
      quarter: 'Month 1-3 (Q1): Foundation & Gap Closure',
      focus: `Master core high-impact competencies in ${targetRole || matchedRank?.title || ladderData.label}`,
      deliverables: [
        `Complete reference implementation and hands-on deliverables in ${skillGaps[0]?.skill || 'Core Systems'}`,
        'Update Resume Studio profile with STAR+R quantifiable impact metrics',
        'Verify required certifications on Walrus Sovereign Vault',
      ],
      keyCompetencies: [skillGaps[0]?.skill || 'Core Systems Engineering', skillGaps[1]?.skill || 'Operational Reliability'],
    },
    {
      quarter: 'Month 4-6 (Q2): Architecture & Scale',
      focus: 'Lead technical workflows and demonstrate independent problem solving',
      deliverables: [
        'Deliver end-to-end mission-critical module with verified 99.9% reliability',
        'Perform ATS optimization on specialized CV version',
        'Initiate batch outreach across verified tier-1 employers in target sector',
      ],
      keyCompetencies: [skillGaps[2]?.skill || 'High-Throughput Scale', 'Operational Rigor'],
    },
    {
      quarter: 'Month 7-9 (Q3): Strategic Delivery & Mentorship',
      focus: 'Cross-functional impact and technical ownership',
      deliverables: [
        'Document architecture decisions and mentor junior/mid personnel',
        'Track recruiter response milestones and follow up within 7-day windows',
      ],
      keyCompetencies: ['Cross-Functional Execution', 'Technical Mentorship'],
    },
    {
      quarter: 'Month 10-12 (Q4): Senior/Lead Positioning & Promotion',
      focus: 'Final evaluation and executive compensation negotiation',
      deliverables: [
        `Achieve ${targetTier} appointment and align compensation with market ceiling`,
        'Seal long-term cryptographic record of career achievements into Walrus storage',
      ],
      keyCompetencies: ['Strategic Decision-Making', 'Executive Communication'],
    },
  ];

  // Compensation Benchmark
  const compKey: 'entry' | 'mid' | 'senior' | 'lead' =
    targetTier === 'Staff/Lead'
      ? 'lead'
      : targetTier === 'Senior'
      ? 'senior'
      : targetTier === 'Junior' || targetTier === 'Cadet / Entry'
      ? 'entry'
      : 'mid';

  const range = data.compensation[compKey] || data.compensation.mid;

  const isMaritimeIndustry = discipline === 'marine' || discipline === 'marine_ops';
  let maritimeDayRate: [number, number] | undefined = undefined;
  let maritimeMonthlyStipendUSD: [number, number] | undefined = undefined;

  if (isMaritimeIndustry) {
    if (targetTier === 'Staff/Lead') {
      maritimeDayRate = [750, 1100];
    } else if (targetTier === 'Senior') {
      maritimeDayRate = [550, 850];
    } else if (targetTier === 'Mid-Level') {
      maritimeDayRate = [380, 550];
    } else if (targetTier === 'Junior') {
      maritimeDayRate = [280, 420];
    } else {
      // Cadet / Entry: Monthly stipend $1,800 - $2,800 / mo
      maritimeMonthlyStipendUSD = [1800, 2800];
    }
  }

  const compensation: CompensationBenchmark = {
    roleTitle: targetRole || matchedRank?.title || `${targetTier} Specialist`,
    tier: targetTier as any,
    baseRangeUSD: range,
    dayRateMaritimeUSD: maritimeDayRate,
    maritimeMonthlyStipendUSD,
    marketTrend: ladderData.marketTrend,
  };

  const advancementAdvice = [
    `Target competencies: Focus immediately on ${skillGaps.slice(0, 3).map((g) => g.skill).join(', ')}.`,
    'Quantify every milestone: Ensure your CV reflects quantifiable outcomes (e.g. reduced latency by 35%, saved 4.2MT fuel, improved uptime to 99.9%).',
    'Leverage anti-spam paced batch dispatch to maximize interview coverage without burning recruiter relationships.',
    `Next ladder promotion: Transition toward ${matchedRank ? (ladderData.ranks.find((r) => r.levelOrder === matchedRank!.levelOrder + 1)?.title || 'Executive Leadership') : 'Next Senior Tier'}.`,
  ];

  return {
    currentRole: currentRole || 'Candidate',
    targetRole: targetRole || matchedRank?.title || 'Target Role',
    currentTier,
    targetTier,
    skillGaps,
    roadmap,
    compensation,
    advancementAdvice,
    careerLadder: ladderData.ranks,
    alternativePathways: ladderData.lateralPathways,
    targetRank: matchedRank,
  };
}
