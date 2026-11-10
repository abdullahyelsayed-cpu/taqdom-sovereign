import { PortfolioData, TemplateMeta } from "./types";

export const TEMPLATES_CATALOG: TemplateMeta[] = [
  {
    id: "madar",
    slug: "madar",
    name: { ar: "مَدَار", en: "Madar" },
    tagline: {
      ar: "شبكة Bento تفاعلية وهوية برمجية لخريجي الذكاء الاصطناعي وعلوم الحاسب",
      en: "Bento Tech & AI Grad Identity with Cmd+K Command Palette",
    },
    persona: {
      ar: "لطلاب وخريجي علوم الحاسب، الذكاء الاصطناعي، وهندسة البرمجيات",
      en: "For CS & AI Graduates, Full-Stack Engineers & Hackathon Builders",
    },
    description: {
      ar: "قالب مصمم بروح Linear وRaycast يجمع بين شبكة Bento التفاعلية، نافذة الأوامر السريعة Cmd+K، شارة التفرغ للتدريب والوظائف، وإحصائيات المشاريع البرمجية والهاكاثونات.",
      en: "Engineered with an interactive Bento Grid, live Cmd+K command palette, real-time internship & role availability badge, hackathon stats, and interactive skill matrices.",
    },
    heroImage: "/images/ultra/madar-hero.webp",
    galleryImages: [
      "/images/ultra/madar-hero.webp",
      "/images/ultra/madar-1.webp",
      "/images/ultra/madar-2.webp",
    ],
    accentColor: "#C89D66",
    defaultCreatorUsername: "youssef",
    features: [
      { ar: "شبكة Bento Grid تفاعلية مع نافذة أوامر Cmd+K", en: "Interactive Bento Grid & Cmd+K Palette" },
      { ar: "شارة حالة حية: متاح للتدريب والفرص الوظيفية", en: "Live Status: Available for Internships & Roles" },
      { ar: "إحصائيات الهاكاثونات والمشاريع ومصفوفة المهارات", en: "Hackathon Telemetry & Interactive Tech Stack" },
    ],
  },
  {
    id: "athar",
    slug: "athar",
    name: { ar: "أَثَر", en: "Athar" },
    tagline: {
      ar: "تمرير سينمائي مثبت ومعرض أفقي للمصممين وصنّاع المحتوى البصري",
      en: "Cinema Scrollytelling & Horizontal Showcase for Visual Directors",
    },
    persona: {
      ar: "للمصممين، المونتيرين، المخرجين، وصنّاع المحتوى البصري من جيل Z",
      en: "For Visual Designers, Film Editors, Art Directors & Gen-Z Creators",
    },
    description: {
      ar: "يعتمد على تمرير سينمائي مثبت (Pinned Scroll) ومعرض أفقي (Horizontal Scroll Showcase) يستعرض الأعمال البصرية بحجم الشاشة الكاملة مع انتقالات فيزيائية ناعمة.",
      en: "Built around pinned scrollytelling stages and a full-bleed horizontal showcase rail that presents visual reels and creative direction with cinema-grade transitions.",
    },
    heroImage: "/images/ultra/athar-hero.webp",
    galleryImages: [
      "/images/ultra/athar-hero.webp",
      "/images/ultra/athar-1.webp",
      "/images/ultra/athar-2.webp",
    ],
    accentColor: "#C89D66",
    defaultCreatorUsername: "farida",
    features: [
      { ar: "تمرير سينمائي مثبت (Pinned Scrollytelling)", en: "Pinned Scrollytelling Camera Stages" },
      { ar: "معرض أفقي بملء الشاشة للأعمال البصرية", en: "Full-Viewport Horizontal Reel Showcase" },
      { ar: "تفاصيل الإخراج، الألوان، وكواليس الإنتاج", en: "Color Grading & Creative Direction Breakdown" },
    ],
  },
  {
    id: "haven",
    slug: "haven",
    name: { ar: "مَلاذ", en: "Haven" },
    tagline: {
      ar: "فخامة هادئة وشرائح متراكبة للعمارة والهندسة والفنون التطبيقية",
      en: "Quiet Luxury Architecture & Layered Engineering Monograph",
    },
    persona: {
      ar: "لطلاب وخريجي العمارة، الهندسة المدنية والميكانيكية، والفنون التطبيقية",
      en: "For Architecture, Engineering & Applied Arts Graduates",
    },
    description: {
      ar: "تصميم عاجي دافئ يستعرض المشاريع الهندسية والمعمارية بنظام الشرائح المتراكبة (Layered Parallax Cards) مع جدول زمني للشهادات الأكاديمية ومشاريع التخرج.",
      en: "Warm alabaster monograph presenting spatial and engineering works through layered parallax cards, material specifications, and an academic thesis timeline.",
    },
    heroImage: "/images/ultra/haven-hero.webp",
    galleryImages: [
      "/images/ultra/haven-hero.webp",
      "/images/ultra/haven-1.webp",
      "/images/ultra/haven-2.webp",
    ],
    accentColor: "#9A7B4F",
    defaultCreatorUsername: "layla",
    features: [
      { ar: "شرائح مشاريع هندسية متراكبة (Layered Parallax)", en: "Layered Parallax Architectural Cards" },
      { ar: "جدول زمني لمشاريع التخرج والشهادات الأكاديمية", en: "Academic & Graduation Thesis Timeline" },
      { ar: "بطاقات مواصفات المواد والمساحات الهندسية", en: "Materiality & Structural Blueprint Specs" },
    ],
  },
  {
    id: "siyada",
    slug: "siyada",
    name: { ar: "سِيَادَة", en: "Siyada" },
    tagline: {
      ar: "شبكة سويسرية دقيقة لخريجي القانون وإدارة الأعمال ورواد الأعمال",
      en: "Swiss 1px Editorial Grid & Executive Case-Study Identity",
    },
    persona: {
      ar: "لخريجي القانون، إدارة الأعمال، الاستشارات، ورواد الأعمال الشباب",
      en: "For Law, Business Administration, Strategy Grads & Young Founders",
    },
    description: {
      ar: "شبكة سويسرية دقيقة (1px Solid Editorial Grid) تعرض دراسات الحالة، الخبرات، والأبحاث، مع زر تفاعلي لتصدير وطباعة السيرة الذاتية ومشاركة بطاقة QR للنطاق الفرعي.",
      en: "Precision 1px Swiss editorial grid showcasing case studies, legal & venture research, interactive CV/Resume print export, and instant subdomain QR code sharing.",
    },
    heroImage: "/images/ultra/siyada-hero.webp",
    galleryImages: [
      "/images/ultra/siyada-hero.webp",
      "/images/ultra/siyada-1.webp",
      "/images/ultra/siyada-2.webp",
    ],
    accentColor: "#9A7B4F",
    defaultCreatorUsername: "karim",
    features: [
      { ar: "شبكة سويسرية دقيقة 1px Solid Editorial Grid", en: "Swiss 1px Solid Editorial Grid System" },
      { ar: "تصدير وطباعة السيرة الذاتية الفورية (Export CV)", en: "Interactive 1-Click Export & Print CV" },
      { ar: "بطاقة QR ذكية لمشاركة النطاق الفرعي", en: "Dynamic Subdomain QR Business Card" },
    ],
  },
  {
    id: "wameed",
    slug: "wameed",
    name: { ar: "وَمِيض", en: "Wameed" },
    tagline: {
      ar: "لوحة إغلاق الصفقات ومؤشرات الأداء لخبراء التلي سيلز والمبيعات",
      en: "High-Velocity Tele-Sales, SDR & Revenue Closer Command Identity",
    },
    persona: {
      ar: "لمحترفي التلي سيلز، المبيعات الهاتفية، SDRs، ومديري الحسابات (Account Executives)",
      en: "For Tele-Sales Pros, SDRs, Account Executives & High-Ticket Closers",
    },
    description: {
      ar: "يتضمن لوحة مؤشرات أداء المبيعات الحية (Quota Attainment Rings)، مخطط قمع التحويل (Call-to-Close Funnel)، مشغل صوتي تفاعلي لعينة مكالمة بيعية ناجحة، وشهادات إتقان أنظمة الـ CRM.",
      en: "Features live Quota Attainment Rings (148% Target), Call-to-Close conversion funnel, interactive 30s Winning Pitch audio player, CRM mastery badges, and instant WhatsApp/Call booking.",
    },
    heroImage: "/images/ultra/wameed-hero.webp",
    galleryImages: [
      "/images/ultra/wameed-hero.webp",
      "/images/ultra/wameed-1.webp",
      "/images/ultra/wameed-2.webp",
    ],
    accentColor: "#C89D66",
    defaultCreatorUsername: "tariq",
    features: [
      { ar: "حلقات تحقيق التارجت الحية (148% Quota Attainment)", en: "Live Quota Attainment Rings & Deal Telemetry" },
      { ar: "مشغل صوتي تفاعلي لعينة مكالمة بيعية ناجحة (30s Pitch)", en: "Interactive 30s Winning Pitch Audio Player" },
      { ar: "مخطط قمع التحويل (Call-to-Close) وحجز مكالمة واتساب", en: "Call-to-Close Funnel & Instant WhatsApp CTA" },
    ],
  },
  {
    id: "salam",
    slug: "salam",
    name: { ar: "سَلَام", en: "Salam" },
    tagline: {
      ar: "هندسة النمو، أتمتة التسويق الرقمي، ومسارات استخراج البيانات",
      en: "MarTech, Growth Engineering & Marketing Automation Identity",
    },
    persona: {
      ar: "لمتخصصي التيك في الديجيتال ماركتنج، أتمتة التسويق، واستخراج البيانات (Data Scraping)",
      en: "For MarTech Specialists, Growth Engineers, Automation & Scraping Experts",
    },
    description: {
      ar: "يستعرض خريطة تفاعلية لمسارات الأتمتة واستخراج البيانات (Automation & Scraping Nodes)، بطاقات أداء الحملات الإعلانية (ROAS, CAC, Conversion Lift)، ومقارنة تفاعلية قبل/بعد لتحسين معدل التحويل.",
      en: "Showcases interactive Automation & Data Pipeline nodes, live ROAS/CAC/Lift telemetry cards, an interactive CRO Before/After comparison toggle, and a full MarTech stack matrix.",
    },
    heroImage: "/images/ultra/salam-hero.webp",
    galleryImages: [
      "/images/ultra/salam-hero.webp",
      "/images/ultra/salam-1.webp",
      "/images/ultra/salam-2.webp",
    ],
    accentColor: "#1E3A2F",
    defaultCreatorUsername: "salma",
    features: [
      { ar: "خريطة تفاعلية لمسارات الأتمتة واستخراج البيانات", en: "Interactive Automation & Data Pipeline Nodes" },
      { ar: "مقارنة تفاعلية قبل/بعد لتحسين التحويل (CRO Before/After)", en: "Interactive CRO Before/After Split Comparator" },
      { ar: "لوحة عوائد الإعلانات الحية (ROAS, CAC & Lift)", en: "Live Campaign ROAS, CAC & Attribution Telemetry" },
    ],
  },
  {
    id: "meshwar",
    slug: "meshwar",
    name: { ar: "مِشْوَار", en: "Meshwar" },
    tagline: {
      ar: "تصميم إنساني دافئ لاستقطاب المواهب والموارد البشرية وثقافة الفرق",
      en: "Human-Centric HR, Talent Acquisition & People Operations Identity",
    },
    persona: {
      ar: "لمحترفي وخريجي الموارد البشرية، استقطاب المواهب التقنية، وعمليات الأفراد (People Ops)",
      en: "For HR Specialists, Tech Recruiters & People Operations Leaders",
    },
    description: {
      ar: "يستعرض «مِشْوَار» بناء الفرق وثقافة الشركات عبر خط زمني تفاعلي، وبطاقات أثر التوظيف (عدد التعيينات، تقليص زمن التوظيف، معدل الاستبقاء)، مع استمارة مدمجة لحجز استشارة مهنية.",
      en: "Presents your Talent & Culture Journey timeline, hiring impact scorecards (Hires Closed, Time-to-Hire Reduction, Retention Rate), and an embedded Career Advisory & Talent Nomination desk.",
    },
    heroImage: "/images/ultra/meshwar-hero.webp",
    galleryImages: [
      "/images/ultra/meshwar-hero.webp",
      "/images/ultra/meshwar-1.webp",
      "/images/ultra/meshwar-2.webp",
    ],
    accentColor: "#9A7B4F",
    defaultCreatorUsername: "nora",
    features: [
      { ar: "خط زمني تفاعلي لـ «مِشْوَار» بناء الفرق والثقافة", en: "Interactive Talent & Culture Journey Timeline" },
      { ar: "بطاقات أثر التوظيف ومعدلات الاستبقاء", en: "Hiring Velocity, Time-to-Hire & Retention KPIs" },
      { ar: "استمارة تفاعلية لحجز جلسة استشارة أو ترشيح موهبة", en: "Embedded Career Consultation & Talent Nomination Form" },
    ],
  },
];

