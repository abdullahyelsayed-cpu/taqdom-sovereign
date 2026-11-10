import { PortfolioData, TemplateMeta } from "./types";

export const TEMPLATES_CATALOG: TemplateMeta[] = [
  {
    id: "athar",
    slug: "athar",
    name: { ar: "أَثَر", en: "Athar" },
    tagline: {
      ar: "معماري ثلاثي الأبعاد وفوتوغرافيا متحفية خالدة",
      en: "3D Architectural Monolith & Museum-Grade Curation",
    },
    persona: {
      ar: "للمهندسين المعماريين، المصممين الصناعيين، والمبدعين التفاعليين",
      en: "For Architects, Spatial Designers & Creative Technologists",
    },
    description: {
      ar: "يحوّل أعمالك إلى قاعة عرض متحفية مهيبة بإضاءة ثلاثية الأبعاد وتكبير بصري سينمائي عند التمرير، مع تفاصيل هندسية دقيقة.",
      en: "Transforms your body of work into a monumental museum gallery with physical 3D lighting, scroll-triggered scale reveals, and architectural precision.",
    },
    heroImage: "/images/hero-mono.png",
    galleryImages: [
      "/images/hero-mono.png",
      "/images/interior-view.png",
      "/images/hero-side-1.png",
      "/images/mono-1.png",
    ],
    accentColor: "#D4AF37",
    defaultCreatorUsername: "layla",
    features: [
      { ar: "مشهد 3D تفاعلي مع إضاءة متحفية", en: "Interactive 3D Monolith & Museum Lighting" },
      { ar: "عرض لوحات معمارية بملء الشاشة", en: "Full-bleed Architectural Plate Viewer" },
      { ar: "بطاقات مواصفات هندسية دقيقة", en: "Precision Spatial Specification Cards" },
    ],
  },
  {
    id: "madar",
    slug: "madar",
    name: { ar: "مَدَار", en: "Madar" },
    tagline: {
      ar: "شريط سينمائي متحرك للمخرجين وصنّاع الصورة",
      en: "Anamorphic 2.39:1 Cinema Reel & Frame-by-Frame Motion",
    },
    persona: {
      ar: "للمخرجين، المصورين السينمائيين، ومصممي الموشن جرافيك",
      en: "For Film Directors, Cinematographers & Motion Artists",
    },
    description: {
      ar: "مصمم بنسبة عرض سينمائية 2.39:1 مع عداد إطارات حي وشريط أفلام أفقي يمنح مشاهديك إحساس صالات العرض الخاصة.",
      en: "Engineered around an anamorphic 2.39:1 widescreen aspect ratio with live timecode counters, filmstrip rails, and director's treatment notes.",
    },
    heroImage: "/images/mono-4.png",
    galleryImages: [
      "/images/mono-4.png",
      "/images/mono-3.png",
      "/images/hero-side-4.png",
      "/images/testimonial-house.png",
    ],
    accentColor: "#00F5D4",
    defaultCreatorUsername: "youssef",
    features: [
      { ar: "شريط سينمائي 2.39:1 مع Timecode حي", en: "Anamorphic 2.39:1 Widescreen & Live Timecode" },
      { ar: "خلفية فيديو سينمائية فائقة النعومة", en: "Seamless Showreel Video Backdrop" },
      { ar: "تصفح المشاهد بأسلوب غرفة المونتاج", en: "Director's Cut Scene Breakdown" },
    ],
  },
  {
    id: "siyada",
    slug: "siyada",
    name: { ar: "سِيَادَة", en: "Siyada" },
    tagline: {
      ar: "فخامة تنفيذية لرواد الأعمال والقيادات الإبداعية",
      en: "Sovereign Executive Presence for Founders & Visionaries",
    },
    persona: {
      ar: "لرواد الأعمال، المديرين التنفيذيين، والمستشارين الدوليين",
      en: "For Venture Founders, C-Suite Leaders & Global Advisors",
    },
    description: {
      ar: "تصميم سيادي مهيب يبرز الأثر الاقتصادي، الأرقام القياسية، المسيرة القيادية، والشراكات الاستراتيجية بلغة الأوبسيديان والذهب.",
      en: "Commands immediate boardroom authority with animated impact metrics, career milestones, advisory mandates, and obsidian-gold typography.",
    },
    heroImage: "/images/rusted-metal.png",
    galleryImages: [
      "/images/rusted-metal.png",
      "/images/hero-side-2.png",
      "/images/634f7bae-77a5-49d0-a0ab-5271a6194e66.png",
      "/images/4312e1bb-e030-4528-b6df-8a6ea69fe384.png",
    ],
    accentColor: "#C5A059",
    defaultCreatorUsername: "karim",
    features: [
      { ar: "لوحة أثر تنفيذي وأرقام قياسية متحركة", en: "Executive Impact Metrics & KPIs" },
      { ar: "سجل زمني تفاعلي للمسيرة القيادية", en: "Interactive Leadership & Venture Timeline" },
      { ar: "بوابة تواصل مباشر وحجز استشارات", en: "Direct Executive Mandate & Inquiry Desk" },
    ],
  },
  {
    id: "noor",
    slug: "noor",
    name: { ar: "نُور", en: "Noor" },
    tagline: {
      ar: "مجلة فنية تحريرية بخامة المرمر المصري الدافئ",
      en: "Living Alabaster Editorial Monograph & Art Issue",
    },
    persona: {
      ar: "للمديرين الفنيين، مصممي الهويات البصرية، والكتّاب",
      en: "For Art Directors, Brand Designers & Editorial Curators",
    },
    description: {
      ar: "يستلهم روح المجلات الفنية الباريسية والقاهرية الفاخرة بخامة الورق المرمري الدافئ، الشبكات غير المتماثلة، والطباعة العربية المشكّلة.",
      en: "Inspired by collector-grade Parisian and Cairo art monographs on warm Living Alabaster paper with asymmetric grids and sculptural drop-caps.",
    },
    heroImage: "/images/mono-2.png",
    galleryImages: [
      "/images/mono-2.png",
      "/images/hero-side-3.png",
      "/images/040e36b1-d16f-474b-a712-a9979e6ab479.png",
      "/images/249083d2-c49c-4c06-a125-376284d90c42.png",
    ],
    accentColor: "#B8860B",
    defaultCreatorUsername: "farida",
    features: [
      { ar: "تخطيط مجلة فنية بأرقام فصول وتحرير بصري", en: "Asymmetric Art-Book Grid & Issue Index" },
      { ar: "خامة أوف-وايت مرمرية تتنفس مع الإضاءة", en: "Living Alabaster Tactile Paper Surface" },
      { ar: "عرض تفصيلي للخطوط والقصص الإبداعية", en: "Editorial Case-Study Storytelling" },
    ],
  },
];

