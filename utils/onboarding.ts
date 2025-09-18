/**
 * Utilities for persisting and querying onboarding completion status.
 *
 * Usage:
 *   import {
 *     markOnboardingCompleted,
 *     hasCompletedOnboarding,
 *     getOnboardingCompletionInfo,
 *     ONBOARDING_STORAGE_KEY,
 *     subscribeOnboarding
 *   } from '../utils/onboarding';
 *
 *   // When user finishes last onboarding step OR after paywall decision:
 *   await markOnboardingCompleted();
 *
 *   // Later (e.g. root index splash):
 *   const done = await hasCompletedOnboarding();
 *
 * Data format (in AsyncStorage):
 *   key: "onboarding_completed"
 *   value: JSON.stringify({
 *     version: 1,
 *     completedAt: string (ISO date)
 *   })
 *
 * Design goals:
 * - Single read caching (in‑memory) to prevent multiple AsyncStorage roundtrips.
 * - Graceful fallback if AsyncStorage is not installed (won't crash, always returns false).
 * - Tiny pub/sub so UI can react instantly (e.g. hide onboarding without full reload).
 */

export const ONBOARDING_STORAGE_KEY = 'onboarding_completed';
const DATA_VERSION = 1;

interface OnboardingRecord {
  version: number;
  completedAt: string; // ISO date string
}

interface CompletionInfo {
  completed: boolean;
  completedAt: Date | null;
  raw?: OnboardingRecord | null;
}

type Listener = (info: CompletionInfo) => void;

// --- AsyncStorage safe dynamic import (avoids crash if package missing) ---
let Async: {
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
  removeItem: (k: string) => Promise<void>;
};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Async = require('@react-native-async-storage/async-storage').default;
} catch {
  // Fallback shim (non-persistent)
  const mem: Record<string, string> = {};
  Async = {
    async getItem(k: string) {
      return mem[k] ?? null;
    },
    async setItem(k: string, v: string) {
      mem[k] = v;
    },
    async removeItem(k: string) {
      delete mem[k];
    },
  };
}

// --- Internal cache ---
let cachedInfo: CompletionInfo | null = null;
let pendingPromise: Promise<CompletionInfo> | null = null;

// --- Pub/Sub ---
const listeners = new Set<Listener>();

export function subscribeOnboarding(listener: Listener): () => void {
  listeners.add(listener);
  // Immediate fire with current state if cached
  if (cachedInfo) {
    try {
      listener(cachedInfo);
    } catch {
      /* ignore */
    }
  } else {
    // Trigger async load (fire-and-forget)
    void getOnboardingCompletionInfo().then((info) => {
      try {
        listener(info);
      } catch {
        /* ignore */
      }
    });
  }
  return () => listeners.delete(listener);
}

function notify(info: CompletionInfo) {
  listeners.forEach((l) => {
    try {
      l(info);
    } catch {
      /* ignore individual listener errors */
    }
  });
}

// --- Core helpers ---
async function readRecord(): Promise<OnboardingRecord | null> {
  try {
    const raw = await Async.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as any).version === DATA_VERSION &&
      typeof (parsed as any).completedAt === 'string'
    ) {
      return parsed as OnboardingRecord;
    }
    // Invalid / legacy shape -> treat as incomplete
    return null;
  } catch {
    return null;
  }
}

function toInfo(record: OnboardingRecord | null): CompletionInfo {
  return {
    completed: !!record,
    completedAt: record ? new Date(record.completedAt) : null,
    raw: record,
  };
}

/**
 * Returns completion info (cached after first successful read).
 */
export async function getOnboardingCompletionInfo(): Promise<CompletionInfo> {
  if (cachedInfo) return cachedInfo;
  if (pendingPromise) return pendingPromise;

  pendingPromise = (async () => {
    const record = await readRecord();
    const info = toInfo(record);
    cachedInfo = info;
    pendingPromise = null;
    return info;
  })();

  return pendingPromise;
}

/**
 * Lightweight boolean convenience wrapper.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const info = await getOnboardingCompletionInfo();
  return info.completed;
}

/**
 * Mark onboarding as completed (idempotent).
 * @param date Optional specific completion date (default now).
 */
export async function markOnboardingCompleted(date: Date = new Date()): Promise<CompletionInfo> {
  const record: OnboardingRecord = {
    version: DATA_VERSION,
    completedAt: date.toISOString(),
  };
  try {
    await Async.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Silent fail (cannot persist), still update in-memory
  }
  cachedInfo = toInfo(record);
  notify(cachedInfo);
  return cachedInfo;
}

/**
 * Clear onboarding completion (useful for QA / debugging).
 */
export async function resetOnboarding(): Promise<void> {
  try {
    await Async.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  cachedInfo = {
    completed: false,
    completedAt: null,
    raw: null,
  };
  notify(cachedInfo);
}

/**
 * Synchronous best-effort read (only if cached already).
 * Returns undefined if a read was never performed.
 */
export function getCachedOnboardingInfo(): CompletionInfo | undefined {
  return cachedInfo ?? undefined;
}

/**
 * Utility to ensure completion (used in flows where we want to mark but avoid duplicate writes).
 */
export async function ensureOnboardingCompleted(): Promise<CompletionInfo> {
  const info = await getOnboardingCompletionInfo();
  return info.completed ? info : markOnboardingCompleted();
}

// Example developer helper (remove in production):
// (globalThis as any).debugOnboarding = { markOnboardingCompleted, resetOnboarding, getOnboardingCompletionInfo };
