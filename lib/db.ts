import { PortfolioData, RESERVED_USERNAMES, normalizeUsername } from "./types";
import { SEED_PORTFOLIOS, createStarterPortfolio } from "./seed-data";

export interface StoredUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

export interface StoredMedia {
  id: string;
  userId: string;
  key: string;
  mime: string;
  size: number;
  dataUrl: string;
  createdAt: number;
}

interface DbSnapshot {
  users: Record<string, StoredUser>;
  portfolios: Record<string, { draft: PortfolioData; published: PortfolioData | null }>;
  views: Record<string, number>;
  media?: Record<string, StoredMedia>;
}

const globalForDb = globalThis as unknown as {
  __taqdomMemoryDb?: DbSnapshot;
};

function createInitialSnapshot(): DbSnapshot {
  const users: Record<string, StoredUser> = {};
  const portfolios: Record<string, { draft: PortfolioData; published: PortfolioData | null }> = {};
  const views: Record<string, number> = {};
  const media: Record<string, StoredMedia> = {};

  for (const [uname, p] of Object.entries(SEED_PORTFOLIOS)) {
    users[uname] = {
      id: `user-${uname}`,
      email: p.email || `${uname}@taqdom.me`,
      username: uname,
      passwordHash: "seeded",
      salt: "seeded",
      createdAt: p.publishedAt || Date.now(),
    };
    portfolios[uname] = {
      draft: structuredClone(p),
      published: structuredClone(p),
    };
    views[uname] = p.views || 1200;
  }

  return { users, portfolios, views, media };
}

function getMemoryDb(): DbSnapshot {
  if (!globalForDb.__taqdomMemoryDb) {
    globalForDb.__taqdomMemoryDb = createInitialSnapshot();
  }
  return globalForDb.__taqdomMemoryDb;
}

async function readDiskOrMemoryDb(): Promise<DbSnapshot> {
  const mem = getMemoryDb();
  try {
    if (typeof process !== "undefined" && process.versions?.node) {
      const fs = await import("fs");
      const path = await import("path");
      const file = path.join(process.cwd(), ".taqdom-db.json");
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, "utf-8");
        const parsed = JSON.parse(raw) as DbSnapshot;
        if (parsed && parsed.portfolios) {
          if (!parsed.media) parsed.media = {};
          // Remove deprecated v1 'test' entry if present and ensure all 7 flagship seed creators exist
          delete parsed.users?.test;
          delete parsed.portfolios?.test;
          for (const [uname, p] of Object.entries(SEED_PORTFOLIOS)) {
            if (!parsed.portfolios[uname]) {
              parsed.portfolios[uname] = {
                draft: structuredClone(p),
                published: structuredClone(p),
              };
            }
            if (!parsed.users[uname]) {
              parsed.users[uname] = {
                id: `user-${uname}`,
                email: p.email || `${uname}@taqdom.me`,
                username: uname,
                passwordHash: "seeded",
                salt: "seeded",
                createdAt: p.publishedAt || Date.now(),
              };
            }
            if (!parsed.views[uname]) {
              parsed.views[uname] = p.views || 1200;
            }
          }
          globalForDb.__taqdomMemoryDb = parsed;
          return parsed;
        }
      }
    }
  } catch {
    // Edge or read-only environment: use memory db
  }
  return mem;
}

async function writeDiskAndMemoryDb(snapshot: DbSnapshot): Promise<void> {
  globalForDb.__taqdomMemoryDb = snapshot;
  try {
    if (typeof process !== "undefined" && process.versions?.node) {
      const fs = await import("fs");
      const path = await import("path");
      const file = path.join(process.cwd(), ".taqdom-db.json");
      fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), "utf-8");
    }
  } catch {
    // Ignore in read-only/edge runtime
  }
}

export async function getPublishedPortfolio(username: string): Promise<PortfolioData | null> {
  const clean = normalizeUsername(username);
  if (!clean) return null;
  const db = await readDiskOrMemoryDb();
  const entry = db.portfolios[clean];
  if (entry) {
    if (!entry.published) return null;
    return {
      ...entry.published,
      views: db.views[clean] ?? entry.published.views ?? 1,
    };
  }
  if (SEED_PORTFOLIOS[clean]) {
    return structuredClone(SEED_PORTFOLIOS[clean]);
  }
  return null;
}