export const SEED_PORTFOLIOS: Record<string, PortfolioData> = {
  test: {
    username: "test",
    template: "athar",
    avatar: "/images/creators/test.jpg",
    cover: "/images/hero-mono.png",
    name: {
      ar: "أحمد الكيلاني",
      en: "Ahmed El-Kilany",
    },
    title: {
      ar: "معماري تجارب رقمية ومطوّر واجهات ثلاثية الأبعاد",
      en: "Principal Creative Technologist & 3D Spatial Architect",
    },
    bio: {
      ar: "أبني تجارب رقمية سيادية تمزج العمارة المصرية المعاصرة بفيزياء WebGL والذكاء التفاعلي. حساب اختبار رسمي لمنصة تَقَدُّم يتيح لك تجربة التعديل والنشر الفوري.",
      en: "Crafting sovereign digital experiences at the intersection of contemporary Egyptian architecture, WebGL physics, and interactive design. Official Taqdom 1-click test account.",
    },
    city: {
      ar: "القاهرة، مصر",
      en: "Cairo, Egypt",
    },
    email: "test@taqdom.me",
    badge: {
      ar: "حساب الاختبار الرسمي • فئة التميز الرقمي",
      en: "Official Test Account • Digital Excellence",
    },
    isDemoShowcase: true,
    links: [
      { label: "GitHub", url: "https://github.com/abdullahyelsayed-cpu" },
      { label: "Taqdom Studio", url: "https://taqdom.me/studio" },
      { label: "Behance", url: "https://behance.net" },
    ],
    metrics: [
      { label: { ar: "جوائز تصميم دولية", en: "Global Design Honors" }, value: "14+" },
      { label: { ar: "مشاريع معمارية ورقمية", en: "Spatial & WebGL Works" }, value: "48" },
      { label: { ar: "سرعة استجابة الحافة", en: "Edge Latency" }, value: "18ms" },
      { label: { ar: "سنوات الخبرة", en: "Years of Craft" }, value: "09" },
    ],
    timeline: [
      {
        year: "2024 — الآن",
        role: { ar: "كبير معماريي التجارب الرقمية", en: "Principal Spatial Web Architect" },
        org: { ar: "تَقَدُّم استوديو — القاهرة", en: "Taqdom Sovereign Labs — Cairo" },
        summary: {
          ar: "قيادة تصميم محركات العرض ثلاثية الأبعاد والقوالب المعمارية الفاخرة.",
          en: "Leading WebGL spatial engines and bespoke portfolio systems for Arab and global creators.",
        },
      },
      {
        year: "2021 — 2024",
        role: { ar: "مدير إبداعي للتقنيات التفاعلية", en: "Creative Technology Director" },
        org: { ar: "مرسم النيل المعماري", en: "Nile Monolith Atelier" },
        summary: {
          ar: "تصميم المتاحف الافتراضية والواجهات التفاعلية للمؤسسات الثقافية.",
          en: "Designed virtual museum pavilions and tactile digital exhibitions across MENA and Europe.",
        },
      },
    ],
    projects: [
      {
        id: "proj-grand-pavilion",
        title: {
          ar: "جناح المرمر الملكي — المتحف الكبير",
          en: "Alabaster Horizon Pavilion — Giza",
        },
        desc: {
          ar: "توثيق معماري وتجربة ثلاثية الأبعاد لجناح عرض يعتمد على نفاذ الضوء الطبيعي عبر ألواح المرمر المصري والصلب المؤكسد.",
          en: "Spatial documentation and interactive 3D light study for a brutalist pavilion crafted from translucent Egyptian alabaster and weathered corten steel.",
        },
        year: "2025",
        images: ["/images/hero-mono.png", "/images/interior-view.png", "/images/hero-side-1.png"],
        tags: ["Architecture", "WebGL", "Light Study"],
        client: { ar: "مؤسسة التراث المعاصر", en: "Contemporary Heritage Foundation" },
        metrics: "120,000+ Virtual Visitors",
        url: "https://test.taqdom.me",
      },
      {
        id: "proj-desert-observatory",
        title: {
          ar: "مرصد سيوة الفلكي المستدام",
          en: "Siwa Oasis Nocturnal Observatory",
        },
        desc: {
          ar: "تصميم بيئي مكتفٍ ذاتياً بالطاقة الشمسية في قلب الصحراء الغربية لرصد النجوم والسكينة المعمارية.",
          en: "Zero-carbon monolithic desert sanctuary engineered for astronomical observation and passive thermal equilibrium.",
        },
        year: "2024",
        images: ["/images/mono-4.png", "/images/mono-1.png", "/images/rusted-metal.png"],
        tags: ["Sustainable Design", "Monolith", "Siwa"],
        client: { ar: "مبادرة صحراء المستقبل", en: "Desert Futures Collective" },
        metrics: "-35% Embodied Carbon",
      },
      {
        id: "proj-sound-sanctuary",
        title: {
          ar: "ملاذ الصوت والضوء — الجونة",
          en: "Acoustic Monolith Villa — El Gouna",
        },
        desc: {
          ar: "مسكن خاص واستوديو صوتي يدمج المياه المحيطة بالكتل الخرسانية الصامتة لتجربة سمعية وبصرية فريدة.",
          en: "Private coastal residence and acoustic chamber suspended over Red Sea lagoons with calibrated reflection pools.",
        },
        year: "2024",
        images: ["/images/hero-side-2.png", "/images/hero-side-3.png", "/images/mono-2.png"],
        tags: ["Residential", "Acoustics", "Red Sea"],
        client: { ar: "مجموعة البحر الأحمر الفنية", en: "Red Sea Arts Patronage" },
        metrics: "250m² Living Sculpture",
      },
    ],
    theme: {
      mode: "dark",
      accent: "#D4AF37",
      scene3d: {
        enabled: true,
        intensity: 1.25,
        speed: 1.0,
        lightAngle: 42,
      },
    },
    seo: {
      title: "أحمد الكيلاني | Ahmed El-Kilany — تَقَدُّم | Taqdom",
      description:
        "المعرض الرسمي لأعمال أحمد الكيلاني — معماري التجارب الرقمية والواجهات ثلاثية الأبعاد على منصة تَقَدُّم.",
      keywords: ["أحمد الكيلاني", "Ahmed El-Kilany", "Taqdom", "تقدم", "Architecture", "WebGL"],
      noindex: false,
    },
    defaultLang: "ar",
    publishedAt: 1762000000000,
    updatedAt: 1762000000000,
    views: 4820,
  },

  layla: {
    username: "layla",
    template: "athar",
    avatar: "/images/creators/layla.jpg",
    cover: "/images/interior-view.png",
    name: {
      ar: "ليلى منصور",
      en: "Layla Mansour",
    },
    title: {
      ar: "مهندسة معمارية ومصممة فراغات متحفية",
      en: "Principal Spatial & Museum Architect",
    },
    bio: {
      ar: "أصمم مساحات ثقافية ومتاحف معاصرة تحاور الضوء الصحراوي والحجر الطبيعي بين القاهرة وميلانو. كل مشروع هو قصيدة مكانية صامتة.",
      en: "Designing cultural pavilions and contemplative architectural spaces that dialogue with desert light, raw stone, and water across Cairo and Milan.",
    },
    city: {
      ar: "القاهرة، مصر",
      en: "Cairo, Egypt",
    },
    email: "layla@taqdom.me",
    badge: {
      ar: "حساب عرض • وسام التميز المعماري",
      en: "Showcase Account • Architectural Distinction",
    },
    isDemoShowcase: true,
    links: [
      { label: "Instagram", url: "https://instagram.com" },
      { label: "ArchDaily Profile", url: "https://archdaily.com" },
      { label: "Venice Biennale", url: "https://labiennale.org" },
    ],
    metrics: [
      { label: { ar: "معارض دولية", en: "International Pavilions" }, value: "19" },
      { label: { ar: "مساحات ثقافية", en: "Cultural Spaces Built" }, value: "34,000m²" },
      { label: { ar: "جوائز العمارة المستدامة", en: "Sustainability Awards" }, value: "08" },
      { label: { ar: "المدن", en: "Cities" }, value: "Cairo • Milan" },
    ],
    timeline: [
      {
        year: "2022 — الآن",
        role: { ar: "المؤسسة والمديرة المعمارية", en: "Founder & Principal Architect" },
        org: { ar: "استوديو ليلى منصور للعمارة", en: "Studio Mansour Spatial Practice" },
        summary: {
          ar: "تصميم المتاحف الخاصة والمساكن البيئية المنحوتة في الطبيعة.",
          en: "Leading museum architecture and monolithic ecological residences.",
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
          ar: "مركز ثقافي مطل على النيل يستخدم الجرانيت الأسواني والفتحات السماوية الدقيقة لتوجيه أشعة الشمس على المنحوتات.",
          en: "Nile-side cultural sanctuary utilizing hand-dressed Aswan granite and calibrated oculus apertures.",
        },
        year: "2025",
        images: ["/images/interior-view.png", "/images/hero-mono.png", "/images/rusted-metal.png"],
        tags: ["Museum", "Aswan Granite", "Daylighting"],
        metrics: "4,200m² Cultural Complex",
      },
      {
        id: "layla-2",
        title: {
          ar: "بيت الكثبان — الساحل الشمالي",
          en: "Dune Cantilever Residence — Ras El Hekma",
        },
        desc: {
          ar: "كتلة معمارية طائرة تندمج مع الكثبان الرملية الساحلية وتوفر تهوية طبيعية بالكامل.",
          en: "Cantilevered limestone volume embedded within coastal dunes with passive cross-ventilation.",
        },
        year: "2024",
        images: ["/images/hero-side-1.png", "/images/hero-side-2.png", "/images/mono-1.png"],
        tags: ["Residential", "Passive Cooling", "Limestone"],
        metrics: "Zero Net Energy",
      },
      {
        id: "layla-3",
        title: {
          ar: "جناح الصمت المعدني — ميلانو",
          en: "Corten Silence Pavilion — Milan Design Week",
        },
        desc: {
          ar: "تركيب معماري مؤقت من الصلب المعتّق والماء يعكس السماء ويخلق واحة هدوء وسط المدينة.",
          en: "Weathered corten steel and shallow water installation reflecting the sky in central Milan.",
        },
        year: "2023",
        images: ["/images/rusted-metal.png", "/images/hero-side-3.png", "/images/testimonial-house.png"],
        tags: ["Pavilion", "Corten Steel", "Milan"],
        metrics: "85,000 Visitors",
      },
    ],
    theme: {
      mode: "light",
      accent: "#C5A059",
      scene3d: { enabled: true, intensity: 1.1, speed: 0.85, lightAngle: 35 },
    },
    seo: {
      title: "ليلى منصور | Layla Mansour — معمارية | تَقَدُّم",
      description: "معرض الأعمال المعمارية للمهندسة ليلى منصور على منصة تَقَدُّم الفاخرة.",
      keywords: ["ليلى منصور", "Layla Mansour", "عمارة", "Architecture", "Taqdom"],
    },
    defaultLang: "ar",
    publishedAt: 1761900000000,
    updatedAt: 1761900000000,
    views: 9340,
  },

  youssef: {
    username: "youssef",
    template: "madar",
    avatar: "/images/creators/youssef.jpg",
    cover: "/images/mono-4.png",
    name: {
      ar: "يوسف الشاذلي",
      en: "Youssef El-Shazly",
    },
    title: {
      ar: "مخرج سينمائي ومدير تصوير",
      en: "Film Director & Anamorphic Cinematographer",
    },
    bio: {
      ar: "أروي القصص البصرية بعدسات أنامورفيك عريضة وإضاءة درامية بين الجونة وبرلين. أؤمن أن كل كادر سينمائي يجب أن يصلح كلوحة معلقة.",
      en: "Directing atmospheric narrative films and visual symphonies shot on 35mm and anamorphic lenses between El Gouna, Cairo, and Berlin.",
    },
    city: {
      ar: "الجونة، مصر",
      en: "El Gouna, Egypt",
    },
    email: "youssef@taqdom.me",
    badge: {
      ar: "حساب عرض • اختيار المهرجانات السينمائية",
      en: "Showcase Account • Festival Selection",
    },
    isDemoShowcase: true,
    links: [
      { label: "Vimeo Staff Picks", url: "https://vimeo.com" },
      { label: "IMDb", url: "https://imdb.com" },
      { label: "El Gouna Film Lab", url: "https://elgounafilmfestival.com" },
    ],
    metrics: [
      { label: { ar: "أفلام روائية ووثائقية", en: "Narrative & Doc Films" }, value: "16" },
      { label: { ar: "مهرجانات دولية", en: "Festival Selections" }, value: "27" },
      { label: { ar: "نسبة الإطار المفضلة", en: "Signature Aspect" }, value: "2.39:1" },
      { label: { ar: "مشاهدات العروض", en: "Global Streams" }, value: "4.2M" },
    ],
    projects: [
      {
        id: "youssef-1",
        title: {
          ar: "ما وراء السراب — فيلم قصير (35mm)",
          en: "Mirage of the Red Sea — 35mm Short Film",
        },
        desc: {
          ar: "رحلة بصرية شاعرية تتبع صيادي البحر الأحمر عند الفجر باستخدام عدسات Atlas Orion Anamorphic وإضاءة طبيعية خالصة.",
          en: "Poetic visual odyssey following Red Sea horizon navigators at dawn, lensed on Atlas Orion Anamorphic primes.",
        },
        year: "2025",
        images: ["/images/mono-4.png", "/images/mono-3.png", "/images/hero-side-4.png"],
        tags: ["35mm Film", "Anamorphic 2.39:1", "Directing"],
        metrics: "TIME 00:18:42:09 • ARRI Alexa 35",
      },
      {
        id: "youssef-2",
        title: {
          ar: "سيمفونية الحجر والضوء — وثائقي معماري",
          en: "Monoliths of Dawn — Architectural Documentary",
        },
        desc: {
          ar: "فيلم وثائقي يرصد تحول الضوء على العمارة الصحراوية الحديثة من شروق الشمس حتى منتصف الليل.",
          en: "Observational documentary capturing the 24-hour choreography of shadow across desert brutalist structures.",
        },
        year: "2024",
        images: ["/images/mono-1.png", "/images/testimonial-house.png", "/images/mono-2.png"],
        tags: ["Documentary", "Cinematography", "Color Grading"],
        metrics: "TIME 00:42:10:00 • Dolby Atmos",
      },
      {
        id: "youssef-3",
        title: {
          ar: "ليالي القاهرة السيبيرية — إعلان فني",
          en: "Nocturne Cairo — Global Brand Anthem",
        },
        desc: {
          ar: "حملة سينمائية ليلية تمزج إيقاع القاهرة السريع بتقنيات التصوير الجوي والعدسات النهارية الفائقة.",
          en: "High-contrast nocturnal commercial anthem blending FPV aerial choreography with vintage Cooke lenses.",
        },
        year: "2024",
        images: ["/images/hero-side-4.png", "/images/634f7bae-77a5-49d0-a0ab-5271a6194e66.png"],
        tags: ["Commercial", "FPV Cinema", "Night Shoot"],
        metrics: "TIME 00:02:15:18 • 4K RAW",
      },
    ],
    theme: {
      mode: "dark",
      accent: "#00F5D4",
      scene3d: { enabled: true, intensity: 1.4, speed: 1.2, lightAngle: 60 },
    },
    seo: {
      title: "يوسف الشاذلي | Youssef El-Shazly — مخرج سينمائي | تَقَدُّم",
      description: "الأعمال السينمائية للمخرج ومدير التصوير يوسف الشاذلي بقالب مَدَار على منصة تَقَدُّم.",
      keywords: ["يوسف الشاذلي", "Youssef El-Shazly", "Cinematographer", "Director", "Madar"],
    },
    defaultLang: "ar",
    publishedAt: 1761800000000,
    updatedAt: 1761800000000,
    views: 7615,
  },

  farida: {
    username: "farida",
    template: "noor",
    avatar: "/images/creators/farida.jpg",
    cover: "/images/mono-2.png",
    name: {
      ar: "فريدة رفعت",
      en: "Farida Refaat",
    },
    title: {
      ar: "مديرة فنية ومصممة هويات وخطوط عربية",
      en: "Editorial Art Director & Arabic Type Designer",
    },
    bio: {
      ar: "أصمم هويات بصرية ومطبوعات فنية للمؤسسات الثقافية ودور الأزياء بين باريس والقاهرة، مع شغف عميق بجماليات الحرف العربي المشكّل.",
      en: "Crafting bespoke brand worlds, collector art books, and contemporary Arabic-Latin typography for cultural houses in Paris and Cairo.",
    },
    city: {
      ar: "باريس، فرنسا",
      en: "Paris, France",
    },
    email: "farida@taqdom.me",
    badge: {
      ar: "حساب عرض • جائزة التصميم التحريري",
      en: "Showcase Account • Editorial Typography Honor",
    },
    isDemoShowcase: true,
    links: [
      { label: "Type Foundry", url: "https://taqdom.me/templates/noor" },
      { label: "Are.na", url: "https://are.na" },
      { label: "Instagram", url: "https://instagram.com" },
    ],
    metrics: [
      { label: { ar: "هويات بصرية فاخرة", en: "Luxury Identities" }, value: "32" },
      { label: { ar: "خطوط عربية منشورة", en: "Custom Typefaces" }, value: "07" },
      { label: { ar: "كتب فنية مطبوعة", en: "Art Monographs" }, value: "14" },
      { label: { ar: "المعارض", en: "Exhibitions" }, value: "Paris • Cairo" },
    ],
    projects: [
      {
        id: "farida-1",
        title: {
          ar: "العدد الأول: مجلة «مَرْمَر» للفنون المعمارية",
          en: "MARMAR Issue No. 01 — Bilingual Art Monograph",
        },
        desc: {
          ar: "إدارة فنية وتصميم شبكي لمجلة مطبوعة ورقمية تحتفي بالعمارة والخط العربي على ورق القطن الطبيعي.",
          en: "Complete editorial direction and bilingual typographic grid for a collector's architectural quarterly.",
        },
        year: "2025",
        images: [
          "/images/mono-2.png",
          "/images/040e36b1-d16f-474b-a712-a9979e6ab479.png",
          "/images/249083d2-c49c-4c06-a125-376284d90c42.png",
        ],
        tags: ["Editorial Design", "Arabic Typography", "Print"],
        metrics: "320 Pages • Swiss Binding",
      },
      {
        id: "farida-2",
        title: {
          ar: "هوية دار «قَصْر النِّيل» للعطور النادرة",
          en: "Qasr El-Nil — Haute Parfumerie Identity",
        },
        desc: {
          ar: "تصميم الزجاجات النحتية، التغليف المرمري، والخط الديواني المعاصر لدار عطور مصرية فرنسية.",
          en: "Sculptural flacon packaging, embossed alabaster paper system, and custom calligraphic wordmark.",
        },
        year: "2024",
        images: [
          "/images/b2401fa5-4eac-465f-b1f9-014aadc182ee.png",
          "/images/dd1b32a8-3722-4ea2-8808-10d53532809d.png",
        ],
        tags: ["Luxury Branding", "Packaging", "Calligraphy"],
        metrics: "Paris Flagship Launch",
      },
      {
        id: "farida-3",
        title: {
          ar: "مجموعة رسوم «الخط والظل» المعمارية",
          en: "Shadow & Ink — Architectural Sketch Anthology",
        },
        desc: {
          ar: "سلسلة لوحات مرسومة بالحبر الأسود توثق التوازن بين الكتلة والفراغ في العمارة المتوسطية.",
          en: "Monochrome ink studies exploring mass, void, and horizon lines in Mediterranean architecture.",
        },
        year: "2024",
        images: [
          "/images/4312e1bb-e030-4528-b6df-8a6ea69fe384.png",
          "/images/7638f650-8586-4403-8c13-141921a04f9d.png",
        ],
        tags: ["Illustration", "Monograph", "Exhibition"],
        metrics: "Galerie Vivienne Exhibition",
      },
    ],
    theme: {
      mode: "light",
      accent: "#C5A059",
      scene3d: { enabled: true, intensity: 0.95, speed: 0.7, lightAngle: 28 },
    },
    seo: {
      title: "فريدة رفعت | Farida Refaat — مديرة فنية | تَقَدُّم",
      description: "معرض الأعمال التحريرية والهويات البصرية للمصممة فريدة رفعت بقالب نُور على تَقَدُّم.",
      keywords: ["فريدة رفعت", "Farida Refaat", "Art Director", "Noor", "Typography"],
    },
    defaultLang: "ar",
    publishedAt: 1761700000000,
    updatedAt: 1761700000000,
    views: 6490,
  },

  karim: {
    username: "karim",
    template: "siyada",
    avatar: "/images/creators/karim.jpg",
    cover: "/images/rusted-metal.png",
    name: {
      ar: "كريم عادل",
      en: "Karim Adel",
    },
    title: {
      ar: "رائد أعمال ومؤسس استوديوهات التكنولوجيا المالية والعقارية",
      en: "Venture Architect & Executive Managing Partner",
    },
    bio: {
      ar: "أقود استثمارات وبناء شركات تقنية ومعمارية عابرة للحدود بين دبي والقاهرة والرياض، مع تركيز على البنية التحتية المستدامة والذكاء الاصطناعي.",
      en: "Building and scaling category-defining PropTech, AI infrastructure, and sustainable real-estate ventures across Dubai, Cairo, and Riyadh.",
    },
    city: {
      ar: "دبي، الإمارات",
      en: "Dubai, UAE",
    },
    email: "karim@taqdom.me",
    badge: {
      ar: "حساب عرض • القادة التنفيذيون",
      en: "Showcase Account • Executive Sovereign",
    },
    isDemoShowcase: true,
    links: [
      { label: "LinkedIn Executive", url: "https://linkedin.com" },
      { label: "Venture Annual Report", url: "https://taqdom.me/templates/siyada" },
    ],
    metrics: [
      { label: { ar: "حجم الأصول المدارة", en: "Assets Under Advisory" }, value: "$420M+" },
      { label: { ar: "شركات تم تأسيسها", en: "Ventures Founded" }, value: "06" },
      { label: { ar: "عمليات تخارج ناجحة", en: "Strategic Exits" }, value: "03" },
      { label: { ar: "الأسواق الإقليمية", en: "Active Markets" }, value: "MENA • EU" },
    ],
    timeline: [
      {
        year: "2023 — الآن",
        role: { ar: "الشريك الإداري المؤسس", en: "Founding Managing Partner" },
        org: { ar: "أوريكس كابيتال — مركز دبي المالي العالمي", en: "Oryx Sovereign Ventures — DIFC" },
        summary: {
          ar: "إدارة محفظة استثمارات استراتيجية في تقنيات البناء المستدام والمدن الذكية.",
          en: "Directing strategic capital deployment across autonomous infrastructure and climate-tech.",
        },
      },
      {
        year: "2019 — 2023",
        role: { ar: "الرئيس التنفيذي", en: "Chief Executive Officer" },
        org: { ar: "مونوليث للتطوير المستدام", en: "Monolith Modular Holdings" },
        summary: {
          ar: "التوسع في ٤ دول وتحقيق نمو سنوي مركب بنسبة ١٨٠٪.",
          en: "Scaled modular net-zero architectural systems across 4 countries prior to acquisition.",
        },
      },
    ],
    projects: [
      {
        id: "karim-1",
        title: {
          ar: "مبادرة المدن الحيوية المستدامة — ٢٠٢٥",
          en: "Autonomous Net-Zero Habitat Fund",
        },
        desc: {
          ar: "تأسيس صندوق استثماري بقيمة ١٥٠ مليون دولار لتطوير مساكن ذكية مكتفية ذاتياً بالطاقة في الشرق الأوسط.",
          en: "$150M strategic vehicle financing off-grid architectural developments and solar micro-grids across MENA.",
        },
        year: "2025",
        images: ["/images/rusted-metal.png", "/images/hero-side-2.png"],
        tags: ["Venture Capital", "PropTech", "ESG"],
        metrics: "$150M Committed Capital",
      },
      {
        id: "karim-2",
        title: {
          ar: "منصة الذكاء المعماري التوليدي",
          en: "AetherCAD — Generative Spatial AI",
        },
        desc: {
          ar: "قيادة جولة التمويل الأولى والاستحواذ الاستراتيجي لمنصة هندسية تقلص زمن التصميم بنسبة ٦٥٪.",
          en: "Seed-to-Series B incubation of a generative structural engineering platform adopted by 400+ firms.",
        },
        year: "2024",
        images: [
          "/images/61af06cc-84d0-4031-a0ed-76fc43b1c1e1.png",
          "/images/5b3bdb95-fac7-4d22-aa97-98b5d547b2db.png",
        ],
        tags: ["AI Infrastructure", "Series B", "Board Mandate"],
        metrics: "3.8x MOIC • 400+ Enterprise Clients",
      },
    ],
    theme: {
      mode: "dark",
      accent: "#D4AF37",
      scene3d: { enabled: true, intensity: 1.2, speed: 0.9, lightAngle: 45 },
    },
    seo: {
      title: "كريم عادل | Karim Adel — رائد أعمال | تَقَدُّم",
      description: "الملف التنفيذي والمحفظة الاستثمارية لرائد الأعمال كريم عادل بقالب سِيَادَة على منصة تَقَدُّم.",
      keywords: ["كريم عادل", "Karim Adel", "Siyada", "Executive Portfolio", "Taqdom"],
    },
    defaultLang: "ar",
    publishedAt: 1761600000000,
    updatedAt: 1761600000000,
    views: 5290,
  },
};

export function createStarterPortfolio(
  username: string,
  template: PortfolioData["template"] = "athar",
  displayName?: string
): PortfolioData {
  const base = SEED_PORTFOLIOS.test;
  const cleanName = displayName?.trim() || username;
  return {
    ... structuredClone(base),
    username,
    template,
    isDemoShowcase: false,
    name: {
      ar: cleanName,
      en: cleanName,
    },
    title: {
      ar: "مبدع رقمي ومصمم تجارب",
      en: "Multidisciplinary Creator & Architect",
    },
    bio: {
      ar: `مرحباً بك في معرض أعمالي الرسمي على منصة تَقَدُّم (${username}.taqdom.me). أشارك هنا أبرز مشاريعي ورؤيتي الإبداعية.`,
      en: `Welcome to my sovereign portfolio on Taqdom (${username}.taqdom.me), showcasing selected works and creative direction.`,
    },
    badge: {
      ar: "عضو موثّق في تَقَدُّم",
      en: "Verified Taqdom Sovereign Member",
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
