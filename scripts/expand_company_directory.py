import json
import re

with open('lib/company_directory.ts', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const VERIFIED_COMPANY_HIRING_CONTACTS: CompanyHiringContact\[\] = (\[[\s\S]*\]);', content)
if not match:
    print("Could not match array in lib/company_directory.ts")
    exit(1)

current_contacts = json.loads(match.group(1))
existing_ids = {c['id'] for c in current_contacts}

new_software_contacts = [
    {
        "id": "google-tech",
        "company": "Google",
        "category": "Software / Cloud",
        "contactEmail": "tech-jobs@google.com",
        "typicalRoles": ["Software Engineer", "Cloud Solutions Architect", "Site Reliability Engineer", "Systems Infrastructure Specialist"],
        "location": "Mountain View, CA / London / Remote",
        "careersUrl": "https://careers.google.com",
        "notes": "Global core systems, cloud infrastructure, and distributed computing intake."
    },
    {
        "id": "microsoft-engineering",
        "company": "Microsoft",
        "category": "Software / Cloud",
        "contactEmail": "careers@microsoft.com",
        "typicalRoles": ["Software Engineer", "Azure Cloud Specialist", "Full Stack Developer", "Platform Systems Engineer"],
        "location": "Redmond, WA / Remote / Global",
        "careersUrl": "https://careers.microsoft.com",
        "notes": "Enterprise cloud platform, Azure core services, and distributed systems."
    },
    {
        "id": "aws-cloud",
        "company": "Amazon Web Services (AWS)",
        "category": "Software / Cloud",
        "contactEmail": "aws-recruiting@amazon.com",
        "typicalRoles": ["Cloud Solutions Architect", "Distributed Systems Engineer", "DevOps Engineer", "Backend Go/Java Developer"],
        "location": "Seattle, WA / Dublin / Remote",
        "careersUrl": "https://amazon.jobs",
        "notes": "Hyper-scale cloud infrastructure, networking, and serverless compute."
    },
    {
        "id": "meta-infra",
        "company": "Meta",
        "category": "Software / Cloud",
        "contactEmail": "recruiting@meta.com",
        "typicalRoles": ["Software Engineer", "Production Engineer", "Systems Architect", "Frontend UI Specialist"],
        "location": "Menlo Park, CA / London / Remote",
        "careersUrl": "https://www.metacareers.com",
        "notes": "Global scale social graph, high-throughput distributed systems, and edge infrastructure."
    },
    {
        "id": "apple-software",
        "company": "Apple",
        "category": "Software / Cloud",
        "contactEmail": "talentacquisition@apple.com",
        "typicalRoles": ["Systems Software Engineer", "CoreOS Developer", "Cloud Services Engineer", "Swift Platform Specialist"],
        "location": "Cupertino, CA / Remote",
        "careersUrl": "https://jobs.apple.com",
        "notes": "Hardware-software integration, macOS/iOS core services, and cloud telemetry."
    },
    {
        "id": "netflix-platform",
        "company": "Netflix",
        "category": "Software / Cloud",
        "contactEmail": "talent@netflix.com",
        "typicalRoles": ["Senior Platform Engineer", "Distributed Systems Engineer", "Data Infrastructure Developer", "Cloud UI Engineer"],
        "location": "Los Gatos, CA / Remote",
        "careersUrl": "https://jobs.netflix.com",
        "notes": "Global video streaming CDN, open microservice architecture, and cloud observability."
    },
    {
        "id": "github-platform",
        "company": "GitHub",
        "category": "Software / Cloud",
        "contactEmail": "careers@github.com",
        "typicalRoles": ["Platform Systems Engineer", "Developer Tools Architect", "Full Stack Ruby/TypeScript Developer", "Security SRE"],
        "location": "Remote Worldwide",
        "careersUrl": "https://github.com/about/careers",
        "notes": "Developer tools, Git version control cloud, and Actions CI/CD infrastructure."
    },
    {
        "id": "datadog-sre",
        "company": "Datadog",
        "category": "Software / Cloud",
        "contactEmail": "recruiting@datadoghq.com",
        "typicalRoles": ["Site Reliability Engineer", "Observability Systems Engineer", "Cloud Infrastructure Architect", "Backend Go Developer"],
        "location": "New York, NY / Paris / Remote",
        "careersUrl": "https://www.datadoghq.com/careers",
        "notes": "Real-time metrics, distributed tracing, and high-volume cloud observability."
    },
    {
        "id": "snowflake-cloud",
        "company": "Snowflake",
        "category": "Software / Cloud",
        "contactEmail": "careers@snowflake.com",
        "typicalRoles": ["Data Cloud Systems Engineer", "Distributed Database Developer", "Query Compiler Architect", "C++ Systems Engineer"],
        "location": "Bozeman, MT / San Mateo, CA / Remote",
        "careersUrl": "https://careers.snowflake.com",
        "notes": "Multi-cluster shared data architecture and elastic cloud data warehousing."
    },
    {
        "id": "hashicorp-infra",
        "company": "HashiCorp",
        "category": "Software / Cloud",
        "contactEmail": "talent@hashicorp.com",
        "typicalRoles": ["Cloud Infrastructure Specialist", "Terraform Core Developer", "Vault Security Engineer", "Go Systems Engineer"],
        "location": "Remote Worldwide",
        "careersUrl": "https://www.hashicorp.com/careers",
        "notes": "Infrastructure as code, zero-trust cloud security, and multi-cloud orchestration."
    },
    {
        "id": "gitlab-devops",
        "company": "GitLab",
        "category": "Software / Cloud",
        "contactEmail": "recruiting@gitlab.com",
        "typicalRoles": ["DevSecOps Architect", "Cloud Infrastructure Specialist", "Full Stack Ruby/Vue Developer", "SRE"],
        "location": "Remote Worldwide",
        "careersUrl": "https://about.gitlab.com/jobs",
        "notes": "All-remote DevSecOps platform and Kubernetes cloud automation."
    },
    {
        "id": "mongodb-core",
        "company": "MongoDB",
        "category": "Software / Cloud",
        "contactEmail": "careers@mongodb.com",
        "typicalRoles": ["Database Kernel Engineer", "Distributed Systems Engineer", "Cloud Platform Architect", "Go/C++ Systems Developer"],
        "location": "New York, NY / Dublin / Remote",
        "careersUrl": "https://www.mongodb.com/careers",
        "notes": "Distributed document database, Atlas managed cloud, and replication engines."
    },
    {
        "id": "elastic-search",
        "company": "Elastic",
        "category": "Software / Cloud",
        "contactEmail": "talent@elastic.co",
        "typicalRoles": ["Search Systems Engineer", "Distributed Data Architect", "Elastic Cloud SRE", "Java/Go Systems Developer"],
        "location": "Remote Worldwide",
        "careersUrl": "https://www.elastic.co/about/careers",
        "notes": "Search indexing, distributed logging analytics, and cloud SIEM."
    },
    {
        "id": "atlassian-cloud",
        "company": "Atlassian",
        "category": "Software / Cloud",
        "contactEmail": "talent@atlassian.com",
        "typicalRoles": ["Cloud Platform Engineer", "Full Stack React/Java Specialist", "Distributed SRE", "API Systems Architect"],
        "location": "Sydney, Australia / Remote Worldwide",
        "careersUrl": "https://www.atlassian.com/company/careers",
        "notes": "Team collaboration cloud, Jira/Confluence microservices, and enterprise reliability."
    },
    {
        "id": "shopify-platform",
        "company": "Shopify",
        "category": "Software / Cloud",
        "contactEmail": "careers@shopify.com",
        "typicalRoles": ["Commerce Platform Engineer", "Ruby/Rust Core Developer", "Distributed Storage Specialist", "Frontend React Architect"],
        "location": "Remote Worldwide",
        "careersUrl": "https://www.shopify.com/careers",
        "notes": "Hyper-scale global commerce engine and high-availability flash-sale infrastructure."
    },
    {
        "id": "twilio-telecom",
        "company": "Twilio",
        "category": "Software / Cloud",
        "contactEmail": "recruiting@twilio.com",
        "typicalRoles": ["Communications API Developer", "Voice & Messaging Systems Engineer", "Distributed Go Engineer", "Cloud SRE"],
        "location": "Remote Worldwide",
        "careersUrl": "https://www.twilio.com/company/jobs",
        "notes": "Global telecom APIs, real-time WebRTC, and programmable connectivity."
    },
    {
        "id": "supabase-oss",
        "company": "Supabase",
        "category": "Software / Cloud",
        "contactEmail": "jobs@supabase.com",
        "typicalRoles": ["Postgres Systems Engineer", "Open Source Cloud Developer", "Elixir/Go Specialist", "Realtime WebSockets Architect"],
        "location": "Remote Worldwide",
        "careersUrl": "https://supabase.com/careers",
        "notes": "Open-source Firebase alternative, Postgres extensions, and Edge runtime."
    },
    {
        "id": "docker-cloud",
        "company": "Docker",
        "category": "Software / Cloud",
        "contactEmail": "careers@docker.com",
        "typicalRoles": ["Container Runtime Engineer", "Developer Tooling Specialist", "Go Systems Architect", "Linux Virtualization Developer"],
        "location": "Remote Worldwide",
        "careersUrl": "https://www.docker.com/careers",
        "notes": "Containerization engines, Docker Desktop, and multi-architecture build pipelines."
    },
    {
        "id": "fastly-edge",
        "company": "Fastly",
        "category": "Software / Cloud",
        "contactEmail": "recruiting@fastly.com",
        "typicalRoles": ["Edge Compute Architect", "WebAssembly Runtime Engineer", "Rust Systems Developer", "Global CDN Network Specialist"],
        "location": "Remote Worldwide",
        "careersUrl": "https://www.fastly.com/about/careers",
        "notes": "Edge cloud computing, real-time CDN delivery, and modern Wasm runtimes."
    },
    {
        "id": "crowdstrike-security",
        "company": "CrowdStrike",
        "category": "Software / Cloud",
        "contactEmail": "careers@crowdstrike.com",
        "typicalRoles": ["Cloud Security Systems Engineer", "Kernel & Endpoint C++ Developer", "Distributed Threat Detection Architect", "Go Cloud Developer"],
        "location": "Austin, TX / Remote",
        "careersUrl": "https://www.crowdstrike.com/careers",
        "notes": "Cloud-native endpoint protection, Falcon platform, and distributed threat intelligence."
    },
    {
        "id": "paloalto-networks",
        "company": "Palo Alto Networks",
        "category": "Software / Cloud",
        "contactEmail": "talent@paloaltonetworks.com",
        "typicalRoles": ["Cloud Security Architect", "Distributed Systems Engineer", "Network Firewall Developer", "DevSecOps Specialist"],
        "location": "Santa Clara, CA / Remote",
        "careersUrl": "https://jobs.paloaltonetworks.com",
        "notes": "Prisma Cloud, zero-trust network infrastructure, and enterprise cybersecurity."
    },
    {
        "id": "andela-tech",
        "company": "Andela",
        "category": "Software / Cloud",
        "contactEmail": "talent@andela.com",
        "typicalRoles": ["Senior Full Stack Engineer", "Cloud Infrastructure Architect", "Python/Node Systems Engineer", "Distributed Team Lead"],
        "location": "Lagos, Nigeria / Nairobi / Remote",
        "careersUrl": "https://www.andela.com/careers",
        "notes": "Global distributed engineering network connecting African tech talent to global companies."
    },
    {
        "id": "kuda-bank",
        "company": "Kuda Technologies",
        "category": "Software / Cloud",
        "contactEmail": "careers@kuda.com",
        "typicalRoles": ["Core Banking Systems Engineer", "Mobile React Native Developer", "Microservices Backend Architect", "Cloud Security Specialist"],
        "location": "London, UK / Lagos, Nigeria",
        "careersUrl": "https://www.kuda.com/careers",
        "notes": "Digital banking infrastructure, high-throughput transaction processing, and fintech."
    },
    {
        "id": "opay-fintech",
        "company": "OPay",
        "category": "Software / Cloud",
        "contactEmail": "careers@opay-inc.com",
        "typicalRoles": ["Payment Systems Engineer", "Distributed Transaction Architect", "Mobile Platform Developer", "Core Database Engineer"],
        "location": "Lagos, Nigeria / Remote",
        "careersUrl": "https://www.opayweb.com",
        "notes": "High-volume African merchant payments, agent banking, and fintech wallet infrastructure."
    },
    {
        "id": "piggyvest-tech",
        "company": "Piggyvest",
        "category": "Software / Cloud",
        "contactEmail": "careers@piggyvest.com",
        "typicalRoles": ["Full Stack Engineer", "Python/Django Backend Developer", "FinTech Cloud Architect", "Mobile iOS/Android Engineer"],
        "location": "Lagos, Nigeria",
        "careersUrl": "https://www.piggyvest.com",
        "notes": "Automated savings, investment microservices, and consumer fintech infrastructure."
    },
    {
        "id": "talentql-africa",
        "company": "TalentQL",
        "category": "Software / Cloud",
        "contactEmail": "talent@talentql.com",
        "typicalRoles": ["Full Stack Software Engineer", "EdTech Platform Architect", "Backend Node/Go Developer", "Cloud Systems Specialist"],
        "location": "Lagos, Nigeria / Remote",
        "careersUrl": "https://talentql.com",
        "notes": "African developer talent pipeline, AltSchool Africa platform, and cloud solutions."
    },
    {
        "id": "postman-api",
        "company": "Postman",
        "category": "Software / Cloud",
        "contactEmail": "careers@postman.com",
        "typicalRoles": ["API Platform Engineer", "Developer Tooling Architect", "Frontend Electron Specialist", "Distributed Node Systems Engineer"],
        "location": "San Francisco, CA / Bengaluru / Remote",
        "careersUrl": "https://www.postman.com/careers",
        "notes": "Leading API development and testing platform, collaborative cloud workspaces."
    },
    {
        "id": "sentry-observability",
        "company": "Sentry",
        "category": "Software / Cloud",
        "contactEmail": "careers@sentry.io",
        "typicalRoles": ["Application Performance Monitoring Engineer", "Python/Rust Systems Developer", "Distributed Storage Architect", "SDK Engineer"],
        "location": "San Francisco, CA / Vienna / Remote",
        "careersUrl": "https://sentry.io/careers",
        "notes": "Developer-first error tracking, crash reporting, and distributed telemetry pipelines."
    },
    {
        "id": "canva-platform",
        "company": "Canva",
        "category": "Software / Cloud",
        "contactEmail": "careers@canva.com",
        "typicalRoles": ["Frontend Graphics Engine Developer", "Cloud Infrastructure Engineer", "Java/TypeScript Backend Architect", "UI Systems Specialist"],
        "location": "Sydney, Australia / Remote",
        "careersUrl": "https://www.canva.com/careers",
        "notes": "Browser-based graphic design engine, WebGL rendering, and scalable cloud assets."
    },
    {
        "id": "automattic-open",
        "company": "Automattic",
        "category": "Software / Cloud",
        "contactEmail": "jobs@automattic.com",
        "typicalRoles": ["WordPress Core Systems Developer", "Full Stack React/PHP Specialist", "Global Systems SRE", "Mobile App Engineer"],
        "location": "Remote Worldwide",
        "careersUrl": "https://automattic.com/work-with-us",
        "notes": "Pioneering distributed software organization powering over 40% of the open web."
    }
]

new_ai_contacts = [
    {
        "id": "openai-ai",
        "company": "OpenAI",
        "category": "AI / Robotics",
        "contactEmail": "talent@openai.com",
        "typicalRoles": ["AI Research Engineer", "Foundation Model Pre-Training Specialist", "Distributed Supercomputing Architect", "Reinforcement Learning Engineer"],
        "location": "San Francisco, CA / Remote",
        "careersUrl": "https://openai.com/careers",
        "notes": "Frontier generative intelligence, GPT foundation architectures, and alignment research."
    },
    {
        "id": "google-deepmind",
        "company": "Google DeepMind",
        "category": "AI / Robotics",
        "contactEmail": "deepmind-careers@google.com",
        "typicalRoles": ["Research Scientist", "Deep Learning Systems Engineer", "Robotics Foundation Model Specialist", "Bio-ML Algorithm Developer"],
        "location": "London, UK / Mountain View, CA",
        "careersUrl": "https://deepmind.google/careers",
        "notes": "Frontier AI science, AlphaFold computational biology, and Gemini multimodal intelligence."
    },
    {
        "id": "scale-ai",
        "company": "Scale AI",
        "category": "AI / Robotics",
        "contactEmail": "careers@scale.com",
        "typicalRoles": ["Machine Learning Systems Engineer", "Data Engine Platform Specialist", "Generative AI Evaluation Architect", "Full Stack ML Developer"],
        "location": "San Francisco, CA / Remote",
        "careersUrl": "https://scale.com/careers",
        "notes": "Data foundation for artificial intelligence, RLHF infrastructure, and model evaluations."
    },
    {
        "id": "huggingface-ml",
        "company": "Hugging Face",
        "category": "AI / Robotics",
        "contactEmail": "jobs@huggingface.co",
        "typicalRoles": ["Open Source ML Engineer", "Transformer Optimization Specialist", "AI Hub Platform Developer", "Robotics LeRobot Specialist"],
        "location": "Paris, France / New York, NY / Remote",
        "careersUrl": "https://huggingface.co/join",
        "notes": "Global open-source AI ecosystem, model weights repository, and PyTorch tooling."
    },
    {
        "id": "mistral-ai",
        "company": "Mistral AI",
        "category": "AI / Robotics",
        "contactEmail": "careers@mistral.ai",
        "typicalRoles": ["Open LLM Research Engineer", "Distributed Pre-Training Specialist", "C++/CUDA Kernel Developer", "Inference Optimization Architect"],
        "location": "Paris, France / Remote",
        "careersUrl": "https://mistral.ai/company/#careers",
        "notes": "European open-weights LLMs, Mixture-of-Experts architectures, and ultra-efficient inference."
    },
    {
        "id": "cohere-nlp",
        "company": "Cohere",
        "category": "AI / Robotics",
        "contactEmail": "talent@cohere.com",
        "typicalRoles": ["Enterprise NLP Engineer", "Representation Learning Specialist", "RAG Systems Architect", "Fine-Tuning Infrastructure Developer"],
        "location": "Toronto, Canada / San Francisco, CA / Remote",
        "careersUrl": "https://cohere.com/careers",
        "notes": "Enterprise conversational models, dense retrieval embeddings, and multilingual NLP."
    },
    {
        "id": "perplexity-ai",
        "company": "Perplexity AI",
        "category": "AI / Robotics",
        "contactEmail": "careers@perplexity.ai",
        "typicalRoles": ["Search Indexing ML Engineer", "Agentic Reasoning Systems Developer", "Real-Time Inference Specialist", "Frontend AI Product Engineer"],
        "location": "San Francisco, CA",
        "careersUrl": "https://www.perplexity.ai/careers",
        "notes": "Real-time conversational answer engine, live web citation grounding, and agentic search."
    },
    {
        "id": "boston-dynamics",
        "company": "Boston Dynamics",
        "category": "AI / Robotics",
        "contactEmail": "careers@bostondynamics.com",
        "typicalRoles": ["Autonomous Controls Engineer", "Dynamic Walking & Balance Specialist", "Embedded Robotics Developer", "Perception Vision Engineer"],
        "location": "Waltham, MA",
        "careersUrl": "https://bostondynamics.com/careers",
        "notes": "Mobile manipulation robots, Spot quadrupeds, and next-gen electric Atlas humanoids."
    },
    {
        "id": "figure-robotics",
        "company": "Figure AI",
        "category": "AI / Robotics",
        "contactEmail": "careers@figure.ai",
        "typicalRoles": ["Humanoid Robotics Controls Specialist", "Vision-Language-Action (VLA) Engineer", "Actuator Mechatronics Developer", "Embedded C++ Firmware Engineer"],
        "location": "Sunnyvale, CA",
        "careersUrl": "https://www.figure.ai/careers",
        "notes": "Autonomous general-purpose humanoid robots deployable in logistics and manufacturing."
    },
    {
        "id": "waymo-autonomy",
        "company": "Waymo",
        "category": "AI / Robotics",
        "contactEmail": "careers@waymo.com",
        "typicalRoles": ["Autonomous Perception Engineer", "Motion Planning Specialist", "Sensor Fusion & Lidar Architect", "Safety Critical Systems Developer"],
        "location": "Mountain View, CA / Austin, TX",
        "careersUrl": "https://waymo.com/careers",
        "notes": "Commercial Level 4 autonomous ride-hailing and self-driving passenger vehicles."
    },
    {
        "id": "tesla-autopilot",
        "company": "Tesla AI & Robotics",
        "category": "AI / Robotics",
        "contactEmail": "ai-jobs@tesla.com",
        "typicalRoles": ["Full Self-Driving Vision Engineer", "Optimus Actuator Controls Specialist", "Neural Network Inference Developer", "Dojo Supercomputing Architect"],
        "location": "Austin, TX / Palo Alto, CA",
        "careersUrl": "https://www.tesla.com/careers",
        "notes": "End-to-end vision neural networks for autonomous transit and Optimus humanoid robotics."
    },
    {
        "id": "zoox-autonomy",
        "company": "Zoox (Amazon)",
        "category": "AI / Robotics",
        "contactEmail": "careers@zoox.com",
        "typicalRoles": ["Autonomous Vehicle Software Engineer", "Lidar/Radar Sensor Fusion Specialist", "Embedded Safety Architect", "Trajectory Optimization Developer"],
        "location": "Foster City, CA",
        "careersUrl": "https://zoox.com/careers",
        "notes": "Purpose-built bi-directional robotaxi fleet designed for dense urban transit."
    },
    {
        "id": "skydio-drones",
        "company": "Skydio",
        "category": "AI / Robotics",
        "contactEmail": "careers@skydio.com",
        "typicalRoles": ["Autonomous Drone Guidance & Navigation Engineer", "Computer Vision Specialist", "Embedded C++ Flight Software Developer", "SLAM Architect"],
        "location": "San Mateo, CA",
        "careersUrl": "https://www.skydio.com/careers",
        "notes": "Autonomous drones featuring 360-degree obstacle avoidance and aerial AI mapping."
    },
    {
        "id": "agility-robotics",
        "company": "Agility Robotics",
        "category": "AI / Robotics",
        "contactEmail": "careers@agilityrobotics.com",
        "typicalRoles": ["Bipedal Motion Controls Engineer", "Fleet Autonomy Software Specialist", "Embedded Mechatronics Developer", "Warehouse Robotics Architect"],
        "location": "Corvallis, OR / Pittsburgh, PA",
        "careersUrl": "https://agilityrobotics.com/careers",
        "notes": "Digit bipedal human-centric mobile manipulation robot for logistics operations."
    },
    {
        "id": "nvidia-ai-labs",
        "company": "NVIDIA",
        "category": "AI / Robotics",
        "contactEmail": "ai-recruiting@nvidia.com",
        "typicalRoles": ["CUDA Kernel Optimization Engineer", "TensorRT Inference Specialist", "Deep Learning Systems Architect", "Isaac Robotics Simulation Engineer"],
        "location": "Santa Clara, CA / Remote",
        "careersUrl": "https://www.nvidia.com/en-us/about-nvidia/careers",
        "notes": "Accelerated computing silicon, AI foundation software, and Isaac robotics simulation."
    },
    {
        "id": "cerebras-systems",
        "company": "Cerebras Systems",
        "category": "AI / Robotics",
        "contactEmail": "careers@cerebras.net",
        "typicalRoles": ["Wafer-Scale ML Systems Engineer", "Compiler Optimization Developer", "High Performance Computing Architect", "PyTorch Kernel Specialist"],
        "location": "Sunnyvale, CA / Remote",
        "careersUrl": "https://www.cerebras.net/careers",
        "notes": "Wafer-scale supercomputing engine designed for massive LLM training and instant inference."
    },
    {
        "id": "groq-ai",
        "company": "Groq",
        "category": "AI / Robotics",
        "contactEmail": "talent@groq.com",
        "typicalRoles": ["LPU Inference Systems Engineer", "Real-Time Low-Latency AI Developer", "Compiler & ISA Specialist", "Distributed Supercomputing Architect"],
        "location": "Mountain View, CA / Remote",
        "careersUrl": "https://groq.com/careers",
        "notes": "Language Processing Unit (LPU) architecture for deterministic, ultra-fast LLM generation."
    },
    {
        "id": "sanctuary-humanoid",
        "company": "Sanctuary AI",
        "category": "AI / Robotics",
        "contactEmail": "careers@sanctuary.ai",
        "typicalRoles": ["Humanoid Teleoperation Controls Specialist", "Dexterous Manipulation Controls Engineer", "Embodied AI Systems Architect", "Embedded Mechatronics Engineer"],
        "location": "Vancouver, Canada",
        "careersUrl": "https://www.sanctuary.ai/careers",
        "notes": "Phoenix general-purpose humanoid robots with human-like dexterous upper-body manipulation."
    },
    {
        "id": "apptronik-humanoid",
        "company": "Apptronik",
        "category": "AI / Robotics",
        "contactEmail": "careers@apptronik.com",
        "typicalRoles": ["Humanoid Mechatronics Controls Engineer", "Whole-Body Trajectory Specialist", "Embedded Robotics Firmware Developer", "Sensory Perception Architect"],
        "location": "Austin, TX",
        "careersUrl": "https://apptronik.com/careers",
        "notes": "Apollo general-purpose humanoid robot built for commercial industrial operations."
    },
    {
        "id": "kongsberg-autonomous",
        "company": "Kongsberg Maritime Autonomous",
        "category": "AI / Robotics",
        "contactEmail": "careers@km.kongsberg.com",
        "typicalRoles": ["Autonomous Surface Vessel (ASV) Controls Engineer", "Marine Autonomy Specialist", "DP3 Algorithm Developer", "Hydrodynamic Sensor Fusion Architect"],
        "location": "Kongsberg, Norway",
        "careersUrl": "https://www.kongsberg.com/careers",
        "notes": "Yara Birkeland and next-gen zero-emission fully autonomous commercial maritime vessels."
    },
    {
        "id": "saildrone-ocean",
        "company": "Saildrone",
        "category": "AI / Robotics",
        "contactEmail": "careers@saildrone.com",
        "typicalRoles": ["Autonomous Ocean Drone Systems Engineer", "Hydrodynamic Autonomy Specialist", "Marine Telemetry Developer", "Satellite Navigation Architect"],
        "location": "Alameda, CA",
        "careersUrl": "https://www.saildrone.com/careers",
        "notes": "Uncrewed autonomous surface vehicles powered by wind and solar for global ocean intelligence."
    },
    {
        "id": "ocean-infinity-armada",
        "company": "Ocean Infinity",
        "category": "AI / Robotics",
        "contactEmail": "careers@oceaninfinity.com",
        "typicalRoles": ["Robotic Armada Autonomous Vessel Superintendent", "Subsea AUV Controls Specialist", "Remote Operations Center Engineer", "Acoustic Telemetry Developer"],
        "location": "Southampton, UK / Austin, TX",
        "careersUrl": "https://oceaninfinity.com/careers",
        "notes": "Uncrewed autonomous robotic surface fleets and subsea seabed mapping vehicles."
    },
    {
        "id": "covariant-robotics",
        "company": "Covariant",
        "category": "AI / Robotics",
        "contactEmail": "careers@covariant.ai",
        "typicalRoles": ["Universal Robotics Brain Engineer", "Warehouse Manipulation Specialist", "Deep Reinforcement Learning Developer", "Camera Calibration Vision Architect"],
        "location": "Berkeley, CA",
        "careersUrl": "https://covariant.ai/careers",
        "notes": "Universal AI foundation brain for robotic picking, sorting, and warehouse fulfillment."
    },
    {
        "id": "physical-intelligence",
        "company": "Physical Intelligence (π)",
        "category": "AI / Robotics",
        "contactEmail": "careers@physicalintelligence.company",
        "typicalRoles": ["Foundation Robotics Model Specialist", "Physical Manipulation ML Engineer", "Sim-to-Real Controls Architect", "PyTorch Robotics Developer"],
        "location": "San Francisco, CA",
        "careersUrl": "https://www.physicalintelligence.company",
        "notes": "Universal foundation models for general-purpose robotic manipulation and physical tasks."
    },
    {
        "id": "onex-technologies",
        "company": "1X Technologies",
        "category": "AI / Robotics",
        "contactEmail": "careers@1x.tech",
        "typicalRoles": ["Android & Bipedal Robotics Engineer", "Direct-Drive Motor Hardware Specialist", "AI Manipulation Developer", "Embedded Safety Firmware Engineer"],
        "location": "Moss, Norway / Sunnyvale, CA",
        "careersUrl": "https://www.1x.tech/careers",
        "notes": "NEO and EVE bipedal androids designed to safely work alongside humans in domestic and industrial spaces."
    },
    {
        "id": "relativity-space-robotics",
        "company": "Relativity Space",
        "category": "AI / Robotics",
        "contactEmail": "careers@relativityspace.com",
        "typicalRoles": ["Stargate 3D Printing Robotics Engineer", "Autonomous Laser Deposition Specialist", "Aerospace Robotics Controls Developer", "Computer Vision Inspection Architect"],
        "location": "Long Beach, CA",
        "careersUrl": "https://www.relativityspace.com/careers",
        "notes": "World's largest metal 3D printing robotics system for autonomous rocket manufacturing."
    }
]

added_count = 0
for contact in new_software_contacts + new_ai_contacts:
    if contact['id'] not in existing_ids:
        current_contacts.append(contact)
        existing_ids.add(contact['id'])
        added_count += 1

print(f"Added {added_count} new verified tech companies. Total now: {len(current_contacts)}")

# Write back to lib/company_directory.ts
new_array_json = json.dumps(current_contacts, indent=2)
new_content = content[:match.start(1)] + new_array_json + content[match.end(1):]

with open('lib/company_directory.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully updated lib/company_directory.ts")