export async function getAllPublishedPortfolios(): Promise<PortfolioData[]> {
  const db = await readDiskOrMemoryDb();
  const list: PortfolioData[] = [];
  for (const [uname, entry] of Object.entries(db.portfolios)) {
    if (entry.published) {
      list.push({
        ...entry.published,
        views: db.views[uname] ?? entry.published.views ?? 1,
      });
    }
  }
  return list;
}

export async function getDraftPortfolio(username: string): Promise<PortfolioData | null> {
  const clean = normalizeUsername(username);
  if (!clean) return null;
  const db = await readDiskOrMemoryDb();
  return db.portfolios[clean]?.draft || SEED_PORTFOLIOS[clean] || null;
}

export async function saveDraftPortfolio(portfolio: PortfolioData): Promise<PortfolioData> {
  const clean = normalizeUsername(portfolio.username);
  const db = await readDiskOrMemoryDb();
  const existing = db.portfolios[clean];
  const updated: PortfolioData = {
    ...portfolio,
    username: clean,
    updatedAt: Date.now(),
  };
  db.portfolios[clean] = {
    draft: updated,
    published: existing ? existing.published : updated,
  };
  await writeDiskAndMemoryDb(db);
  return updated;
}

export async function publishPortfolioInDb(portfolio: PortfolioData): Promise<PortfolioData> {
  const clean = normalizeUsername(portfolio.username);
  const db = await readDiskOrMemoryDb();
  const now = Date.now();
  const published: PortfolioData = {
    ...portfolio,
    username: clean,
    publishedAt: now,
    updatedAt: now,
    views: db.views[clean] ?? portfolio.views ?? 1,
  };
  db.portfolios[clean] = {
    draft: structuredClone(published),
    published: structuredClone(published),
  };
  if (!db.views[clean]) {
    db.views[clean] = 1;
  }
  await writeDiskAndMemoryDb(db);
  return published;
}

export async function unpublishPortfolioInDb(username: string): Promise<boolean> {
  const clean = normalizeUsername(username);
  if (!clean) return false;
  const db = await readDiskOrMemoryDb();
  const existing = db.portfolios[clean];
  if (!existing) return false;
  db.portfolios[clean] = {
    draft: existing.draft,
    published: null,
  };
  await writeDiskAndMemoryDb(db);
  return true;
}

export async function resetShowcaseAccountInDb(): Promise<PortfolioData> {
  const db = await readDiskOrMemoryDb();
  const fresh = structuredClone(SEED_PORTFOLIOS.layla);
  db.portfolios.layla = {
    draft: structuredClone(fresh),
    published: structuredClone(fresh),
  };
  await writeDiskAndMemoryDb(db);
  return fresh;
}

export const resetTestAccountInDb = resetShowcaseAccountInDb;

export async function checkUsernameAvailability(username: string): Promise<{
  available: boolean;
  isDemoAccount: boolean;
  reasonAr?: string;
  reasonEn?: string;
}> {
  const clean = normalizeUsername(username);
  if (RESERVED_USERNAMES.has(clean)) {
    return {
      available: false,
      isDemoAccount: false,
      reasonAr: "هذا النطاق محجوز لنظام تَقَدُّم",
      reasonEn: "Reserved system subdomain",
    };
  }
  const db = await readDiskOrMemoryDb();
  if (db.users[clean] || db.portfolios[clean]) {
    const isShowcase = Boolean(SEED_PORTFOLIOS[clean]);
    return {
      available: false,
      isDemoAccount: isShowcase,
      reasonAr: isShowcase
        ? "هذا النطاق مستخدم لحساب مبدع موثّق (يمكنك زيارته الآن)"
        : "هذا الاسم محجوز بالفعل لمبدع آخر",
      reasonEn: isShowcase
        ? "Verified creator showcase subdomain (click to visit)"
        : "This username is already taken",
    };
  }
  return {
    available: true,
    isDemoAccount: false,
    reasonAr: "النطاق الفرعي متاح للحجز الفوري!",
    reasonEn: "Subdomain is available for instant claim!",
  };
}

