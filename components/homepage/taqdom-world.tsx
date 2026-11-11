"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpLeft,
  ArrowUpRight,
  BookmarkCheck,
  Check,
  Cloud,
  Crown,
  Globe2,
  Layers3,
  LayoutTemplate,
  LockKeyhole,
  MonitorSmartphone,
  MousePointer2,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const templateCards = [
  { id: "madar", ar: "مَدَار", en: "Orbit", useAr: "التقنية والمنتجات الرقمية", useEn: "Technology & digital products", image: "/images/ultra/madar-1.webp" },
  { id: "athar", ar: "أَثَر", en: "Frame", useAr: "التصميم وصناعة المحتوى", useEn: "Design & creative work", image: "/images/ultra/athar-2.webp" },
  { id: "haven", ar: "مَلاذ", en: "Forma", useAr: "العمارة والتصميم الداخلي", useEn: "Architecture & interiors", image: "/images/ultra/haven-2.webp" },
  { id: "siyada", ar: "سِيَادَة", en: "Index", useAr: "الأعمال والقيادة", useEn: "Business & leadership", image: "/images/ultra/siyada-1.webp" },
  { id: "wameed", ar: "وَمِيض", en: "Pulse", useAr: "التسويق والمبيعات", useEn: "Marketing & sales", image: "/images/ultra/wameed-2.webp" },
  { id: "salam", ar: "سَلَام", en: "Flux", useAr: "الاستراتيجية والتقنية", useEn: "Strategy & technology", image: "/images/ultra/salam-2.webp" },
  { id: "meshwar", ar: "مِشْوَار", en: "Kin", useAr: "الموارد البشرية والاستشارات", useEn: "People & consulting", image: "/images/ultra/meshwar-2.webp" },
];

function RoyalCityScene() {
  return (
    <svg className="royal-city-svg" viewBox="0 0 1800 780" preserveAspectRatio="xMidYMid slice" role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id="royal-sky" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="var(--royal-sky-top)" />
          <stop offset="0.62" stopColor="var(--royal-sky-mid)" />
          <stop offset="1" stopColor="var(--royal-sky-bottom)" />
        </linearGradient>
        <linearGradient id="royal-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--royal-glass-a)" />
          <stop offset="0.48" stopColor="var(--royal-glass-b)" />
          <stop offset="1" stopColor="var(--royal-glass-c)" />
        </linearGradient>
        <linearGradient id="royal-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--royal-water-top)" />
          <stop offset="1" stopColor="var(--royal-water-bottom)" />
        </linearGradient>
        <linearGradient id="royal-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#A66E2B" />
          <stop offset="0.48" stopColor="#F8D79A" />
          <stop offset="1" stopColor="#B67B35" />
        </linearGradient>
        <pattern id="royal-windows" width="34" height="28" patternUnits="userSpaceOnUse">
          <path d="M5 5h20v15H5z" fill="var(--royal-window)" opacity=".7" />
        </pattern>
        <filter id="royal-glow"><feGaussianBlur stdDeviation="10" /></filter>
      </defs>
      <rect width="1800" height="780" fill="url(#royal-sky)" />
      <g className="royal-sky-details" fill="none" stroke="var(--royal-cloud)" strokeWidth="3" opacity=".72">
        <path d="M40 150c65-36 140-36 205 0 33-42 100-57 151-22 46-24 105-17 142 17" />
        <path d="M1080 135c58-38 126-30 176 4 46-35 101-31 142-5" opacity=".62" />
        <path d="M1290 218c56-20 100-13 151 10 34-25 75-26 112-6" opacity=".42" />
      </g>
      <g className="royal-stars" fill="#F6D79E">
        {Array.from({ length: 36 }).map((_, i) => <circle key={i} cx={75 + ((i * 157) % 1640)} cy={35 + ((i * 71) % 290)} r={i % 4 === 0 ? 2.6 : 1.2} opacity={i % 3 === 0 ? .9 : .45} />)}
      </g>
      <g opacity=".82" fill="var(--royal-skyline)">
        <path d="M1000 490V304h53v-76h16v76h42v186z" />
        <path d="M1110 490V260h62v-35h12v35h52v230z" />
        <path d="M1247 490V330h72v-82h13v82h39v160z" />
        <path d="M1380 490V285h50v-116h14v116h43v205z" />
        <path d="M1490 490V325h64v-66h13v66h43v165z" />
        <path d="M1624 490V365h58v-42h12v42h35v125z" />
        <path d="M905 490V360h40v-42h13v42h34v130z" />
      </g>
      <g className="royal-tower-lights" stroke="var(--royal-lights)" strokeWidth="3" opacity=".75">
        {Array.from({ length: 55 }).map((_, i) => <path key={i} d={`M${1000 + (i * 31) % 690} ${302 + (i * 19) % 160}h10`} />)}
      </g>
      <g>
        <path d="M0 470C80 396 188 364 306 362L680 366C790 367 872 417 920 492L920 640H0Z" fill="url(#royal-glass)" stroke="var(--royal-building-line)" strokeWidth="5" />
        <path d="M0 470C120 390 230 382 350 384H641C752 384 847 436 896 505" fill="none" stroke="url(#royal-gold)" strokeWidth="10" opacity=".95" />
        <path d="M0 498C126 428 231 414 352 416H627C731 416 812 460 865 524" fill="none" stroke="var(--royal-building-line)" strokeWidth="4" opacity=".8" />
        <path d="M0 535C130 470 242 458 357 458H615C706 458 786 495 830 552" fill="none" stroke="var(--royal-building-line)" strokeWidth="3" opacity=".72" />
        <path d="M0 470C100 390 200 360 310 362H650C770 365 870 430 920 505V640H0Z" fill="url(#royal-windows)" opacity=".34" />
        <path d="M0 590H920" stroke="var(--royal-building-line)" strokeWidth="3" opacity=".55" />
        <path d="M110 442v176M230 407v211M354 385v235M480 384v236M607 387v231M732 411v206M846 457v160" stroke="var(--royal-building-line)" strokeWidth="2" opacity=".45" />
        <path d="M0 628C164 581 292 580 450 601c146 20 284 19 470-9v188H0Z" fill="url(#royal-water)" opacity=".9" />
      </g>
      <g opacity=".98">
        <path d="M0 644c200-48 360-40 535-14 145 22 265 23 385-4" fill="none" stroke="url(#royal-gold)" strokeWidth="4" opacity=".9" />
        <path d="M0 685c190-25 340-20 500 0 126 16 250 14 390-11" fill="none" stroke="var(--royal-reflection)" strokeWidth="3" opacity=".6" />
        <path d="M0 733c190-20 324-18 458-3 147 17 270 11 404-8" fill="none" stroke="var(--royal-reflection)" strokeWidth="2" opacity=".4" />
      </g>
      <g className="royal-horizon" opacity=".55">
        <path d="M920 500h880" stroke="var(--royal-horizon-line)" strokeWidth="2" />
        <path d="M930 530h870M980 580h820M1020 632h780" stroke="var(--royal-horizon-line)" strokeWidth="1" />
      </g>
    </svg>
  );
}

