import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validateUsername } from "@/lib/types";
import {
  checkUsernameAvailability,
  findUserByUsernameOrEmail,
  registerUserInDb,
} from "@/lib/db";
import { hashPasswordPBKDF2, signSessionToken } from "@/lib/auth";
import { sameOriginWriteAllowed } from "@/lib/api-session";

export async function POST(req: NextRequest) {
  try {
    if (!sameOriginWriteAllowed(req)) {
      return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
    }
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const rawUsername = String(body.username || "");
    const password = String(body.password || "");
    const displayName = String(body.displayName || "").trim();
    const template = body.template || "athar";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "يرجى إدخال بريد إلكتروني صحيح / Valid email required" },
        { status: 400 }
      );
    }

    const val = validateUsername(rawUsername);
    if (!val.valid) {
      return NextResponse.json(
        { error: val.reasonAr || val.reasonEn || "Invalid username" },
        { status: 400 }
      );
    }

    if (password.length < 15 || password.length > 128) {
      return NextResponse.json(
        { error: "استخدم عبارة مرور من 15 إلى 128 حرفًا / Passwords must be 15–128 characters." },
        { status: 400 }
      );
    }

    const existingEmailUser = await findUserByUsernameOrEmail(email);
    if (existingEmailUser) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مسجل بالفعل / Email already registered" },
        { status: 409 }
      );
    }

    const avail = await checkUsernameAvailability(val.normalized);
    if (!avail.available) {
      return NextResponse.json(
        { error: avail.reasonAr || avail.reasonEn || "Username unavailable" },
        { status: 409 }
      );
    }

    const { hash, salt } = await hashPasswordPBKDF2(password);
    const { user, portfolio } = await registerUserInDb({
      email,
      username: val.normalized,
      passwordHash: hash,
      salt,
      displayName: displayName || val.normalized,
      template,
    });

    try {
      revalidatePath(`/portfolio/${user.username}`);
      revalidatePath("/sitemap.xml");
    } catch {
      // ignore
    }

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
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
      { error: err instanceof Error ? err.message : "Registration failed" },
      { status: 500 }
    );
  }
}
