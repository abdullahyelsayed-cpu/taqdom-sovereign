import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteUserInDb, updateUserSettingsInDb, checkUsernameAvailability } from "@/lib/db";
import { hashPasswordPBKDF2, signSessionToken } from "@/lib/auth";
import { normalizeUsername, validateUsername } from "@/lib/types";
import { SEED_PORTFOLIOS } from "@/lib/seed-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentUsername = normalizeUsername(String(body.currentUsername || ""));
    if (!currentUsername) {
      return NextResponse.json({ error: "Missing currentUsername" }, { status: 400 });
    }

    let newUsername: string | undefined;
    if (body.newUsername && normalizeUsername(String(body.newUsername)) !== currentUsername) {
      const val = validateUsername(String(body.newUsername));
      if (!val.valid) {
        return NextResponse.json(
          { error: val.reasonAr || val.reasonEn || "Invalid username" },
          { status: 400 }
        );
      }
      const avail = await checkUsernameAvailability(val.normalized);
      if (!avail.available) {
        return NextResponse.json(
          { error: avail.reasonAr || avail.reasonEn || "Username already taken" },
          { status: 409 }
        );
      }
      newUsername = val.normalized;
    }

    let newPasswordHash: string | undefined;
    let newSalt: string | undefined;
    if (body.newPassword) {
      const pwd = String(body.newPassword);
      if (pwd.length < 6) {
        return NextResponse.json(
          { error: "كلمة المرور يجب أن تكون ٦ أحرف على الأقل / Password min 6 chars" },
          { status: 400 }
        );
      }
      const hashed = await hashPasswordPBKDF2(pwd);
      newPasswordHash = hashed.hash;
      newSalt = hashed.salt;
    }

    const updated = await updateUserSettingsInDb({
      currentUsername,
      newUsername,
      newPasswordHash,
      newSalt,
    });

    if (!updated) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    try {
      revalidatePath(`/portfolio/${currentUsername}`);
      revalidatePath(`/portfolio/${updated.user.username}`);
      revalidatePath("/sitemap.xml");
    } catch {
      // ignore
    }

    const token = await signSessionToken({
      userId: updated.user.id,
      email: updated.user.email,
      username: updated.user.username,
      isTestAccount: updated.user.username === "layla",
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: updated.user.id,
        email: updated.user.email,
        username: updated.user.username,
        isTestAccount: updated.user.username === "layla",
      },
      portfolio: updated.portfolio,
    });

    res.cookies.set("taqdom_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const uParam = req.nextUrl.searchParams.get("u");
    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(String(uParam || body.username || ""));
    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }
    if (SEED_PORTFOLIOS[username]) {
      return NextResponse.json(
        { error: "لا يمكن حذف حسابات العرض الرسمية / Cannot delete showcase accounts" },
        { status: 403 }
      );
    }
    const deleted = await deleteUserInDb(username);
    try {
      revalidatePath(`/portfolio/${username}`);
      revalidatePath("/sitemap.xml");
    } catch {
      // ignore
    }
    const res = NextResponse.json({ ok: deleted });
    res.cookies.set("taqdom_session", "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete account" },
      { status: 500 }
    );
  }
}