export async function registerUserInDb(params: {
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  displayName?: string;
  template?: PortfolioData["template"];
}): Promise<{ user: StoredUser; portfolio: PortfolioData }> {
  const clean = normalizeUsername(params.username);
  const db = await readDiskOrMemoryDb();
  const user: StoredUser = {
    id: `user-${clean}-${Date.now()}`,
    email: params.email.trim().toLowerCase(),
    username: clean,
    passwordHash: params.passwordHash,
    salt: params.salt,
    createdAt: Date.now(),
  };
  const starter = createStarterPortfolio(clean, params.template || "madar", params.displayName || clean);
  starter.email = user.email;
  db.users[clean] = user;
  db.portfolios[clean] = {
    draft: structuredClone(starter),
    published: structuredClone(starter),
  };
  db.views[clean] = 1;
  await writeDiskAndMemoryDb(db);
  return { user, portfolio: starter };
}

export async function findUserByUsernameOrEmail(identifier: string): Promise<StoredUser | null> {
  const clean = identifier.trim().toLowerCase();
  const db = await readDiskOrMemoryDb();
  if (db.users[clean]) return db.users[clean];
  for (const u of Object.values(db.users)) {
    if (u.email.toLowerCase() === clean || u.username.toLowerCase() === clean) {
      return u;
    }
  }
  return null;
}

export async function incrementPortfolioView(username: string): Promise<number> {
  const clean = normalizeUsername(username);
  const db = await readDiskOrMemoryDb();
  db.views[clean] = (db.views[clean] || 100) + 1;
  await writeDiskAndMemoryDb(db);
  return db.views[clean];
}

export async function saveMediaInDb(params: {
  userId?: string;
  key: string;
  mime: string;
  size: number;
  dataUrl: string;
}): Promise<StoredMedia> {
  const db = await readDiskOrMemoryDb();
  if (!db.media) db.media = {};
  const item: StoredMedia = {
    id: `media-${params.key}`,
    userId: params.userId || "anonymous",
    key: params.key,
    mime: params.mime,
    size: params.size,
    dataUrl: params.dataUrl,
    createdAt: Date.now(),
  };
  db.media[params.key] = item;
  await writeDiskAndMemoryDb(db);
  return item;
}

export async function getMediaFromDb(key: string): Promise<StoredMedia | null> {
  const db = await readDiskOrMemoryDb();
  return db.media?.[key] || null;
}

export async function updateUserSettingsInDb(params: {
  currentUsername: string;
  newUsername?: string;
  newPasswordHash?: string;
  newSalt?: string;
}): Promise<{ user: StoredUser; portfolio: PortfolioData } | null> {
  const cur = normalizeUsername(params.currentUsername);
  const db = await readDiskOrMemoryDb();
  const user = db.users[cur];
  const pf = db.portfolios[cur];
  if (!user || !pf) return null;

  if (params.newPasswordHash && params.newSalt) {
    user.passwordHash = params.newPasswordHash;
    user.salt = params.newSalt;
  }

  let targetUsername = cur;
  if (params.newUsername) {
    const nextClean = normalizeUsername(params.newUsername);
    if (nextClean && nextClean !== cur && !db.users[nextClean] && !RESERVED_USERNAMES.has(nextClean)) {
      targetUsername = nextClean;
      delete db.users[cur];
      delete db.portfolios[cur];
      user.username = targetUsername;
      pf.draft.username = targetUsername;
      if (pf.published) pf.published.username = targetUsername;
      db.views[targetUsername] = db.views[cur] || 1;
    }
  }

  db.users[targetUsername] = user;
  db.portfolios[targetUsername] = pf;
  await writeDiskAndMemoryDb(db);
  return { user, portfolio: pf.draft };
}

export async function deleteUserInDb(username: string): Promise<boolean> {
  const clean = normalizeUsername(username);
  if (!clean || SEED_PORTFOLIOS[clean]) return false;
  const db = await readDiskOrMemoryDb();
  delete db.users[clean];
  delete db.portfolios[clean];
  delete db.views[clean];
  await writeDiskAndMemoryDb(db);
  return true;
}
