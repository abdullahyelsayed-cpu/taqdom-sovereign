"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpLeft,
  ArrowUpRight,
  CheckCircle2,
  Compass,
  Layers3,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";
import { getSubdomainUrl, normalizeUsername, validateUsername } from "@/lib/types";

const HeroOrbitScene = dynamic(() => import("./hero-orbit-scene"), {
  ssr: false,
  loading: () => <div className="neo-orbit-fallback" aria-hidden="true" />,
});

const creator = {
  nameAr: "عبدالله يحى",
  nameEn: "Abdullah Yehia",
  roleAr: "مؤسس ومطوّر تَقَدُّم",
  roleEn: "Creator & Developer of Taqdom",
};

const examples = [
  {
    id: "madar",
    image: "/images/ultra/madar-hero.webp",
    number: "01",
    titleAr: "مَدَار",
    titleEn: "Orbit",
    categoryAr: "تقنية وذكاء اصطناعي",
    categoryEn: "Technology & AI",
    username: "youssef",
    tone: "blue",
  },
  {
    id: "athar",
    image: "/images/ultra/athar-hero.webp",
    number: "02",
    titleAr: "أَثَر",
    titleEn: "Frame",
    categoryAr: "تصميم وصناعة محتوى",
    categoryEn: "Design & Visual Stories",
    username: "farida",
    tone: "coral",
  },
  {
    id: "haven",
    image: "/images/ultra/haven-hero.webp",
    number: "03",
    titleAr: "مَلاذ",
    titleEn: "Forma",
    categoryAr: "عمارة وتصميم",
    categoryEn: "Architecture & Design",
    username: "layla",
    tone: "lime",
  },
];

const templates = [
  { titleAr: "مَدَار", titleEn: "Orbit", image: "/images/ultra/madar-hero.webp", id: "madar" },
  { titleAr: "أَثَر", titleEn: "Frame", image: "/images/ultra/athar-hero.webp", id: "athar" },
  { titleAr: "مَلاذ", titleEn: "Forma", image: "/images/ultra/haven-hero.webp", id: "haven" },
  { titleAr: "سِيَادَة", titleEn: "Index", image: "/images/ultra/siyada-hero.webp", id: "siyada" },
  { titleAr: "وَمِيض", titleEn: "Pulse", image: "/images/ultra/wameed-hero.webp", id: "wameed" },
  { titleAr: "سَلَام", titleEn: "Flux", image: "/images/ultra/salam-hero.webp", id: "salam" },
  { titleAr: "مِشْوَار", titleEn: "Kin", image: "/images/ultra/meshwar-hero.webp", id: "meshwar" },
];

type Availability = {
  checking: boolean;
  available: boolean;
  messageAr: string;
  messageEn: string;
};