export const SEED_PORTFOLIOS: Record<string, PortfolioData> = {
  layla: {
    username: "layla",
    template: "haven",
    avatar: "/images/creators/layla.jpg",
    cover: "/images/ultra/haven-hero.webp",
    name: {
      ar: "ليلى منصور",
      en: "Layla Mansour",
    },
    title: {
      ar: "مهندسة معمارية ومصممة فراغات متحفية ومستدامة",
      en: "Principal Spatial & Sustainable Museum Architect",
    },
    bio: {
      ar: "أصمم مساحات ثقافية ومتاحف معاصرة تحاور الضوء الطبيعي والحجر الجيري والمرمر المصري بين القاهرة وميلانو. كل مشروع هو ملاذ معماري متوازن يجمع بين الدقة الهندسية والسكينة البصرية.",
      en: "Designing contemplative cultural pavilions, sustainable stone sanctuaries, and museum spaces across Cairo and Milan where daylight and structural engineering converge.",
    },
    city: {
      ar: "القاهرة، مصر",
      en: "Cairo, Egypt",
    },
    email: "layla@taqdom.me",
    badge: {
      ar: "حساب مبدع موثّق • وسام التميز المعماري",
      en: "Verified Flagship Creator • Architectural Distinction",
    },
    skills: [
      "Rhino 3D & Grasshopper",
      "BIM / Autodesk Revit",
      "Passive Solar Engineering",
      "Parametric Stone Fabrication",
      "Museum Daylighting",
      "Structural Timber & Rammed Earth",
    ],
    isFlagshipShowcase: true,
    links: [
      { label: "ArchDaily Monograph", url: "https://archdaily.com" },
      { label: "Venice Architecture Biennale", url: "https://labiennale.org" },
      { label: "Instagram Atelier", url: "https://instagram.com" },
    ],
    metrics: [
      { label: { ar: "مشاريع معمارية وهندسية", en: "Built Spatial Works" }, value: "19" },
      { label: { ar: "مساحات ثقافية مصممة", en: "Cultural Area Engineered" }, value: "34,000m²" },
      { label: { ar: "خفض الانبعاثات الكربونية", en: "Embodied Carbon Reduction" }, value: "-42%" },
      { label: { ar: "جوائز التصميم المستدام", en: "Sustainability Honors" }, value: "08" },
    ],
    timeline: [
      {
        year: "2024 — الآن",
        role: { ar: "المؤسسة والمديرة المعمارية", en: "Founder & Principal Spatial Architect" },
        org: { ar: "مرسم ملاذ للعمارة المعاصرة — القاهرة وميلانو", en: "Haven Spatial Practice — Cairo & Milan" },
        summary: {
          ar: "قيادة تصميم المتاحف الخاصة والأجنحة الثقافية والمباني البيئية المكتفية ذاتياً بالطاقة.",
          en: "Directing museum architecture, net-zero desert sanctuaries, and parametric stone structures.",
        },
      },
      {
        year: "2022 — 2024",
        role: { ar: "ماجستير العمارة البيئية والتصميم البارامتري", en: "M.Arch in Sustainable Spatial Engineering" },
        org: { ar: "جامعة بوليتكنيكو دي ميلانو", en: "Politecnico di Milano — Honours Thesis" },
        summary: {
          ar: "بحث تخرج بامتياز مع مرتبة الشرف حول التبريد الطبيعي بالرياح في العمارة الصحراوية.",
          en: "Summa Cum Laude thesis on aerodynamic wind-catcher geometries in arid stone architecture.",
        },
      },
      {
        year: "2017 — 2022",
        role: { ar: "بكالوريوس الهندسة المعمارية (الأولى على الدفعة)", en: "B.Sc. in Architectural Engineering (Valedictorian)" },
        org: { ar: "كلية الهندسة — جامعة القاهرة", en: "Cairo University — Faculty of Engineering" },
        summary: {
          ar: "مشروع تخرج «متحف الضوء والبازلت في أسوان» الحائز على جائزة التميز الهندسي.",
          en: "Graduation thesis 'Aswan Basalt & Light Sanctuary' awarded the National Engineering Medal.",
        },
      },
    ],
    projects: [
      {
        id: "layla-1",
        title: {
          ar: "متحف الضوء والبازلت — أسوان",
          en: "Basalt & Light Sanctuary — Aswan",
        },
        desc: {
          ar: "مركز ثقافي مطل على النيل يستخدم الجرانيت الأسواني والفتحات السماوية الدقيقة لتوجيه أشعة الشمس على المنحوتات دون حرارة مباشرة.",
          en: "Nile-side cultural sanctuary utilizing hand-dressed Aswan granite and calibrated oculus apertures for museum-grade natural illumination.",
        },
        year: "2026",
        images: [
          "/images/ultra/haven-hero.webp",
          "/images/ultra/haven-1.webp",
          "/images/ultra/haven-2.webp",
        ],
        tags: ["Museum Architecture", "Aswan Granite", "Daylighting"],
        client: { ar: "مؤسسة التراث النوبي المعاصر", en: "Nubian Heritage Foundation" },
        metrics: "4,200m² • LEED Platinum",
        url: "https://layla.taqdom.me",
      },
      {
        id: "layla-2",
        title: {
          ar: "بيت الكثبان المعلق — رأس الحكمة",
          en: "Dune Cantilever Residence — Ras El Hekma",
        },
        desc: {
          ar: "كتلة معمارية من الحجر الجيري المصري تندمج مع الكثبان الرملية الساحلية وتوفر تهوية طبيعية متقاطعة طوال العام.",
          en: "Cantilevered limestone volume embedded within Mediterranean coastal dunes with passive cross-ventilation and reflection courtyards.",
        },
        year: "2025",
        images: [
          "/images/ultra/haven-1.webp",
          "/images/ultra/haven-2.webp",
          "/images/ultra/haven-hero.webp",
        ],
        tags: ["Residential", "Passive Cooling", "Limestone"],
        client: { ar: "مجموعة الساحل المعمارية", en: "North Coast Atelier" },
        metrics: "Zero Net Energy • 980m²",
      },
      {
        id: "layla-3",
        title: {
          ar: "جناح السكينة الحجرية — أسبوع ميلانو للتصميم",
          en: "Alabaster Silence Pavilion — Milan Design Week",
        },
        desc: {
          ar: "تركيب معماري من المرمر المصري المشغول يدوياً والماء الضحل يعكس السماء ويخلق واحة هدوء وسط ميلانو.",
          en: "Modular translucent Egyptian alabaster and shallow water pavilion exhibited in central Milan.",
        },
        year: "2024",
        images: [
          "/images/ultra/haven-2.webp",
          "/images/ultra/haven-hero.webp",
          "/images/ultra/haven-1.webp",
        ],
        tags: ["Pavilion", "Egyptian Alabaster", "Milan"],
        client: { ar: "معرض ميلانو الدولي", en: "Fuorisalone Curatorial Board" },
        metrics: "85,000+ Visitors",
      },
    ],
    theme: {
      mode: "light",
      accent: "#9A7B4F",
      scene3d: { enabled: false, intensity: 1.0, speed: 0.8, lightAngle: 35 },
    },
    seo: {
      title: "ليلى منصور | Layla Mansour — مهندسة معمارية | تَقَدُّم",
      description: "المعرض المعماري الرسمي للمهندسة ليلى منصور بقالب مَلاذ (Haven) على منصة تَقَدُّم.",
      keywords: ["ليلى منصور", "Layla Mansour", "عمارة", "Haven", "Taqdom"],
      noindex: false,
    },
    defaultLang: "ar",
    publishedAt: 1762000000000,
    updatedAt: 1762000000000,
    views: 12840,
  },

  youssef: {
    username: "youssef",
    template: "madar",
    avatar: "/images/creators/youssef.jpg",
    cover: "/images/ultra/madar-hero.webp",
    name: {
      ar: "يوسف الشاذلي",
      en: "Youssef El-Shazly",
    },
    title: {
      ar: "مهندس ذكاء اصطناعي ومطوّر أنظمة سحابية موزعة",
      en: "AI Systems Engineer & Full-Stack Computer Science Grad",
    },
    bio: {
      ar: "خريج علوم الحاسب بمرتبة الشرف وباحث في النماذج اللغوية العربية (Arabic LLMs) والحوسبة الطرفية. فائز بـ ٦ هاكاثونات دولية وأبني أدوات برمجية فائقة السرعة.",
      en: "Computer Science honors graduate specializing in Arabic LLM inference, Rust/TypeScript edge systems, and real-time neural interfaces. 6x Global Hackathon Winner.",
    },
    city: {
      ar: "القاهرة، مصر",
      en: "Cairo, Egypt",
    },
    email: "youssef@taqdom.me",
    badge: {
      ar: "متاح للتدريب والفرص الوظيفية • Available for Internships & Roles",
      en: "Available for Internships & Roles • Open to Relocation",
    },
    skills: [
      "PyTorch & CUDA",
      "TypeScript & Next.js 16",
      "Rust & WebAssembly",
      "Cloudflare Workers & D1",
      "RAG & Vector Engines",
      "Docker & Kubernetes",
      "GraphQL & gRPC",
      "LangGraph Agents",
    ],
    isFlagshipShowcase: true,
    links: [
      { label: "GitHub (@youssef-ai)", url: "https://github.com/abdullahyelsayed-cpu" },
      { label: "HuggingFace Models", url: "https://huggingface.co" },
      { label: "LinkedIn", url: "https://linkedin.com" },
    ],
    metrics: [
      { label: { ar: "هاكاثونات دولية فائزة", en: "Hackathons Won" }, value: "06" },
      { label: { ar: "مساهمات GitHub السنوية", en: "GitHub Contributions" }, value: "2,480+" },
      { label: { ar: "نجوم المشاريع مفتوحة المصدر", en: "Open-Source Stars" }, value: "3.9k" },
      { label: { ar: "زمن استجابة الاستدلال", en: "P99 Edge Latency" }, value: "14ms" },
    ],
    timeline: [
      {
        year: "2025 — 2026",
        role: { ar: "مهندس ذكاء اصطناعي متدرب (AI Research Intern)", en: "AI Inference Engineering Intern" },
        org: { ar: "مختبر مدار للحوسبة العصبية", en: "Madar Neural Compute Lab" },
        summary: {
          ar: "تسريع نماذج الرؤية واللغة العربية بنسبة ٣٤٠٪ باستخدام تكميم الأوزان (AWQ 4-bit).",
          en: "Accelerated Arabic vision-language transformers by 3.4x via custom INT4 CUDA kernels.",
        },
      },
      {
        year: "2022 — 2026",
        role: { ar: "بكالوريوس علوم الحاسب والذكاء الاصطناعي (GPA 3.96/4.0)", en: "B.Sc. Computer Science & AI (GPA 3.96/4.0)" },
        org: { ar: "كلية الحاسبات والذكاء الاصطناعي", en: "Faculty of Computer Science & AI" },
        summary: {
          ar: "رئيس نادي المطورين وأول الدفعة في هندسة الخوارزميات والنظم الموزعة.",
          en: "Lead of University AI Society; built an autonomous multi-agent compiler for graduation project.",
        },
      },
    ],
    projects: [
      {
        id: "youssef-1",
        title: {
          ar: "محرك «بَصِيرَة» — استدلال عربي فائق السرعة على الحافة",
          en: "Baseera Engine — Sub-20ms Arabic LLM Edge Runtime",
        },
        desc: {
          ar: "مكتبة مفتوحة المصدر بلغة Rust وWebGPU لتشغيل نماذج اللغة العربية محلياً وعلى خوادم الحافة بأقل استهلاك للذاكرة.",
          en: "Open-source Rust + WebGPU inference runtime executing quantized 7B Arabic models at 95 tokens/sec.",
        },
        year: "2026",
        images: ["/images/ultra/madar-hero.webp", "/images/ultra/madar-1.webp"],
        tags: ["Rust & WebAssembly", "PyTorch & CUDA", "Cloudflare Workers & D1", "Arabic LLM"],
        metrics: "2,100+ GitHub Stars • 95 tok/s",
        url: "https://github.com/abdullahyelsayed-cpu",
      },
      {
        id: "youssef-2",
        title: {
          ar: "منصة «نَبْض» لتشخيص صور الأشعة بالذكاء الاصطناعي",
          en: "Nabd MedVision — Multi-Modal Radiology Copilot",
        },
        desc: {
          ar: "المشروع الفائز بالمركز الأول في هاكاثون الذكاء الاصطناعي الطبي بمشاركة ٤٠٠ فريق من ١٨ دولة.",
          en: "1st Place winner across 400 teams: real-time chest X-ray anomaly segmentation with explainable attention maps.",
        },
        year: "2025",
        images: ["/images/ultra/madar-1.webp", "/images/ultra/madar-2.webp"],
        tags: ["PyTorch & CUDA", "LangGraph Agents", "Docker & Kubernetes", "TypeScript & Next.js 16"],
        metrics: "1st Place Global Hackathon • 98.4% AUC",
      },
      {
        id: "youssef-3",
        title: {
          ar: "قاعدة بيانات «شِهاب» الموزعة للمتجهات (Vector DB)",
          en: "ShihabDB — Distributed HNSW Vector Index",
        },
        desc: {
          ar: "محرك بحث دلالي يدعم ملايين المتجهات مع توافق كامل مع Cloudflare Workers وبروتوكول Raft.",
          en: "Zero-dependency HNSW vector search engine engineered for serverless edge deployments.",
        },
        year: "2025",
        images: ["/images/ultra/madar-2.webp", "/images/ultra/madar-hero.webp"],
        tags: ["RAG & Vector Engines", "TypeScript & Next.js 16", "Cloudflare Workers & D1", "GraphQL & gRPC"],
        metrics: "14ms P99 Query Time",
      },
    ],
    theme: {
      mode: "dark",
      accent: "#C89D66",
      scene3d: { enabled: false, intensity: 1.0, speed: 1.0, lightAngle: 45 },
    },
    seo: {
      title: "يوسف الشاذلي | Youssef El-Shazly — مهندس ذكاء اصطناعي | تَقَدُّم",
      description: "معرض المشاريع البرمجية والذكاء الاصطناعي للمهندس يوسف الشاذلي بقالب مَدَار على تَقَدُّم.",
      keywords: ["يوسف الشاذلي", "Youssef El-Shazly", "AI Engineer", "Madar", "Taqdom"],
    },
    defaultLang: "ar",
    publishedAt: 1761900000000,
    updatedAt: 1761900000000,
    views: 9420,
  },

  farida: {
    username: "farida",
    template: "athar",
    avatar: "/images/creators/farida.jpg",
    cover: "/images/ultra/athar-hero.webp",
    name: {
      ar: "فريدة رفعت",
      en: "Farida Refaat",
    },
    title: {
      ar: "مخرجة إبداعية ومصممة تجارب بصرية وسينمائية",
      en: "Creative Director, Visual Storyteller & Film Editor",
    },
    bio: {
      ar: "أصنع أفلاماً قصيرة، هويات حركية، وتجارب بصرية سينمائية تمزج السرد الدرامي بالمونتاج الإيقاعي وتصحيح الألوان المتقدم بين القاهرة وبرلين.",
      en: "Directing narrative visual campaigns, title sequences, and cinema-grade scrollytelling experiences across Cairo, El Gouna, and Berlin.",
    },
    city: {
      ar: "القاهرة • برلين",
      en: "Cairo • Berlin",
    },
    email: "farida@taqdom.me",
    badge: {
      ar: "حساب مبدع موثّق • اختيار المهرجانات البصرية",
      en: "Verified Creator • Official Festival Selection",
    },
    skills: [
      "Creative Direction",
      "DaVinci Resolve Studio",
      "Cinema 4D & Redshift",
      "After Effects & Motion",
      "Anamorphic Cinematography",
      "Sound Design & Foley",
    ],
    isFlagshipShowcase: true,
    links: [
      { label: "Vimeo Staff Picks", url: "https://vimeo.com" },
      { label: "Behance Featured", url: "https://behance.net" },
      { label: "Instagram Visuals", url: "https://instagram.com" },
    ],
    metrics: [
      { label: { ar: "عروض وأفلام بصرية", en: "Visual Reels Directed" }, value: "28" },
      { label: { ar: "اختيارات مهرجانات دولية", en: "Festival Selections" }, value: "14" },
      { label: { ar: "إجمالي المشاهدات", en: "Organic Views" }, value: "6.4M+" },
      { label: { ar: "نسبة الكادر السينمائي", en: "Signature Ratio" }, value: "2.39:1" },
    ],
    timeline: [
      {
        year: "2024 — الآن",
        role: { ar: "مخرجة إبداعية ومؤسسة استوديو أثر البصري", en: "Founder & Creative Director" },
        org: { ar: "استوديو أثر للصورة المتحركة", en: "Athar Moving Image Atelier" },
        summary: {
          ar: "إخراج الحملات البصرية والأفلام الوثائقية القصيرة للعلامات الثقافية والفنية.",
          en: "Directing visual anthems, fashion films, and documentary shorts shot on 35mm and digital cinema.",
        },
      },
      {
        year: "2021 — 2024",
        role: { ar: "كبيرة مصممي الموشن والمونتاج السينمائي", en: "Lead Film Editor & Colorist" },
        org: { ar: "كايرو فيلم لاب", en: "Cairo Nocturne Film Lab" },
        summary: {
          ar: "قيادة غرف المونتاج وتصحيح الألوان لأكثر من ٢٠ عملاً سينمائياً وإعلانياً.",
          en: "Supervised editorial cut and HDR color grading pipelines for 20+ regional productions.",
        },
      },
    ],
    projects: [
      {
        id: "farida-1",
        title: {
          ar: "«صدى الصحراء» — فيلم بصري قصير (Anamorphic 35mm)",
          en: "Echoes of Siwa — Anamorphic 35mm Visual Poem",
        },
        desc: {
          ar: "رحلة سينمائية بصرية ترصد تحولات الضوء والظل والموسيقى الفلكلورية في واحة سيوة عند الغروب.",
          en: "Anamorphic 2.39:1 visual odyssey capturing twilight choreography and acoustic traditions in Siwa Oasis.",
        },
        year: "2026",
        images: [
          "/images/ultra/athar-hero.webp",
          "/images/ultra/athar-1.webp",
          "/images/ultra/athar-2.webp",
        ],
        tags: ["Directing", "35mm Anamorphic", "Color Grading"],
        metrics: "SCENE 01 • ARRI Alexa 35 • 4K RAW",
      },
      {
        id: "farida-2",
        title: {
          ar: "الهوية الحركية لمهرجان القاهرة للفنون المعاصرة",
          en: "Cairo Contemporary Arts Triennale — Motion Identity",
        },
        desc: {
          ar: "تصميم التترات الافتتاحية، الفواصل البصرية ثلاثية الأبعاد، وشاشات العرض الغامرة للمهرجان.",
          en: "Complete kinetic typography, 3D title sequence, and multi-screen exhibition projection design.",
        },
        year: "2025",
        images: [
          "/images/ultra/athar-1.webp",
          "/images/ultra/athar-2.webp",
          "/images/ultra/athar-hero.webp",
        ],
        tags: ["Motion Design", "Cinema 4D", "Exhibition"],
        metrics: "SCENE 02 • 120fps Spatial Projection",
      },
      {
        id: "farida-3",
        title: {
          ar: "حملة «ليل الأوبسيديان» — إخراج فني لدار أزياء",
          en: "Obsidian Nocturne — Editorial Fashion Film",
        },
        desc: {
          ar: "فيلم أزياء تحريري يعتمد على التباين الدرامي العالي وحركة الكاميرا المستمرة في شوارع وسط البلد التاريخية.",
          en: "Single-take steadicam fashion film blending Khedive Cairo architecture with avant-garde silhouettes.",
        },
        year: "2025",
        images: [
          "/images/ultra/athar-2.webp",
          "/images/ultra/athar-hero.webp",
          "/images/ultra/athar-1.webp",
        ],
        tags: ["Fashion Film", "Steadicam", "Sound Design"],
        metrics: "SCENE 03 • Vimeo Staff Pick",
      },
    ],
    theme: {
      mode: "dark",
      accent: "#C89D66",
      scene3d: { enabled: false, intensity: 1.2, speed: 1.0, lightAngle: 48 },
    },
    seo: {
      title: "فريدة رفعت | Farida Refaat — مخرجة إبداعية | تَقَدُّم",
      description: "معرض الأعمال البصرية والسينمائية للمخرجة فريدة رفعت بقالب أَثَر على منصة تَقَدُّم.",
      keywords: ["فريدة رفعت", "Farida Refaat", "Creative Director", "Athar", "Taqdom"],
    },
    defaultLang: "ar",
    publishedAt: 1761800000000,
    updatedAt: 1761800000000,
    views: 8740,
  },

  karim: {
    username: "karim",
    template: "siyada",
    avatar: "/images/creators/karim.jpg",
    cover: "/images/ultra/siyada-hero.webp",
    name: {
      ar: "كريم عادل",
      en: "Karim Adel",
    },
    title: {
      ar: "مستشار استراتيجي وباحث في قانون الشركات وريادة الأعمال",
      en: "Corporate Strategy Advisor, Venture Fellow & Law Graduate",
    },
    bio: {
      ar: "خريج قانون وإدارة أعمال دولية، متخصص في هيكلة جولات الاستثمار الجريء (VC)، الحوكمة المؤسسية، ودراسات الحالة الاقتصادية للشركات الناشئة في الشرق الأوسط.",
      en: "Corporate Law & Strategy graduate advising high-growth MENA startups on Series A/B structuring, M&A governance, and cross-border regulatory frameworks.",
    },
    city: {
      ar: "القاهرة • دبي",
      en: "Cairo • Dubai DIFC",
    },
    email: "karim@taqdom.me",
    badge: {
      ar: "حساب مبدع موثّق • الفئة التنفيذية والقانونية",
      en: "Verified Executive Profile • Law & Venture Strategy",
    },
    skills: [
      "Venture Capital Structuring",
      "M&A Due Diligence",
      "Corporate Governance",
      "Financial Modeling",
      "International Arbitration",
      "Public Policy Research",
    ],
    isFlagshipShowcase: true,
    links: [
      { label: "LinkedIn Executive", url: "https://linkedin.com" },
      { label: "SSRN Legal Papers", url: "https://ssrn.com" },
    ],
    metrics: [
      { label: { ar: "صفقات واستشارات مهيكلة", en: "Deals & Mandates Structured" }, value: "$85M+" },
      { label: { ar: "دراسات حالة وأبحاث منشورة", en: "Published Case Studies" }, value: "14" },
      { label: { ar: "شركات ناشئة تم توجيهها", en: "Ventures Advised" }, value: "22" },
      { label: { ar: "الأسواق التنظيمية", en: "Jurisdictions" }, value: "EG • UAE • KSA" },
    ],
    timeline: [
      {
        year: "2024 — الآن",
        role: { ar: "زميل استثمار واستراتيجية قانونية", en: "Venture Strategy & Legal Associate" },
        org: { ar: "أوريكس كابيتال — مركز دبي المالي العالمي", en: "Oryx Sovereign Advisory — DIFC" },
        summary: {
          ar: "إعداد دراسات الجدوى، عقود المساهمين، وهيكلة الصناديق الاستثمارية للشركات التقنية.",
          en: "Structuring cross-border term sheets, SPVs, and regulatory compliance across DIFC, ADGM, and Cairo.",
        },
      },
      {
        year: "2020 — 2024",
        role: { ar: "بكالوريوس القانون والاقتصاد الدولي (مرتبة الشرف الأولى)", en: "LL.B. & B.A. in International Law & Economics" },
        org: { ar: "القسم الإنجليزي — كلية الحقوق والاقتصاد", en: "Faculty of Law & Political Economy — Honours" },
        summary: {
          ar: "رئيس فريق التحكيم التجاري الدولي في مسابقة Willem C. Vis بفيينا.",
          en: "Lead oralist at the Willem C. Vis International Commercial Arbitration Moot in Vienna.",
        },
      },
    ],
    projects: [
      {
        id: "karim-1",
        title: {
          ar: "دراسة حالة: هيكلة الاستحواذ العابر للحدود في التكنولوجيا المالية",
          en: "Case Study 01: Cross-Border FinTech Acquisition & Regulatory Sandbox",
        },
        desc: {
          ar: "تحليل قانوني ومالي شامل لعملية اندماج بقيمة ٣٢ مليون دولار بين شركتين للدفع الإلكتروني في مصر والإمارات مع تقليص المخاطر الضريبية بنسبة ٢٨٪.",
          en: "Comprehensive legal and financial structuring for a $32M FinTech merger across Central Bank regulatory sandboxes.",
        },
        year: "2026",
        images: ["/images/ultra/siyada-hero.webp", "/images/ultra/siyada-1.webp"],
        tags: ["M&A Strategy", "FinTech Law", "Case Study"],
        client: { ar: "تقرير السياسات الاستثمارية", en: "MENA Venture Policy Review" },
        metrics: "$32M Transaction • -28% Tax Friction",
      },
      {
        id: "karim-2",
        title: {
          ar: "بحث محكّم: إطار حوكمة الذكاء الاصطناعي في القطاع المصرفي",
          en: "Case Study 02: Sovereign AI Governance & Banking Compliance Framework",
        },
        desc: {
          ar: "ورقة بحثية منشورة تضع معايير الامتثال القانوني وحماية البيانات عند نشر نماذج الائتمان الذكية في البنوك العربية.",
          en: "Published regulatory blueprint establishing algorithmic auditability and data sovereignty for regional banks.",
        },
        year: "2025",
        images: ["/images/ultra/siyada-1.webp", "/images/ultra/siyada-2.webp"],
        tags: ["AI Regulation", "Banking Compliance", "Published Research"],
        metrics: "Adopted by 6 Financial Institutions",
      },
    ],
    theme: {
      mode: "light",
      accent: "#9A7B4F",
      scene3d: { enabled: false, intensity: 1.0, speed: 0.9, lightAngle: 45 },
    },
    seo: {
      title: "كريم عادل | Karim Adel — مستشار استراتيجي وقانوني | تَقَدُّم",
      description: "الملف التنفيذي ودراسات الحالة للمستشار كريم عادل بقالب سِيَادَة السويسري على منصة تَقَدُّم.",
      keywords: ["كريم عادل", "Karim Adel", "Siyada", "Law Portfolio", "Taqdom"],
    },
    defaultLang: "ar",
    publishedAt: 1761700000000,
    updatedAt: 1761700000000,
    views: 7310,
  },

  tariq: {
    username: "tariq",
    template: "wameed",
    avatar: "/images/creators/tariq.jpg",
    cover: "/images/ultra/wameed-hero.webp",
    name: {
      ar: "طارق الجارحي",
      en: "Tariq El-Garhy",
    },
    title: {
      ar: "خبير إغلاق مبيعات هاتفية وتطوير أعمال (Senior Tele-Sales Closer & AE)",
      en: "Senior Tele-Sales Closer, Enterprise SDR & Revenue Account Executive",
    },
    bio: {
      ar: "أحوّل المكالمات الباردة والعملاء المحتملين إلى عقود سنوية مغلقة. خبرة ٦ سنوات في قيادة فرق التلي سيلز وإغلاق صفقات الـ SaaS والعقارات الفاخرة بنسبة تحقيق تارجت ١٤٨٪.",
      en: "Turning cold outbound dials and high-intent leads into closed enterprise revenue. 6+ years of high-velocity Tele-Sales, objection handling, and 148% quota attainment across MENA & GCC.",
    },
    city: {
      ar: "القاهرة • الرياض",
      en: "Cairo • Riyadh",
    },
    email: "tariq@taqdom.me",
    badge: {
      ar: "متاح لقيادة المبيعات وإغلاق الصفقات • Top 1% Revenue Closer",
      en: "Top 1% Revenue Closer • 148% Annual Quota Achieved",
    },
    skills: [
      "Salesforce CRM",
      "HubSpot Sales Hub",
      "Pipedrive & Apollo.io",
      "Aircall & CloudTalk VoIP",
      "SPIN & Challenger Selling",
      "High-Ticket Cold Calling",
      "Objection Neutralization",
      "B2B & Real Estate Closing",
    ],
    isFlagshipShowcase: true,
    links: [
      { label: "WhatsApp Direct (+201000000000)", url: "https://wa.me/201000000000" },
      { label: "Book 15-Min Discovery Call", url: "https://cal.com" },
      { label: "LinkedIn Sales Leader", url: "https://linkedin.com" },
    ],
    metrics: [
      { label: { ar: "نسبة تحقيق التارجت السنوي", en: "Quota Attainment" }, value: "148%" },
      { label: { ar: "إجمالي المبيعات المغلقة", en: "Closed-Won Revenue" }, value: "$2.4M+" },
      { label: { ar: "معدل تحويل المكالمات لصفقات", en: "Call-to-Close Rate" }, value: "31.5%" },
      { label: { ar: "متوسط المكالمات الفعالة يومياً", en: "Daily High-Intent Dials" }, value: "85+" },
    ],
    timeline: [
      {
        year: "2024 — الآن",
        role: { ar: "كبير مسؤولي إغلاق المبيعات الهاتفية (Senior Revenue Closer)", en: "Senior Tele-Sales Closer & Team Lead" },
        org: { ar: "قمة الخليج للحلول السحابية والعقارية", en: "Qimma Enterprise Cloud & PropTech — Riyadh" },
        summary: {
          ar: "قيادة فريق من ١٢ مختص تلي سيلز وتحقيق أعلى مبيعات ربع سنوية في تاريخ الشركة لـ ٥ أرباع متتالية.",
          en: "Leading a 12-seat outbound Tele-Sales pod; ranked #1 Account Executive for 5 consecutive quarters.",
        },
      },
      {
        year: "2021 — 2024",
        role: { ar: "أخصائي تطوير مبيعات هاتفية (Outbound SDR)", en: "Senior Outbound SDR & Deal Specialist" },
        org: { ar: "وَمِيض تك — القاهرة", en: "Wameed SaaS Growth — Cairo" },
        summary: {
          ar: "بناء سكريبتات البيع الهاتفي ومعالجة الاعتراضات التي رفعت نسبة حجز الاجتماعات بنسبة ٢١٠٪.",
          en: "Authored cold-call playbooks and objection-handling matrices that lifted demo show-rates to 88%.",
        },
      },
    ],
    projects: [
      {
        id: "tariq-1",
        title: {
          ar: "حملة إغلاق عقود SaaS للشركات الكبرى في السعودية والخليج",
          en: "GCC Enterprise SaaS Outbound Blitz — $1.4M Closed-Won",
        },
        desc: {
          ar: "تصميم وتنفيذ استراتيجية اتصال مباشر استهدفت ٤٥٠ مديراً تنفيذياً، وأثمرت عن ١١٠ عروض حية وإغلاق ٤٢ عقداً سنوياً.",
          en: "Executed a precision cold-to-close tele-sales campaign across 450 C-level prospects, closing 42 annual enterprise contracts.",
        },
        year: "2026",
        images: ["/images/ultra/wameed-hero.webp", "/images/ultra/wameed-1.webp"],
        tags: ["Enterprise Tele-Sales", "Salesforce", "GCC Market"],
        metrics: "148% Quota • 21-Day Sales Cycle",
      },
      {
        id: "tariq-2",
        title: {
          ar: "منظومة سكريبتات «الـ ٣٠ ثانية الذهبية» لمعالجة الاعتراضات",
          en: "The 30-Second Golden Hook & Objection Playbook",
        },
        desc: {
          ar: "دليل تشغيلي متكامل لفرق التلي سيلز يحوّل اعتراض «السعر مرتفع / أرسل التفاصيل على واتساب» إلى التزام فوري بالاجتماع.",
          en: "Battle-tested tele-sales script architecture converting 'send me an email' objections into committed discovery calls.",
        },
        year: "2025",
        images: ["/images/ultra/wameed-1.webp", "/images/ultra/wameed-2.webp"],
        tags: ["Pitch Engineering", "Objection Handling", "HubSpot"],
        metrics: "+185% Call-to-Demo Conversion",
      },
    ],
    theme: {
      mode: "dark",
      accent: "#C89D66",
      scene3d: { enabled: false, intensity: 1.0, speed: 1.0, lightAngle: 45 },
    },
    seo: {
      title: "طارق الجارحي | Tariq El-Garhy — خبير التلي سيلز وإغلاق المبيعات | تَقَدُّم",
      description: "معرض إنجازات المبيعات الهاتفية ومؤشرات إغلاق الصفقات لخبير التلي سيلز طارق الجارحي بقالب وَمِيض.",
      keywords: ["طارق الجارحي", "Tariq El-Garhy", "Tele-Sales", "Wameed", "Sales Portfolio"],
    },
    defaultLang: "ar",
    publishedAt: 1761650000000,
    updatedAt: 1761650000000,
    views: 8120,
  },

  salma: {
    username: "salma",
    template: "salam",
    avatar: "/images/creators/salma.jpg",
    cover: "/images/ultra/salam-hero.webp",
    name: {
      ar: "سلمى عبد الرحمن",
      en: "Salma Abdelrahman",
    },
    title: {
      ar: "مهندسة نمو وتقنيات تسويق رقمي وأتمتة بيانات (MarTech & Growth Engineer)",
      en: "Principal MarTech Architect, Growth Engineer & Data Scraping Specialist",
    },
    bio: {
      ar: "أربط البرمجة بالديجيتال ماركتنج لبناء محركات نمو آلية. متخصصة في استخراج وإثراء بيانات العملاء (Data Scraping & Clay/n8n)، التتبع السحابي Server-Side GTM، ومضاعفة العائد الإعلاني ROAS.",
      en: "Bridging software engineering and performance marketing. I architect automated scraping pipelines, Server-Side GTM/CAPI attribution, and high-converting growth loops.",
    },
    city: {
      ar: "القاهرة • دبي",
      en: "Cairo • Dubai",
    },
    email: "salma@taqdom.me",
    badge: {
      ar: "خبيرة MarTech وأتمتة نمو موثّقة • 6.8x Average ROAS",
      en: "Verified MarTech Engineer • 6.8x Blended ROAS",
    },
    skills: [
      "Server-Side GTM & Meta CAPI",
      "n8n, Make & Clay.com",
      "Python & Playwright Scraping",
      "BigQuery SQL & Looker Studio",
      "HubSpot & Segment CDP",
      "CRO & A/B Experimentation",
      "TikTok & Google Ads API",
      "Next.js Landing Funnels",
    ],
    isFlagshipShowcase: true,
    links: [
      { label: "MarTech Architecture GitHub", url: "https://github.com/abdullahyelsayed-cpu" },
      { label: "Growth Case Studies", url: "https://linkedin.com" },
    ],
    metrics: [
      { label: { ar: "متوسط العائد على الإنفاق الإعلاني", en: "Blended Campaign ROAS" }, value: "6.8x" },
      { label: { ar: "خفض تكلفة الاستحواذ (CAC)", en: "Customer CAC Reduction" }, value: "-44%" },
      { label: { ar: "نمو معدل التحويل (CRO Lift)", en: "Landing Page CRO Lift" }, value: "+184%" },
      { label: { ar: "سجلات بيانات مؤتمتة شهرياً", en: "Automated Leads Enriched/Mo" }, value: "250k+" },
    ],
    timeline: [
      {
        year: "2024 — الآن",
        role: { ar: "كبيرة مهندسي تكنولوجيا التسويق والنمو (Head of MarTech)", en: "Lead MarTech & Growth Automation Engineer" },
        org: { ar: "سَلَام جروث لابز — القاهرة ودبي", en: "Salam Growth Engineering Labs" },
        summary: {
          ar: "بناء أنظمة التتبع السحابي وأتمتة استخراج بيانات الشركات لـ ٣٥ علامة تجارية في التجارة الإلكترونية والـ B2B.",
          en: "Engineered server-side attribution and automated B2B lead-scraping pipelines for 35+ high-growth brands.",
        },
      },
      {
        year: "2021 — 2024",
        role: { ar: "أخصائية تسويق أدائي وتحليل بيانات تسويقية", en: "Performance Marketing & Analytics Technologist" },
        org: { ar: "نوفا ديجيتال ميديا", en: "Nova Digital Performance" },
        summary: {
          ar: "إدارة ميزانيات إعلانية تتجاوز ٣ ملايين دولار مع بناء لوحات تحكم لحظية في BigQuery.",
          en: "Managed $3M+ ad spend while building automated BigQuery attribution and CRO split-testing frameworks.",
        },
      },
    ],
    projects: [
      {
        id: "salma-1",
        title: {
          ar: "منظومة استخراج وإثراء بيانات العملاء بالذكاء الاصطناعي (Playwright + Clay + n8n)",
          en: "Autonomous B2B Lead Scraping & AI Enrichment Pipeline",
        },
        desc: {
          ar: "بناء خط أنابيب آلي يستخرج بيانات الشركات المستهدفة، يتحقق من البريد والهاتف، ويصيغ رسائل مخصصة ترفع معدل الرد إلى ٢٤٪.",
          en: "End-to-end Playwright + n8n + Clay pipeline scraping, verifying, and scoring 50,000+ B2B prospects monthly with zero manual entry.",
        },
        year: "2026",
        images: ["/images/ultra/salam-hero.webp", "/images/ultra/salam-1.webp"],
        tags: ["Data Scraping", "n8n Automation", "Clay", "Python"],
        metrics: "250k Enriched Leads • 24.2% Reply Rate",
      },
      {
        id: "salma-2",
        title: {
          ar: "معمارية التتبع السحابي Server-Side GTM + Meta/TikTok CAPI",
          en: "First-Party Server-Side GTM & CAPI Attribution Engine",
        },
        desc: {
          ar: "استعادة دقة تتبع التحويلات المفقودة بسبب حظر ملفات الارتباط (iOS 17+ / AdBlockers) مما رفع العائد الإعلاني ROAS من 2.9x إلى 6.8x.",
          en: "Restored 99.2% event match quality across Meta & TikTok CAPI via custom Cloudflare Worker + Server-Side GTM containers.",
        },
        year: "2025",
        images: ["/images/ultra/salam-1.webp", "/images/ultra/salam-2.webp"],
        tags: ["Server-Side GTM", "Meta CAPI", "BigQuery", "ROAS"],
        metrics: "ROAS 2.9x → 6.8x • 99.2% Event Match",
      },
    ],
    theme: {
      mode: "light",
      accent: "#1E3A2F",
      scene3d: { enabled: false, intensity: 1.0, speed: 1.0, lightAngle: 45 },
    },
    seo: {
      title: "سلمى عبد الرحمن | Salma Abdelrahman — مهندسة MarTech ونمو رقمي | تَقَدُّم",
      description: "معرض أعمال تكنولوجيا التسويق الرقمي وأتمتة البيانات للمهندسة سلمى عبد الرحمن بقالب سَلَام.",
      keywords: ["سلمى عبد الرحمن", "Salma Abdelrahman", "MarTech", "Salam", "Digital Marketing Tech"],
    },
    defaultLang: "ar",
    publishedAt: 1761620000000,
    updatedAt: 1761620000000,
    views: 7890,
  },

  nora: {
    username: "nora",
    template: "meshwar",
    avatar: "/images/creators/nora.jpg",
    cover: "/images/ultra/meshwar-hero.webp",
    name: {
      ar: "نورا الهاشمي",
      en: "Nora El-Hashemi",
    },
    title: {
      ar: "مديرة استقطاب المواهب التقنية وبناء ثقافة الفرق (Head of Talent & People Ops)",
      en: "Head of Technical Talent Acquisition & People Operations",
    },
    bio: {
      ar: "أؤمن أن أعظم الشركات تُبنى بالعقول الشغوفة والثقافة الإنسانية الداعمة. على مدار مِشْوَاري المهني، قُدت توظيف أكثر من ٣٤٠ مهندساً وقائداً في شركات التكنولوجيا مع معدل استبقاء ٩٦.٤٪.",
      en: "Building world-class engineering and product teams across MENA & Europe. Over my career journey, I have scaled startups from Seed to 300+ people while maintaining a 96.4% talent retention rate.",
    },
    city: {
      ar: "القاهرة • أمستردام",
      en: "Cairo • Amsterdam",
    },
    email: "nora@taqdom.me",
    badge: {
      ar: "خبيرة موارد بشرية واستقطاب مواهب موثّقة • People First Leader",
      en: "Verified People Ops Leader • 340+ Tech Hires Closed",
    },
    skills: [
      "Technical Executive Search",
      "Employer Branding",
      "Greenhouse & Lever ATS",
      "Compensation & Equity Design",
      "Onboarding & Culture Architecture",
      "Competency-Based Interviewing",
      "HR Analytics & OKRs",
      "Career Coaching",
    ],
    isFlagshipShowcase: true,
    links: [
      { label: "LinkedIn Talent Community", url: "https://linkedin.com" },
      { label: "Book Career Advisory Session", url: "https://cal.com" },
    ],
    metrics: [
      { label: { ar: "كفاءات ومواهب تم توظيفها", en: "Tech & Exec Hires Closed" }, value: "340+" },
      { label: { ar: "تقليص زمن التوظيف", en: "Time-to-Hire Reduction" }, value: "-48%" },
      { label: { ar: "معدل استبقاء الموظفين (سنتان)", en: "2-Year Retention Rate" }, value: "96.4%" },
      { label: { ar: "نسبة قبول عروض العمل", en: "Offer Acceptance Rate" }, value: "94%" },
    ],
    timeline: [
      {
        year: "2024 — الآن",
        role: { ar: "مديرة استقطاب المواهب وعمليات الأفراد", en: "VP of People Operations & Talent Acquisition" },
        org: { ar: "مِشْوَار فينتشرز — القاهرة وأمستردام", en: "Meshwar Tech Collective — Cairo & Amsterdam" },
        summary: {
          ar: "تأسيس منظومة التوظيف المبني على الجدارات وتقليص زمن إغلاق الوظائف الهندسية من ٥٢ يوماً إلى ٢٧ يوماً.",
          en: "Scaled distributed engineering pods from 45 to 210 members while cutting time-to-hire from 52 to 27 days.",
        },
      },
      {
        year: "2021 — 2024",
        role: { ar: "كبيرة مسؤولي التوظيف التقني (Lead Tech Recruiter)", en: "Lead Technical Talent Partner" },
        org: { ar: "هورايزون للبرمجيات المالية", en: "Horizon FinTech Systems" },
        summary: {
          ar: "إطلاق برنامج رعاية الخريجين والمتدربين الذي ضم ٨٠ خريجاً متميزاً بنسبة تثبيت ٩٢٪.",
          en: "Launched the flagship Graduate & Internship Academy, onboarding 80+ top CS graduates with 92% conversion.",
        },
      },
    ],
    projects: [
      {
        id: "nora-1",
        title: {
          ar: "مِشْوَار بناء فريق هندسي من ٢٠ إلى ٢٠٠ مطوّر في ١٤ شهراً",
          en: "Hyper-Growth Engineering Scale-Up: 20 to 200 Builders in 14 Months",
        },
        desc: {
          ar: "تصميم تجربة مرشح إنسانية وسريعة، مع بناء مصفوفة تقييم تقنية عادلة رفعت تنوع الفريق وجودة التعيينات.",
          en: "Architected structured rubric interviews, async coding challenges, and human-centric onboarding across 6 timezones.",
        },
        year: "2026",
        images: ["/images/ultra/meshwar-hero.webp", "/images/ultra/meshwar-1.webp"],
        tags: ["Tech Recruiting", "People Ops", "Employer Brand"],
        metrics: "180 Engineers Hired • 96.4% Retention",
      },
      {
        id: "nora-2",
        title: {
          ar: "أكاديمية الخريجين والمسار المهني السريع (Grad-to-Leader Program)",
          en: "Grad-to-Leader Fellowship & Culture Playbook",
        },
        desc: {
          ar: "برنامج متكامل لاكتشاف وتأهيل طلاب وخريجي الجامعات المتميزين ودمجهم في فرق المنتجات الحقيقية منذ اليوم الأول.",
          en: "Mentorship framework and transparent career ladder empowering fresh graduates to ship production impact in week one.",
        },
        year: "2025",
        images: ["/images/ultra/meshwar-1.webp", "/images/ultra/meshwar-2.webp"],
        tags: ["Early Careers", "L&D", "Culture Design"],
        metrics: "94% Offer Acceptance • +68 eNPS Score",
      },
    ],
    theme: {
      mode: "light",
      accent: "#9A7B4F",
      scene3d: { enabled: false, intensity: 1.0, speed: 1.0, lightAngle: 45 },
    },
    seo: {
      title: "نورا الهاشمي | Nora El-Hashemi — خبيرة الموارد البشرية واستقطاب المواهب | تَقَدُّم",
      description: "معرض خبرات الموارد البشرية وبناء الفرق لنورا الهاشمي بقالب مِشْوَار على منصة تَقَدُّم.",
      keywords: ["نورا الهاشمي", "Nora El-Hashemi", "HR Portfolio", "Meshwar", "Talent Acquisition"],
    },
    defaultLang: "ar",
    publishedAt: 1761600000000,
    updatedAt: 1761600000000,
    views: 6950,
  },
};

