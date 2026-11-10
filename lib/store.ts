"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PortfolioData, TemplateId } from "./types";
import { SEED_PORTFOLIOS, createStarterPortfolio } from "./seed-data";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  isFlagshipAccount?: boolean;
}

interface TaqdomStoreState {
  user: AuthUser | null;
  draft: PortfolioData;
  pastDrafts: PortfolioData[];
  futureDrafts: PortfolioData[];
  publishedPortfolios: Record<string, PortfolioData>;
  saveStatus: "saved" | "saving" | "unsaved";
  setUser: (user: AuthUser | null) => void;
  setDraft: (
    updater: PortfolioData | ((prev: PortfolioData) => PortfolioData),
    recordHistory?: boolean
  ) => void;
  switchTemplate: (template: TemplateId) => void;
  undo: () => void;
  redo: () => void;
  publishCurrentDraft: () => Promise<PortfolioData>;
  loginFlagshipShowcase: () => Promise<PortfolioData>;
  resetTestAccount: () => Promise<PortfolioData>;
  loadPortfolioForUsername: (username: string) => PortfolioData | null;
}

export const useTaqdomStore = create<TaqdomStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      draft: structuredClone(SEED_PORTFOLIOS.layla),
      pastDrafts: [],
      futureDrafts: [],
      publishedPortfolios: { ...SEED_PORTFOLIOS },
      saveStatus: "saved",

      setUser: (user) => {
        if (!user) {
          set({ user: null });
          return;
        }
        const existing =
          get().publishedPortfolios[user.username] ||
          SEED_PORTFOLIOS[user.username] ||
          createStarterPortfolio(user.username, "madar", user.username);
        set({
          user,
          draft: structuredClone(existing),
          publishedPortfolios: {
            ...get().publishedPortfolios,
            [user.username]: structuredClone(existing),
          },
        });
      },

      setDraft: (updater, recordHistory = true) => {
        const current = get().draft;
        const next =
          typeof updater === "function"
            ? updater(structuredClone(current))
            : structuredClone(updater);
        next.updatedAt = Date.now();
        set((state) => ({
          draft: next,
          pastDrafts: recordHistory
            ? [...state.pastDrafts.slice(-15), structuredClone(current)]
            : state.pastDrafts,
          futureDrafts: recordHistory ? [] : state.futureDrafts,
          saveStatus: "saved",
        }));
      },

      switchTemplate: (template) => {
        get().setDraft((prev) => ({
          ...prev,
          template,
        }));
      },

      undo: () => {
        const { pastDrafts, draft, futureDrafts } = get();
        if (pastDrafts.length === 0) return;
        const previous = pastDrafts[pastDrafts.length - 1];
        set({
          draft: structuredClone(previous),
          pastDrafts: pastDrafts.slice(0, -1),
          futureDrafts: [structuredClone(draft), ...futureDrafts.slice(0, 15)],
        });
      },

      redo: () => {
        const { pastDrafts, draft, futureDrafts } = get();
        if (futureDrafts.length === 0) return;
        const next = futureDrafts[0];
        set({
          draft: structuredClone(next),
          pastDrafts: [...pastDrafts.slice(-15), structuredClone(draft)],
          futureDrafts: futureDrafts.slice(1),
        });
      },

      publishCurrentDraft: async () => {
        set({ saveStatus: "saving" });
        const current = structuredClone(get().draft);
        current.publishedAt = Date.now();
        current.updatedAt = Date.now();

        try {
          await fetch("/api/portfolio/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ portfolio: current }),
          });
        } catch {
          // Fallback to client persistence if offline
        }

        set((state) => ({
          draft: current,
          publishedPortfolios: {
            ...state.publishedPortfolios,
            [current.username]: current,
          },
          saveStatus: "saved",
        }));

        return current;
      },

      loginFlagshipShowcase: async () => {
        const fresh = structuredClone(SEED_PORTFOLIOS.layla);
        try {
          await fetch("/api/auth/test-login", { method: "POST" });
        } catch {
          // Ignore network error
        }
        set((state) => ({
          user: {
            id: "user-layla",
            email: "layla@taqdom.me",
            username: "layla",
            isFlagshipAccount: true,
          },
          draft: structuredClone(fresh),
          publishedPortfolios: {
            ...SEED_PORTFOLIOS,
            ...state.publishedPortfolios,
            layla: structuredClone(fresh),
          },
          pastDrafts: [],
          futureDrafts: [],
          saveStatus: "saved",
        }));
        return fresh;
      },

      resetTestAccount: async () => {
        return get().loginFlagshipShowcase();
      },

      loadPortfolioForUsername: (username) => {
        const clean = username.trim().toLowerCase();
        return get().publishedPortfolios[clean] || SEED_PORTFOLIOS[clean] || null;
      },
    }),
    {
      name: "taqdom-sovereign-store-v2",
      partialize: (state) => ({
        user: state.user,
        draft: state.draft,
        publishedPortfolios: state.publishedPortfolios,
      }),
    }
  )
);
