import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ALL_TEMPLATE_IDS, validateUsername, type TemplateId } from "@/lib/types";
import { SEED_PORTFOLIOS } from "@/lib/seed-data";
import {
  checkUsernameAvailability,
  findUserByFirebaseOrEmail,
  upsertFirebaseUserInDb,
} from "@/lib/db";
import { signSessionToken } from "@/lib/auth";
import { sameOriginWriteAllowed } from "@/lib/api-session";
import {
  DEFAULT_FIREBASE_PROJECT_ID,
  suggestAvailableUsername,
  verifyFirebaseIdToken,
} from "@/lib/firebase-server";

export async function POST(req: NextRequest) {
  try {
    if (!sameOriginWriteAllowed(req)) {
      return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const idToken = String(body.idToken || "").trim();
    if (!idToken) {
      return NextResponse.json(
        { error: "رمز مصادقة Firebase مطلوب / Firebase ID token required" },
        { status: 400 }
      );
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
    let verified;
    try {
      verified = await verifyFirebaseIdToken(idToken, projectId);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "تعذر التحقق من حساب Google / Google verification failed",
        },
        { status: 401 }
      );
    }

    const existing = await findUserByFirebaseOrEmail(verified.uid, verified.email);
    if (existing && SEED_PORTFOLIOS[existing.username]) {
      return NextResponse.json(
        { error: "لا يمكن ربط حسابات العرض الرسمية عبر Google" },
        { status: 403 }
      );
    }

    let chosenUsername = existing?.username || "";
    if (!existing) {
      const requestedRaw = String(body.username || "").trim();
      if (requestedRaw) {
        const val = validateUsername(requestedRaw);
        if (!val.valid) {
          return NextResponse.json(
            { error: val.reasonAr || val.reasonEn || "Invalid username" },
            { status: 400 }
          );
        }
        const avail = await checkUsernameAvailability(val.normalized);
        if (!avail.available) {
          return NextResponse.json(
            { error: avail.reasonAr || avail.reasonEn || "Username unavailable" },
            { status: 409 }
          );
        }
        chosenUsername = val.normalized;
      } else {
        chosenUsername = await suggestAvailableUsername(
          { displayName: verified.name, email: verified.email, uid: verified.uid },
          async (candidate) => !(await checkUsernameAvailability(candidate)).available
        );
      }
    }

    const rawTemplate = String(body.template || "madar");
    const template: TemplateId = ALL_TEMPLATE_IDS.includes(rawTemplate as TemplateId)
      ? (rawTemplate as TemplateId)
      : "madar";
    const displayName = String(body.displayName || verified.name || chosenUsername).trim().slice(0, 80);

    const { user, portfolio, isNewUser } = await upsertFirebaseUserInDb({
      uid: verified.uid,
      email: verified.email,
      username: chosenUsername,
      displayName,
      picture: verified.picture,
      provider: verified.provider,
      template,
    });

    if (isNewUser) {
      try {
        revalidatePath(`/portfolio/${user.username}`);
        revalidatePath("/sitemap.xml");
      } catch {
        // Ignore in dev/edge
      }
    }

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      isTestAccount: false,
    });

    const res = NextResponse.json({
      ok: true,
      isNewUser,
      provider: verified.provider,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        authProvider: verified.provider,
      },
      portfolio,
    });

    res.cookies.set("taqdom_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https",
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Google authentication failed" },
      { status: 500 }
    );
  }
}
