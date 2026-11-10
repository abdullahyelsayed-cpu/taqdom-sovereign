"use client";

import React from "react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";

export default function TermsPage() {
  const { t } = useLanguage();

  const rules = [
    {
      titleAr: "أعمالك تظل ملكك",
      titleEn: "Your work remains yours",
      bodyAr: "تظل حقوقك في المشاريع والصور والنصوص التي ترفعها لك أو لأصحاب الحقوق الأصليين. تمنح المنصة الإذن التقني اللازم لعرض المحتوى الذي تختار نشره وتشغيل الخدمة.",
      bodyEn: "You or the original rights holders keep ownership of the projects, images, and text you upload. You grant the platform the limited technical permission needed to display content you choose to publish and operate the service."
    },
    {
      titleAr: "انشر ما تملك حق مشاركته",
      titleEn: "Only publish what you can share",
      bodyAr: "استخدم محتوى تملك حقوقه أو لديك إذن باستخدامه. لا تنشر بيانات شخصية لشخص آخر أو محتوى مضللًا أو ضارًا أو غير قانوني.",
      bodyEn: "Use content you own or have permission to use. Do not publish another person's personal information, misleading or harmful content, or material that is unlawful."
    },
    {
      titleAr: "النشر يعني أن الرابط عام",
      titleEn: "Publishing makes the link public",
      bodyAr: "بعد نشر معرضك، يستطيع من يملك الرابط فتحه ومشاركته. خيار Explore يتحكم في ظهور المعرض داخل الدليل فقط، ولا يحوّل الرابط المنشور إلى رابط خاص.",
      bodyEn: "After you publish, anyone with the link may open and share the portfolio. The Explore option controls directory listing only; it does not make a published URL private."
    },
    {
      titleAr: "الدقة والشفافية",
      titleEn: "Be accurate and transparent",
      bodyAr: "أدخل إنجازات وأرقامًا تستطيع دعمها، ووضّح متى تكون المشاريع أو النتائج نماذج تعليمية أو تجريبية. لا تستخدم شارات توثيق أو اعتمادات لم تحصل عليها.",
      bodyEn: "Add achievements and metrics you can support. Clearly label educational or sample projects and outcomes. Do not claim verification, credentials, or endorsements you have not received."
    },
    {
      titleAr: "استخدم المنصة بمسؤولية",
      titleEn: "Use the platform responsibly",
      bodyAr: "لا تشارك كلمات المرور أو بيانات الدخول مع الآخرين، وراجع المحتوى قبل النشر. إذا كنت قاصرًا، اطلب من ولي أمرك مراجعة ما تنشره من معلومات شخصية.",
      bodyEn: "Do not share passwords or sign-in details. Review your content before publishing. If you are under the age of majority, ask a parent or guardian to review personal information before you publish it."
    }
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <section className="pt-32 pb-24 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <span className="taqdom-kicker">TAQDOM / COMMUNITY RULES</span>
          <h1 className="arabic-diacritics mt-4 text-3xl sm:text-5xl font-extrabold">
            {t("شروط الاستخدام", "Terms of use")}
          </h1>
          <p className="mt-4 text-muted-foreground leading-8">
            {t("قواعد بسيطة تحافظ على ملكية أعمالك، ووضوح معلوماتك، واحترام الآخرين.", "Simple rules for ownership, honest portfolios, and respect for others.")}
          </p>
        </div>
        <div className="space-y-4">
          {rules.map((rule) => (
            <article key={rule.titleEn} className="glass-panel rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg font-bold">{t(rule.titleAr, rule.titleEn)}</h2>
              <p className="mt-3 text-sm leading-8 text-muted-foreground">{t(rule.bodyAr, rule.bodyEn)}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-xs leading-7 text-muted-foreground">
          {t("هذه صياغة مبسطة لقواعد المنتج وليست استشارة قانونية. راجع القوانين المحلية المطبقة عليك قبل نشر معلومات شخصية أو محتوى لطرف آخر.", "This is a plain-language summary of product rules, not legal advice. Check the laws that apply to you before publishing personal information or third-party content.")}
        </p>
      </section>
      <FooterSection />
    </main>
  );
}