function FeatureStrip({ t }: { t: (ar: string, en: string) => string }) {
  const features = [
    { icon: Crown, ar: "قوالب احترافية", en: "Premium templates", subAr: "سبعة تصاميم جاهزة", subEn: "Seven ready-made styles" },
    { icon: BookmarkCheck, ar: "مجاني دائمًا", en: "Always free", subAr: "من غير اشتراكات", subEn: "No subscriptions" },
    { icon: Globe2, ar: "رابط باسمك", en: "Your own link", subAr: "مساحتك بعنوانك", subEn: "A personal address" },
    { icon: Layers3, ar: "تخصيص مرن", en: "Flexible editing", subAr: "رتّب مشروعك بطريقتك", subEn: "Shape it your way" },
    { icon: MonitorSmartphone, ar: "كل الشاشات", en: "Every screen", subAr: "موبايل وكمبيوتر", subEn: "Mobile and desktop" },
  ];
  return (
    <div className="royal-feature-strip" aria-label={t("مميزات تقدّم", "Taqdom benefits")}>
      {features.map(({ icon: Icon, ar, en, subAr, subEn }) => (
        <div className="royal-feature" key={ar}>
          <span className="royal-feature-icon"><Icon size={23} strokeWidth={1.8} /></span>
          <span className="royal-feature-copy"><strong>{t(ar, en)}</strong><small>{t(subAr, subEn)}</small></span>
        </div>
      ))}
    </div>
  );
}

