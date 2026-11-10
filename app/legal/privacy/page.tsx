"use client";

import React from "react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();

  const sections = [
    {
      titleAr: "ما الذي تحفظه المنصة؟",
      titleEn: "What the platform stores",
      bodyAr: "قد تحفظ المنصة بيانات الحساب اللازمة لتسجيل الدخول وإدارة معرضك، والمعلومات التي تضيفها بنفسك مثل الاسم والنبذة والمشاريع والروابط والصور وإعدادات التصميم. لا تضف كلمات مرور أو أرقام هوية أو عناوين منزلية أو بيانات لا تريد نشرها.",
      bodyEn: "The platform may store account information needed for sign-in and portfolio management, plus the content you add—such as your name, bio, projects, links, images, and design settings. Do not add passwords, identity numbers, home addresses, or details you do not want to publish."
    },
    {
      titleAr: "ماذا يعني النشر؟",
      titleEn: "What publishing means",
      bodyAr: "عند نشر معرضك يصبح متاحًا عبر رابطك الشخصي على Taqdom. أي شخص لديه الرابط قد يستطيع فتحه ومشاركة محتواه. إخفاء المعرض من دليل Explore لا يجعل الرابط المنشور خاصًا ولا يمنع الوصول إليه مباشرة.",
      bodyEn: "When you publish, your portfolio becomes available at your personal Taqdom URL. Anyone with that URL may be able to open and share it. Hiding from Explore does not make a published URL private or block direct access."
    },
    {
      titleAr: "دليل Explore اختيار إضافي",
      titleEn: "Explore is opt-in",
      bodyAr: "لا يظهر معرضك في دليل Explore لمجرد أنك نشرته. تظهر أمثلة المنصة، ويظهر معرضك عندما تفعّل خيار الإدراج من الاستوديو ثم تعيد النشر. يمكنك إيقاف الإدراج لاحقًا دون إلغاء نشر رابطك الشخصي.",
      bodyEn: "Publishing alone does not list your portfolio in Explore. Sample profiles appear there, and your own portfolio is listed only when you enable the option in Studio and publish again. You can turn it off later without unpublishing your personal URL."
    },
    {
      titleAr: "الصور والروابط",
      titleEn: "Images and links",
      bodyAr: "الصور والروابط التي تضيفها قد تصبح جزءًا من معرضك المنشور. استخدم صورًا تملك حق استخدامها، وتأكد من أن الروابط لا تكشف بيانات خاصة أو حسابات لا تريد مشاركتها.",
      bodyEn: "Images and links you add may become part of your published portfolio. Use assets you have the right to use, and check that links do not reveal private information or accounts you do not intend to share."
    },
    {
      titleAr: "سلامتك أولًا",
      titleEn: "Your safety comes first",
      bodyAr: "راجع محتواك قبل النشر، ولا تعرض موقعك اللحظي أو جدولك اليومي أو وسائل اتصال شخصية لا تحتاجها. إذا كنت قاصرًا، ناقش نشر معلوماتك الشخصية مع ولي أمرك والتزم بالقواعد المحلية المناسبة لعمرك.",
      bodyEn: "Review your content before publishing. Avoid sharing your live location, daily routine, or personal contact details you do not need to share. If you are under the age of majority, discuss publishing personal information with a parent or guardian and follow the rules that apply where you live."
    }
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <section className="pt-32 pb-24 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <span className="taqdom-kicker">TAQDOM / TRUST & CONTROL</span>
          <h1 className="arabic-diacritics mt-4 text-3xl sm:text-5xl font-extrabold">
            {t("سياسة الخصوصية", "Privacy, publishing & control")}
          </h1>
          <p className="mt-4 text-muted-foreground leading-8">
            {t(
              "نشرح هنا ما يعنيه إنشاء معرض ونشره والظهور في دليل Explore. راجع هذه الصفحة قبل إضافة معلومات شخصية.",
              "This page explains what creating a portfolio, publishing it, and appearing in Explore mean. Review it before adding personal information."
            )}
          </p>
        </div>
        <div className="space-y-4">
          {sections.map((section) => (
            <article key={section.titleEn} className="glass-panel rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg font-bold text-foreground">{t(section.titleAr, section.titleEn)}</h2>
              <p className="mt-3 text-sm leading-8 text-muted-foreground">{t(section.bodyAr, section.bodyEn)}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-xs leading-7 text-muted-foreground">
          {t(
            "هذه الصفحة توضح سلوك المنتج بلغة مبسطة ولا تُعد استشارة قانونية. قد تتغير التفاصيل مع تطور المنصة.",
            "This page describes product behavior in plain language and is not legal advice. Details may change as the platform evolves."
          )}
        </p>
      </section>
      <FooterSection />
    </main>
  );
}
