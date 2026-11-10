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

interface DbSnapshot {
  users: Record<string, StoredUser>;
  portfolios: Record<string, { draft: PortfolioData; published: PortfolioData | null }>;
  views: Record<string, number>;
}

const globalForDb = globalThis as unknown as {
  __taqdomMemoryDb?: DbSnapshot;
};

function createInitialSnapshot(): DbSnapshot {
  const users: Record<string, StoredUser> = {};
  const portfolios: Record<string, { draft: PortfolioData; published: PortfolioData | null }> = {};
  const views: Record<string, number> = {};

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

  return { users, portfolios, views };
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
  if (entry?.published) {
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
    published: existing?.published ?? updated,
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

export async function resetTestAccountInDb(): Promise<PortfolioData> {
  const db = await readDiskOrMemoryDb();
  const fresh = structuredClone(SEED_PORTFOLIOS.test);
  db.portfolios.test = {
    draft: structuredClone(fresh),
    published: structuredClone(fresh),
  };
  await writeDiskAndMemoryDb(db);
  return fresh;
}

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
    const isDemo = Boolean(SEED_PORTFOLIOS[clean]);
    return {
      available: false,
      isDemoAccount: isDemo,
      reasonAr: isDemo
        ? "هذا النطاق مستخدم لحساب عرض حي (يمكنك زيارته الآن)"
        : "هذا الاسم محجوز بالفعل لمبدع آخر",
      reasonEn: isDemo
        ? "Active live showcase subdomain (click to visit)"
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
  const starter = createStarterPortfolio(clean, params.template || "athar", params.displayName || clean);
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