export function TaqdomWorldExperience() {
  const { lang, t } = useLanguage();
  const Arrow = lang === "ar" ? ArrowUpLeft : ArrowUpRight;

  return (
    <div className="royal-site">
      <main>
        <section className="royal-hero" id="top">
          <div className="royal-scene"><RoyalCityScene /></div>
          <div className="royal-hero-shade" />
          <div className="royal-hero-content royal-container">
            <div className="royal-hero-copy">
              <div className="royal-badge"><Sparkles size={15} /><span>{t("بورتفوليو مجاني دائمًا • لكل شخص", "A free portfolio. Always. For everyone.")}</span></div>
              <p className="royal-overline">{t("مساحتك الرقمية تبدأ من اسمك", "YOUR SPACE STARTS WITH YOUR NAME")}</p>
              <h1>{t("تقدّم..", "Taqdom.")}<span>{t("بورتفوليو يليق بطموحك", "A portfolio built around you.")}</span></h1>
              <p className="royal-hero-description">{t("أنشئ بورتفوليو يعرض مشاريعك ومهاراتك وإنجازاتك في موقع متكامل يحمل اسمك. مجاني دائمًا، وتقدر تبدأ في أي وقت.", "Create a complete personal portfolio for your projects, skills, and achievements — on a link with your name. Free forever, ready whenever you are.")}</p>
              <div className="royal-hero-actions">
                <Link href="/auth" className="royal-button royal-button-gold">{t("ابدأ بورتفوليوك مجانًا", "Create your free portfolio")}<Arrow size={17} /></Link>
                <Link href="/templates" className="royal-button royal-button-glass">{t("استكشف القوالب", "Explore templates")}<LayoutTemplate size={17} /></Link>
              </div>
              <div className="royal-promise"><Check size={15} /><span>{t("مجاني دائمًا — لا اشتراك ولا فترة تجريبية", "Free forever — no subscription, no trial")}</span></div>
            </div>
            <div className="royal-hero-product" aria-label={t("معاينة بورتفوليو على تقدّم", "Taqdom portfolio preview")}>
              <div className="royal-product-glow" />
              <div className="royal-browser">
                <div className="royal-browser-top"><span className="royal-window-dots"><i /><i /><i /></span><span className="royal-address" dir="ltr">yourname.taqdom.me</span><span className="royal-lock"><LockKeyhole size={12} /></span></div>
                <div className="royal-browser-image">
                  <Image src="/images/ultra/haven-hero.webp" alt={t("مثال لقالب بورتفوليو", "Portfolio template example")} fill priority sizes="(max-width: 900px) 90vw, 46vw" />
                  <div className="royal-browser-overlay"><span>{t("مساحتك.. بطريقتك", "YOUR SPACE. YOUR WAY.")}</span><b>{t("اعرض أفضل ما لديك", "Show your best work")}</b></div>
                </div>
                <div className="royal-browser-bottom"><span><i /> {t("بورتفوليو منشور", "Published portfolio")}</span><span dir="ltr">taqdom.me</span></div>
              </div>
              <div className="royal-float-note royal-float-note-a"><span><BookmarkCheck size={17} /></span><b>{t("مجاني دائمًا", "Always free")}</b></div>
              <div className="royal-float-note royal-float-note-b"><span><Zap size={17} /></span><b>{t("جاهز للمشاركة", "Ready to share")}</b></div>
            </div>
          </div>
          <div className="royal-hero-floor" />
          <div className="royal-container"><FeatureStrip t={t} /></div>
        </section>

        <section className="royal-templates-section" id="templates">
          <div className="royal-container">
            <div className="royal-section-head">
              <div><span className="royal-section-kicker">{t("اختر العالم اللي يشبهك", "FIND YOUR STYLE")}</span><h2>{t("7 قوالب احترافية جاهزة", "Seven polished portfolio styles")}</h2><p>{t("ابدأ من تصميم متكامل، وبعدها خصّصه بمحتواك وألوانك وصورك.", "Start with a complete design, then make it yours with your content, colours, and images.")}</p></div>
              <Link href="/templates" className="royal-inline-link">{t("استعرض القوالب كلها", "View all templates")}<Arrow size={17} /></Link>
            </div>
            <div className="royal-template-grid">
              {templateCards.map((item, index) => (
                <Link href={`/templates/${item.id}`} className="royal-template-card" key={item.id}>
                  <div className="royal-template-art">
                    <Image src={item.image} alt={t(item.ar, item.en)} fill sizes="(max-width: 680px) 74vw, (max-width: 1080px) 32vw, 19vw" loading="lazy" />
                    <span className="royal-template-index">0{index + 1}</span>
                    <span className="royal-template-open"><Arrow size={17} /></span>
                  </div>
                  <div className="royal-template-meta"><div><strong>{t(item.ar, item.en)}</strong><span>{t(item.useAr, item.useEn)}</span></div><i>{item.en.toUpperCase()}</i></div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="royal-studio-section" id="studio-preview">
          <div className="royal-container royal-studio-layout">
            <div className="royal-studio-copy">
              <span className="royal-section-kicker">{t("استوديو تقدّم", "TAQDOM STUDIO")}</span>
              <h2>{t("كل تفاصيل بورتفوليوك.. تحت إيدك", "Every detail. Yours to shape.")}</h2>
              <p>{t("عدّل بياناتك، اختار القالب، أضف مشاريعك، وعاين موقعك قبل النشر. كل تغيير واضح قدامك.", "Edit your profile, choose a style, add projects, and preview your complete site before publishing. Every change is visible as you work.")}</p>
              <div className="royal-studio-points">
                <span><MousePointer2 size={17} />{t("تحرير مباشر وسهل", "Direct, simple editing")}</span>
                <span><Layers3 size={17} />{t("ترتيب الأقسام والمحتوى", "Arrange sections and content")}</span>
                <span><MonitorSmartphone size={17} />{t("معاينة لكل الأجهزة", "Desktop and mobile preview")}</span>
                <span><Cloud size={17} />{t("حفظ ونشر بورتفوليوك", "Save and publish your portfolio")}</span>
              </div>
              <Link href="/studio" className="royal-button royal-button-gold">{t("افتح الاستوديو", "Open Studio")}<Arrow size={17} /></Link>
            </div>
            <div className="royal-studio-device">
              <div className="royal-editor">
                <div className="royal-editor-top"><span className="royal-editor-brand"><b>T</b> Taqdom <small>STUDIO</small></span><span className="royal-editor-status"><i /> {t("تم الحفظ", "Saved")}</span><span className="royal-editor-publish">{t("نشر", "Publish")} ↗</span></div>
                <div className="royal-editor-workspace">
                  <aside className="royal-editor-tools"><span className="active"><LayoutTemplate size={16} /></span><span><Layers3 size={16} /></span><span><Sparkles size={16} /></span><span><Globe2 size={16} /></span></aside>
                  <aside className="royal-editor-settings"><strong>{t("تخصيص المظهر", "Appearance")}</strong><small>{t("اختر التصميم المناسب", "Choose your style")}</small><div className="royal-setting-swatch"><i /><i /><i /><i /></div><strong>{t("الأقسام", "Sections")}</strong>{[t("المقدمة", "Introduction"),t("نبذة عني", "About me"),t("المشاريع", "Projects"),t("المهارات", "Skills")].map(x=><span key={x} className="royal-setting-row"><i />{x}</span>)}</aside>
                  <div className="royal-editor-canvas"><div className="royal-editor-site"><div className="royal-editor-site-nav">YOUR NAME <span>ABOUT　 WORK　 CONTACT</span></div><div className="royal-editor-site-image"><Image src="/images/ultra/haven-hero.webp" alt="" fill sizes="(max-width: 900px) 60vw, 34vw" loading="lazy" /></div><div className="royal-editor-site-caption"><small>CREATIVE PORTFOLIO</small><b>{t("مستقبلك يبدأ من هنا", "Your next chapter starts here")}</b><span>{t("أعمالك.. قصتك.. إنجازاتك", "Your work. Your story. Your craft.")}</span></div></div></div>
                </div>
                <div className="royal-editor-foot"><span><Check size={13} />{t("تغييراتك محفوظة", "Your changes are saved")}</span><span>100% RESPONSIVE</span></div>
              </div>
              <div className="royal-device-reflection" />
            </div>
          </div>
        </section>

        <section className="royal-publish-section">
          <div className="royal-container royal-publish-card">
            <div><span className="royal-section-kicker">{t("من الاستوديو إلى العالم", "FROM STUDIO TO THE WORLD")}</span><h2>{t("انشر موقعك باسمك.. وشارك شغلك بكل فخر", "Publish under your name. Share your work with pride.")}</h2><p>{t("كل بورتفوليو منشور يظهر كموقع كامل مستقل على رابطك الشخصي، مع عبارة صغيرة: مدعوم بواسطة تقدّم.", "Every published portfolio is a complete standalone website on its own personal link, with a discreet “Powered by Taqdom” credit.")}</p></div>
            <div className="royal-publish-domain"><Globe2 size={21} /><strong dir="ltr">yourname.taqdom.me</strong><span><Check size={14} />{t("موقعك جاهز للمشاركة", "Ready to share")}</span><Link href="/auth">{t("ابدأ مجانًا", "Start for free")}<Arrow size={16} /></Link></div>
          </div>
        </section>

        <section className="royal-founder-section" id="about">
          <div className="royal-container royal-founder-inner">
            <div><span className="royal-section-kicker">{t("عن المشروع", "ABOUT THE PROJECT")}</span><h2>{t("تقدّم مشروع تخرج.. بفكرة تفتح المجال للجميع", "A graduation project built to open the door for everyone.")}</h2><p>{t("تقدّم مشروع تخرج يهدف إلى تمكين كل شخص من إنشاء بورتفوليو مجاني يعرض أعماله ومهاراته وإنجازاته، في أي وقت، ومن غير اشتراك.", "Taqdom is a graduation project that gives everyone a place to present their work, skills, and achievements — free at any time, with no subscription.")}</p></div>
            <div className="royal-founder-credit"><span className="royal-founder-monogram">T</span><div><small>{t("المؤسس والمطوّر", "FOUNDER & DEVELOPER")}</small><strong>عبدالله يحى</strong><span>Abdullah Yehia</span></div><BookmarkCheck size={22} /></div>
          </div>
        </section>

        <section className="royal-faq-section" id="faq">
          <div className="royal-container">
            <div className="royal-faq-heading">
              <span className="royal-section-kicker">{t("إجابات واضحة", "GOOD TO KNOW")}</span>
              <h2>{t("أسئلة بتدور في بالك", "A few things you may be wondering")}</h2>
            </div>
            <div className="royal-faq-grid">
              <article><h3>{t("هل تقدّم مجاني فعلًا؟", "Is Taqdom really free?")}</h3><p>{t("نعم، إنشاء البورتفوليو ونشره متاحان مجانًا دائمًا، من غير اشتراك أو فترة تجريبية.", "Yes. Creating and publishing your portfolio is free, with no subscription or trial period.")}</p></article>
              <article><h3>{t("هل أقدر أعدّل موقعي بعد النشر؟", "Can I edit my site after publishing?")}</h3><p>{t("تقدر ترجع للاستوديو وتعدّل بياناتك ومشاريعك ومظهر موقعك، ثم تنشر التحديثات.", "Return to Studio to update your details, projects, and design, then publish your changes.")}</p></article>
              <article><h3>{t("هل الموقع بيظهر باسمي؟", "Will the site use my name?")}</h3><p>{t("كل بورتفوليو منشور له رابط شخصي على نطاق تقدّم الفرعي، ويظهر كموقع مستقل كامل.", "Every published portfolio gets its own personal Taqdom subdomain and appears as a complete standalone website.")}</p></article>
              <article><h3>{t("هل أقدر أختار شكل الموقع؟", "Can I choose how it looks?")}</h3><p>{t("اختار من القوالب السبعة، وخصّص المحتوى والأقسام والخلفيات من داخل الاستوديو.", "Choose from seven styles and customize your content, sections, and backgrounds in Studio.")}</p></article>
            </div>
          </div>
        </section>

        <section className="royal-final-cta">
          <div className="royal-container royal-final-cta-inner"><div><span className="royal-section-kicker">{t("ابدأ في أي وقت", "START WHENEVER YOU ARE READY")}</span><h2>{t("مكان شغلك مستنيك.", "Your work deserves a home.")}</h2><p>{t("ابنِ بورتفوليوك المجاني وابدأ شارك رحلتك.", "Build your free portfolio and share your journey.")}</p></div><Link href="/auth" className="royal-button royal-button-dark">{t("أنشئ بورتفوليوك الآن", "Create your portfolio")}<Arrow size={17} /></Link></div>
        </section>
      </main>

      <footer className="royal-footer">
        <div className="royal-container royal-footer-main"><Link href="/" className="royal-footer-brand"><span>T</span><b>Taqdom</b></Link><p>{t("بورتفوليو مجاني لكل شخص، في أي وقت.", "A free portfolio for everyone, whenever you need it.")}</p><div className="royal-footer-links"><Link href="/templates">{t("القوالب", "Templates")}</Link><Link href="/explore">{t("استكشف", "Explore")}</Link><Link href="/legal/privacy">{t("الخصوصية", "Privacy")}</Link><Link href="/legal/terms">{t("الشروط", "Terms")}</Link></div></div>
        <div className="royal-container royal-footer-bottom"><span>© {new Date().getFullYear()} TAQDOM</span><span>{t("مشروع تخرج • المؤسس عبدالله يحى", "Graduation project • Founder: Abdullah Yehia")}</span><span>{t("مدعوم من شغف صُنع في مصر", "Built with purpose in Egypt")}</span></div>
      </footer>
    </div>
  );
}