export function createStarterPortfolio(
  username: string,
  template: PortfolioData["template"] = "madar",
  displayName?: string
): PortfolioData {
  const tplMeta = TEMPLATES_CATALOG.find((t) => t.id === template) || TEMPLATES_CATALOG[0];
  const base = SEED_PORTFOLIOS[tplMeta.defaultCreatorUsername] || SEED_PORTFOLIOS.layla;
  const cleanName = displayName?.trim() || username;
  return {
    ...structuredClone(base),
    username,
    template,
    isFlagshipShowcase: false,
    name: {
      ar: cleanName,
      en: cleanName,
    },
    bio: {
      ar: `مرحباً بك في هويتي الرقمية ومعرض أعمالي الرسمي على منصة تَقَدُّم (${username}.taqdom.me). أشارك هنا أبرز مشاريعي وخبراتي المهنية.`,
      en: `Welcome to my official digital identity and portfolio on Taqdom (${username}.taqdom.me), showcasing selected works and professional milestones.`,
    },
    badge: {
      ar: "عضو موثّق في تَقَدُّم • متاح للفرص والمشاريع",
      en: "Verified Taqdom Member • Available for Opportunities",
    },
    seo: {
      title: `${cleanName} — تَقَدُّم | Taqdom (${username}.taqdom.me)`,
      description: `المعرض الرسمي لأعمال ${cleanName} على النطاق المستقل ${username}.taqdom.me`,
      keywords: [cleanName, username, "Taqdom", "تقدم", "Portfolio"],
      noindex: false,
    },
    publishedAt: Date.now(),
    updatedAt: Date.now(),
    views: 1,
  };
}