export function TaqdomReimagined() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const setDraft = useTaqdomStore((state) => state.setDraft);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [username, setUsername] = useState("");
  const [host, setHost] = useState("taqdom.me");
  const [activeExample, setActiveExample] = useState(0);
  const [availability, setAvailability] = useState<Availability>({
    checking: false,
    available: true,
    messageAr: "اختَر اسمًا قصيرًا وواضحًا لرابطك الشخصي",
    messageEn: "Choose a short, memorable name for your link",
  });

  useEffect(() => {
    if (typeof window !== "undefined") setHost(window.location.host);
  }, []);

  useEffect(() => {
    const clean = normalizeUsername(username);
    if (!clean) {
      setAvailability({
        checking: false,
        available: true,
        messageAr: "اختَر اسمًا قصيرًا وواضحًا لرابطك الشخصي",
        messageEn: "Choose a short, memorable name for your link",
      });
      return;
    }

    const validation = validateUsername(clean);
    if (!validation.valid) {
      setAvailability({
        checking: false,
        available: false,
        messageAr: validation.reasonAr || "الاسم غير صالح",
        messageEn: validation.reasonEn || "Invalid username",
      });
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setAvailability((previous) => ({ ...previous, checking: true }));

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/username/check?u=${encodeURIComponent(clean)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!cancelled) {
          setAvailability({
            checking: false,
            available: Boolean(data.available),
            messageAr: data.reasonAr || (data.available ? "الاسم متاح" : "الاسم مستخدم بالفعل"),
            messageEn: data.reasonEn || (data.available ? "Name is available" : "Name is already in use"),
          });
        }
      } catch {
        if (!cancelled) {
          setAvailability({
            checking: false,
            available: true,
            messageAr: "تعذّر التحقق الآن — يمكنك المتابعة وسنتحقق عند الحفظ",
            messageEn: "Could not check right now — we will validate when you continue",
          });
        }
      }
    }, 260);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [username]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const root = rootRef.current;
    if (!root) return;

    const context = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from(".neo-hero-copy .neo-intro", { y: 32, opacity: 0, duration: 0.8, stagger: 0.1 })
        .from(".neo-hero-art", { y: 44, opacity: 0, scale: 0.96, duration: 1 }, 0.12)
        .from(".neo-owner-chip", { y: 18, opacity: 0, duration: 0.65 }, 0.62);

      gsap.utils.toArray<HTMLElement>(".neo-reveal").forEach((element) => {
        gsap.fromTo(
          element,
          { y: 44, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 88%",
              once: true,
            },
          }
        );
      });

      gsap.to(".neo-orbit-shell", {
        rotate: 18,
        yPercent: 9,
        ease: "none",
        scrollTrigger: {
          trigger: ".neo-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      gsap.to(".neo-float-card--a", {
        y: -28,
        rotate: -5,
        ease: "none",
        scrollTrigger: {
          trigger: ".neo-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1.1,
        },
      });

      gsap.to(".neo-float-card--b", {
        y: 32,
        rotate: 5,
        ease: "none",
        scrollTrigger: {
          trigger: ".neo-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1.1,
        },
      });

      gsap.utils.toArray<HTMLElement>(".neo-image-parallax").forEach((image) => {
        gsap.fromTo(
          image,
          { scale: 1.12, yPercent: -3 },
          {
            scale: 1,
            yPercent: 3,
            ease: "none",
            scrollTrigger: {
              trigger: image.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          }
        );
      });
    }, root);

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => context.revert();
  }, []);

  const cleanUsername = normalizeUsername(username);
  const previewUrl = cleanUsername ? getSubdomainUrl(cleanUsername, host) : "yourname.taqdom.me";
  const Arrow = lang === "ar" ? ArrowUpLeft : ArrowUpRight;

  const handleStart = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cleanUsername) {
      router.push("/auth");
      return;
    }
    const validation = validateUsername(cleanUsername);
    if (!validation.valid || !availability.available) return;
    setDraft((previous) => ({ ...previous, username: cleanUsername }));
    router.push(`/studio?u=${encodeURIComponent(cleanUsername)}`);
  };

  return (
    <div ref={rootRef} className="neo-home">
      <div className="neo-top-progress" aria-hidden="true" />
      <section className="neo-hero" id="top">
        <div className="neo-hero-wash" aria-hidden="true" />
        <div className="neo-wrap neo-hero-layout">
          <div className="neo-hero-copy">
            <div className="neo-intro neo-eyebrow">
              <span className="neo-eyebrow-dot" />
              <span>TAQDOM / YOUR NEXT CHAPTER</span>
              <span className="neo-eyebrow-ar">{t("مساحتك تبدأ من هنا", "A SPACE THAT STARTS WITH YOU")}</span>
            </div>

            <h1 className="neo-intro neo-hero-title">
              {t("مش مجرد بروفايل.", "More than a profile.")}
              <span className="neo-title-accent">{t("دي مساحة لكل", "A space for all")}</span>
              <span className="neo-title-bottom">
                {t("اللي بتصنعه.", "that you create.")}
                <svg className="neo-title-swoosh" viewBox="0 0 310 25" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M4 18C72 4 188 1 304 13" />
                </svg>
              </span>
            </h1>

            <p className="neo-intro neo-hero-description">
              {t(
                "مشاريعك، أفكارك، مهاراتك، وحكايتك — في مكان واحد يشبهك. ابنِ حضورك الرقمي بطريقتك، وشاركه برابط يحمل اسمك.",
                "Your projects, ideas, skills, and story — in one place that feels like you. Shape your digital presence, then share it with one personal link."
              )}
            </p>

            <div className="neo-intro neo-hero-actions">
              <Link href="/auth" className="neo-button neo-button-primary">
                <span>{t("ابدأ مساحتك مجانًا", "Create your space")}</span>
                <Arrow className="h-4 w-4" />
              </Link>
              <Link href="#showcase" className="neo-button neo-button-ghost">
                <span>{t("شوف أمثلة حقيقية", "Explore the work")}</span>
                <ArrowDown className="h-4 w-4" />
              </Link>
            </div>

            <div className="neo-owner-chip">
              <Image
                src="/images/abdullah-yehia.svg"
                alt={t(creator.nameAr, creator.nameEn)}
                width={72}
                height={72}
                priority
                sizes="72px"
                className="neo-owner-photo rounded-full object-cover ring-2 ring-white/80 shadow-lg"
              />
              <div className="neo-owner-meta">
                <span className="neo-owner-label">{t("صناعة مصرية • مشروع مستقل", "Made in Egypt • Independent project")}</span>
                <strong>{t(creator.nameAr, creator.nameEn)}</strong>
                <span>{t(creator.roleAr, creator.roleEn)}</span>
              </div>
              <span className="neo-owner-check" aria-hidden="true"><CheckCircle2 size={17} /></span>
            </div>
          </div>

          <div className="neo-hero-art" aria-label={t("عنصر بصري ثلاثي الأبعاد متحرك", "Animated three-dimensional visual")}>
            <div className="neo-art-grid" aria-hidden="true" />
            <div className="neo-orbit-shell" aria-hidden="true">
              <span className="neo-orbit-ring neo-orbit-ring--one" />
              <span className="neo-orbit-ring neo-orbit-ring--two" />
              <span className="neo-orbit-ring neo-orbit-ring--three" />
              <span className="neo-orbit-star">✳</span>
            </div>
            <HeroOrbitScene />
            <div className="neo-float-card neo-float-card--a">
              <Image src="/images/ultra/athar-hero.webp" alt="" fill sizes="190px" className="neo-image-parallax" />
              <span className="neo-float-card-caption">01 / VISUAL STORY</span>
            </div>
            <div className="neo-float-card neo-float-card--b">
              <Image src="/images/ultra/madar-hero.webp" alt="" fill sizes="170px" className="neo-image-parallax" />
              <span className="neo-float-card-caption">02 / BUILT WITH IDEAS</span>
            </div>
            <div className="neo-art-sticker">
              <Sparkles size={18} />
              <span>{t("فكرتك تستاهل", "MAKE IT MATTER")}</span>
            </div>
            <div className="neo-art-index">01 — 07</div>
          </div>
        </div>

        <a href="#intro" className="neo-scroll-cue" aria-label={t("انتقل إلى القسم التالي", "Scroll to the next section")}>
          <span>{t("انزل واكتشف", "SCROLL TO EXPLORE")}</span>
          <ArrowDown size={15} />
        </a>
      </section>

      <section className="neo-marquee" aria-label={t("ما تصنعه يستحق أن يُرى", "What you make deserves to be seen")}>
        <div className="neo-marquee-track">
          {Array.from({ length: 4 }).map((_, index) => (
            <span className="neo-marquee-item" key={index}>
              BUILD YOUR SPACE <b>✳</b> اعرض شغلك <b>✳</b> MAKE IT YOURS <b>✳</b> خلّي شغلك يتكلم <b>✳</b>
            </span>
          ))}
        </div>
      </section>

      <section className="neo-section neo-intro-section" id="intro">
        <div className="neo-wrap">
          <div className="neo-section-heading neo-reveal">
            <div>
              <span className="neo-kicker">01 / THE IDEA</span>
              <h2>{t("اللي عملته يستاهل أكتر من لينك ضايع.", "Your work deserves more than a lost link.")}</h2>
            </div>
            <p>
              {t(
                "بدل ما شغلك يبقى متفرق بين ملفات ومنصات، اجمعه في معرض واحد مرتب، واضح، وسهل يتشارك.",
                "Bring scattered projects, scattered links, and scattered ideas into one thoughtful, easy-to-share home."
              )}
            </p>
          </div>

          <div className="neo-feature-grid">
            <article className="neo-feature-card neo-feature-card--large neo-reveal">
              <div className="neo-feature-icon neo-icon-blue"><Layers3 size={25} /></div>
              <span className="neo-card-index">A / YOUR WORK</span>
              <h3>{t("كل إنجاز في مكانه.", "Everything you make, in one place.")}</h3>
              <p>{t("اعرض المشاريع، المهارات، الرحلة، وروابطك في صفحة واحدة بتصميم متناسق.", "Present projects, skills, milestones, and links in one coherent portfolio.")}</p>
              <div className="neo-mini-stack" aria-hidden="true">
                <span>PROJECTS</span><span>SKILLS</span><span>STORY</span>
              </div>
            </article>
            <article className="neo-feature-card neo-feature-card--lime neo-reveal">
              <div className="neo-feature-icon neo-icon-ink"><Zap size={25} /></div>
              <span className="neo-card-index">B / YOUR STYLE</span>
              <h3>{t("مش قالب وخلاص.", "A style that feels like you.")}</h3>
              <p>{t("اختار من سبعة اتجاهات بصرية، وبعدها عدّل الألوان والخلفيات ورتّب الأقسام بحرية.", "Choose from seven visual directions, then personalize colours, backgrounds, and layouts.")}</p>
              <Link href="/templates" className="neo-text-link">{t("شوف الستايلات", "Explore the styles")} <ArrowLeft size={16} /></Link>
            </article>
            <article className="neo-feature-card neo-feature-card--coral neo-reveal">
              <div className="neo-feature-icon neo-icon-coral"><Compass size={25} /></div>
              <span className="neo-card-index">C / YOUR LINK</span>
              <h3>{t("اسمك هو عنوانك.", "A link with your name on it.")}</h3>
              <p>{t("شارك رابطك الشخصي بسهولة، من غير ما تضطر تشرح للناس فين يلاقوا شغلك.", "Share one memorable address instead of explaining where everything lives.")}</p>
              <div className="neo-domain-pill" dir="ltr">yourname.taqdom.me ↗</div>
            </article>
          </div>
        </div>
      </section>

      <section className="neo-showcase-section" id="showcase">
        <div className="neo-wrap">
          <div className="neo-section-heading neo-reveal">
            <div>
              <span className="neo-kicker">02 / MADE TO BE SEEN</span>
              <h2>{t("كل مجال له طريقته في الحكي.", "Every kind of work has its own language.")}</h2>
            </div>
            <Link href="/templates" className="neo-button neo-button-outline">
              {t("استكشف كل الستايلات", "Browse all styles")} <ArrowLeft size={16} />
            </Link>
          </div>

          <div className="neo-showcase-grid">
            {examples.map((example, index) => (
              <Link
                href={getSubdomainUrl(example.username, host)}
                key={example.id}
                className={`neo-showcase-card neo-showcase-card--${example.tone} neo-reveal`}
                data-active={activeExample === index}
                onMouseEnter={() => setActiveExample(index)}
                onFocus={() => setActiveExample(index)}
              >
                <div className="neo-showcase-image">
                  <Image src={example.image} alt={t(example.titleAr, example.titleEn)} fill sizes="(max-width: 900px) 100vw, 33vw" className="neo-image-parallax" />
                  <span className="neo-showcase-number">{example.number}</span>
                  <span className="neo-showcase-open"><ArrowUpRight size={20} /></span>
                </div>
                <div className="neo-showcase-info">
                  <div>
                    <h3>{t(example.titleAr, example.titleEn)}</h3>
                    <p>{t(example.categoryAr, example.categoryEn)}</p>
                  </div>
                  <span className="neo-showcase-username" dir="ltr">{example.username}.taqdom.me</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="neo-showcase-footnote">
            <span className="neo-showcase-active-dot" />
            {t("نماذج توضيحية للستايلات — وليست حسابات مستخدمين حقيقيين.", "Illustrative template samples — not real user accounts.")}
          </div>
        </div>
      </section>

      <section className="neo-steps-section">
        <div className="neo-wrap">
          <div className="neo-steps-top neo-reveal">
            <span className="neo-kicker">03 / FROM IDEA TO ONLINE</span>
            <h2>{t("ثلاث خطوات. وبعدها شغلك يبقى له عنوان.", "Three simple steps. One home for your work.")}</h2>
          </div>
          <div className="neo-steps-grid">
            <article className="neo-step-card neo-reveal">
              <span className="neo-step-number">01</span>
              <div className="neo-step-symbol">✳</div>
              <h3>{t("اختار شكل مساحتك", "Choose your direction")}</h3>
              <p>{t("اختار المجال والستايل اللي يعبر عنك، من غير ما تبدأ من صفحة فاضية.", "Start with a style and a structure made for the kind of work you do.")}</p>
            </article>
            <article className="neo-step-card neo-step-card--middle neo-reveal">
              <span className="neo-step-number">02</span>
              <div className="neo-step-symbol">↗</div>
              <h3>{t("ضيف شغلك وعدّل", "Make it yours")}</h3>
              <p>{t("ارفع صورك ومشاريعك، غيّر الخلفية والألوان، وحرّك أقسامك بالطريقة اللي تحبها.", "Add your projects, change the look, and arrange the sections your way.")}</p>
            </article>
            <article className="neo-step-card neo-reveal">
              <span className="neo-step-number">03</span>
              <div className="neo-step-symbol">◎</div>
              <h3>{t("انشر وشارك", "Publish and share")}</h3>
              <p>{t("انشر مساحتك وخلي رابط واحد يجمع كل اللي عايز الناس تشوفه.", "Publish your space and share one link with the people who matter.")}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="neo-templates-section" id="templates">
        <div className="neo-wrap">
          <div className="neo-section-heading neo-reveal">
            <div>
              <span className="neo-kicker">04 / PICK YOUR WORLD</span>
              <h2>{t("سبع شخصيات بصرية. اختار اللي شبهك.", "Seven visual worlds. Find the one that feels right.")}</h2>
            </div>
            <p>{t("كل ستايل له إيقاعه وطريقته في ترتيب وعرض المحتوى.", "Each style has its own rhythm, composition, and way to tell your story.")}</p>
          </div>
          <div className="neo-template-rail">
            {templates.map((item, index) => (
              <Link href={`/templates?template=${item.id}`} className="neo-template-card neo-reveal" key={item.id}>
                <div className="neo-template-image">
                  <Image src={item.image} alt={t(item.titleAr, item.titleEn)} fill sizes="240px" className="neo-image-parallax" />
                  <span className="neo-template-number">0{index + 1}</span>
                  <span className="neo-template-arrow"><ArrowUpRight size={16} /></span>
                </div>
                <div className="neo-template-name">
                  <strong>{t(item.titleAr, item.titleEn)}</strong>
                  <span>{item.id.toUpperCase()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="neo-founder-section" id="creator">
        <div className="neo-founder-shape neo-founder-shape--one" aria-hidden="true" />
        <div className="neo-founder-shape neo-founder-shape--two" aria-hidden="true" />
        <div className="neo-wrap neo-founder-layout">
          <div className="neo-founder-photo-wrap neo-reveal">
            <div className="neo-founder-photo-frame">
              <Image
                src="/images/abdullah-yehia.svg"
                alt={t(creator.nameAr, creator.nameEn)}
                fill
                sizes="(max-width: 760px) 84vw, 420px"
                className="neo-founder-photo"
              />
            </div>
            <span className="neo-founder-photo-note">{t("صناعة مصرية", "BUILT IN EGYPT")} <b>✳</b> 2026</span>
          </div>
          <div className="neo-founder-copy neo-reveal">
            <span className="neo-kicker neo-kicker-light">05 / THE PERSON BEHIND IT</span>
            <h2>{t("أهلًا، أنا عبدالله.", "Hi, I'm Abdullah.")}</h2>
            <h3>{t("وببني تَقَدُّم علشان شغلك ياخد فرصته.", "I'm building Taqdom to give good work a better stage.")}</h3>
            <p>
              {t(
                "تَقَدُّم مشروع تخرج مستقل في سياق مبادرة سفراء الذكاء الاصطناعي — الدفعة الثانية عشرة. الفكرة بسيطة: كل طالب وصانع ومبدع يستحق مساحة رقمية مرتبة تعرض قدراته وتخلّي الوصول لشغله أسهل.",
                "Taqdom is an independent graduation project developed in the context of the AI Ambassadors Initiative, Batch 12. The idea is simple: students and creators deserve a thoughtful place to present what they can do."
              )}
            </p>
            <div className="neo-founder-meta">
              <span>{t(creator.nameAr, creator.nameEn)}</span>
              <span>{t(creator.roleAr, creator.roleEn)}</span>
            </div>
            <a href="https://www.linkedin.com/in/abdullah-yehia/" target="_blank" rel="noreferrer" className="neo-button neo-button-lime">
              LinkedIn <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <section className="neo-claim-section" id="claim">
        <div className="neo-wrap">
          <div className="neo-claim-card neo-reveal">
            <div className="neo-claim-copy">
              <span className="neo-kicker">06 / YOUR TURN</span>
              <h2>{t("جاهز تخلي شغلك يتشاف؟", "Ready to put your work out there?")}</h2>
              <p>{t("احجز اسم مساحتك وابدأ رتّب أول نسخة من معرض أعمالك.", "Claim your address and build the first version of your portfolio.")}</p>
            </div>
            <form className="neo-claim-form" onSubmit={handleStart}>
              <label htmlFor="neo-username">{t("اختار اسم رابطك", "Choose your link")}</label>
              <div className="neo-claim-input-row" dir="ltr">
                <input
                  id="neo-username"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="yourname"
                  aria-describedby="neo-username-status"
                />
                <span>.taqdom.me</span>
              </div>
              <div id="neo-username-status" className={`neo-claim-status ${availability.available ? "is-available" : "is-unavailable"}`} aria-live="polite">
                {availability.checking ? (
                  <span>{t("بنتحقق من الاسم...", "Checking availability...")}</span>
                ) : availability.available ? (
                  <><CheckCircle2 size={15} /><span>{t(availability.messageAr, availability.messageEn)}</span></>
                ) : (
                  <span>{t(availability.messageAr, availability.messageEn)}</span>
                )}
              </div>
              <button type="submit" className="neo-button neo-button-primary neo-claim-submit" disabled={availability.checking || (Boolean(cleanUsername) && !availability.available)}>
                {t("ابدأ بناء مساحتك", "Build your space")} <ArrowLeft size={17} />
              </button>
              <span className="neo-claim-preview" dir="ltr">{previewUrl}</span>
            </form>
          </div>
        </div>
      </section>

      <footer className="neo-footer">
        <div className="neo-wrap">
          <div className="neo-footer-top">
            <Link href="/" className="neo-footer-brand" aria-label="Taqdom home">
              <span className="neo-logo-mark" aria-hidden="true">
                <svg viewBox="0 0 40 40" fill="none">
                  <path d="M5 30V19h7v11H5Z" fill="currentColor" />
                  <path d="M16 30V11h7v19h-7Z" fill="currentColor" />
                  <path d="M27 30V4h7v26h-7Z" fill="currentColor" />
                  <path d="m8 13 10-7 7 2 8-5" stroke="#D8FF52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>تَقَدُّم</span>
            </Link>
            <p>{t("مساحتك لكل اللي بتصنعه.", "A space for everything you create.")}</p>
            <div className="neo-footer-links">
              <Link href="/templates">{t("الستايلات", "Styles")}</Link>
              <Link href="/explore">{t("استكشف", "Explore")}</Link>
              <Link href="/auth">{t("ابدأ الآن", "Get started")}</Link>
            </div>
          </div>
          <div className="neo-footer-bottom">
            <span>© 2026 TAQDOM • MADE WITH PURPOSE IN EGYPT</span>
            <a href="https://www.linkedin.com/in/abdullah-yehia/" target="_blank" rel="noreferrer">ABDULLAH YEHIA ↗</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
