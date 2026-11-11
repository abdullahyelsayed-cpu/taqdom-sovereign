import { NextRequest, NextResponse } from "next/server";
import { findUserByUsernameOrEmail, getDraftPortfolio } from "@/lib/db";
import { hashPasswordPBKDF2, signSessionToken } from "@/lib/auth";
import { SEED_PORTFOLIOS } from "@/lib/seed-data";
import { sameOriginWriteAllowed } from "@/lib/api-session";

export async function POST(req: NextRequest) {
  try {
    if (!sameOriginWriteAllowed(req)) {
      return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
    }
    const body = await req.json();
    const identifier = String(body.identifier || body.email || body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!identifier) {
      return NextResponse.json(
        { error: "يرجى إدخال اسم المستخدم أو البريد الإلكتروني" },
        { status: 400 }
      );
    }

    const user = await findUserByUsernameOrEmail(identifier);
    if (!user) {
      return NextResponse.json(
        { error: "الحساب غير موجود. يمكنك إنشاء حساب جديد أو استخدام حساب الاختبار الفوري." },
        { status: 401 }
      );
    }

    const isSeededHash = ["seeded-pbkdf2", "seeded", "d1-hash"].includes(user.passwordHash);
    if (isSeededHash) {
      return NextResponse.json(
        { error: "هذا حساب عرض تجريبي. استخدم زر معاينة الحساب التجريبي من صفحة الدخول." },
        { status: 403 }
      );
    }

    const { hash } = await hashPasswordPBKDF2(password, user.salt);
    if (!password || hash !== user.passwordHash) {
      return NextResponse.json(
        { error: "كلمة المرور غير صحيحة / Invalid credentials" },
        { status: 401 }
      );
    }

    const portfolio = (await getDraftPortfolio(user.username)) || SEED_PORTFOLIOS[user.username] || SEED_PORTFOLIOS.test;
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      isTestAccount: user.username === "test",
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isTestAccount: user.username === "test",
      },
      portfolio,
    });

    res.cookies.set("taqdom_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Login failed" },
      { status: 500 }
    );
  }
}
