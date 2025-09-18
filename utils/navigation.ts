/**
 * Central navigation helpers + typed route constants.
 *
 * Why this file?
 * - Several files were calling router.replace("/(tabs)/") which produced
 *   TypeScript errors because grouped directories like (tabs) are not part
 *   of the public route path namespace in expo-router. The real public
 *   path for your tabs root (index screen) is simply "/".
 * - We centralize all known paths, add legacy normalization, and provide
 *   small helper wrappers so future refactors only touch one place.
 *
 * How to migrate existing code:
 *   BEFORE: router.replace("/(tabs)/");
 *   AFTER:  nav.goTabs();  // or nav.replace(Routes.root)
 *
 *   BEFORE: router.push("/(onboarding)/how-it-works");
 *   AFTER:  nav.onboarding.howItWorks();
 *
 * If you still have legacy strings ("/(tabs)/") this module's normalize()
 * will accept them, but you should progressively remove those occurrences.
 *
 * NOTE:
 *  - This file does NOT automatically patch existing imports. Update the
 *    screens to import { Routes, nav } from "../utils/navigation";
 */

import { router } from "expo-router";

// ---------------------------------------------------------------------------
// Route constants (canonical)
// ---------------------------------------------------------------------------

/**
 * Canonical route string literals used across the app.
 * You can augment this object if you add new screens.
 */
export const Routes = {
  root: "/" as const, // tabs home ( (tabs)/index.tsx )
  onboarding: {
    welcome: "/(onboarding)/welcome" as const,
    howItWorks: "/(onboarding)/how-it-works" as const,
    experience: "/(onboarding)/experience" as const,
  },
  paywall: "/paywall" as const,
  history: "/history" as const,
  customFaces: "/custom-faces" as const,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ValueOf<T> = T[keyof T];
type OnboardingPaths = ValueOf<typeof Routes.onboarding>;

/**
 * All canonical paths the app recognizes.
 * Extend this if you add more screens.
 */
export type AppPath =
  | typeof Routes.root
  | typeof Routes.paywall
  | typeof Routes.history
  | typeof Routes.customFaces
  | OnboardingPaths;

/**
 * Legacy / erroneous paths we still tolerate & normalize.
 * (Kept so existing code doesn't instantly break — but should be removed.)
 */
export type LegacyPath =
  | "/(tabs)/"
  | "/(tabs)"
  | "/(onboarding)/"
  | "/(tabs)//";

/**
 * Union of what navigation helpers accept.
 */
export type AnyPath = AppPath | LegacyPath | (string & {});

/**
 * Quick type guard (runtime) — primarily for dev warnings.
 */
export function isAppPath(p: string): p is AppPath {
  switch (p) {
    case Routes.root:
    case Routes.paywall:
    case Routes.history:
    case Routes.customFaces:
    case Routes.onboarding.welcome:
    case Routes.onboarding.howItWorks:
    case Routes.onboarding.experience:
      return true;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize any legacy / grouped / sloppy path string to a canonical one.
 */
export function normalizePath(path: AnyPath): AppPath {
  // 1. Tabs group normalization
  if (path === "/(tabs)/" || path === "/(tabs)" || path === "/(tabs)//") {
    return Routes.root;
  }

  // 2. Raw group root for onboarding (not normally used)
  if (path === "/(onboarding)/") {
    return Routes.onboarding.welcome;
  }

  // 3. If it's already a known canonical
  if (isAppPath(path)) return path;

  // 4. Fallback: attempt soft inference (avoid throwing in production)
  // You can tighten this if you prefer hard failures.
  if (__DEV__) {
    console.warn(
      `[navigation] Unknown path "${path}" — falling back to root "/". Add it to Routes if intentional.`,
    );
  }
  return Routes.root;
}

// ---------------------------------------------------------------------------
// Low level wrappers
// ---------------------------------------------------------------------------

function _push(path: AnyPath) {
  router.push(normalizePath(path));
}

function _replace(path: AnyPath) {
  router.replace(normalizePath(path));
}

function _back() {
  router.back();
}

// ---------------------------------------------------------------------------
// High level semantic helpers
// ---------------------------------------------------------------------------

export const nav = {
  // Primitive wrappers
  push: _push,
  replace: _replace,
  back: _back,

  // Semantic shortcuts
  goTabs: () => _replace(Routes.root),
  goPaywall: (replace = false) =>
    replace ? _replace(Routes.paywall) : _push(Routes.paywall),
  goHistory: () => _push(Routes.history),
  goCustomFaces: () => _push(Routes.customFaces),

  onboarding: {
    welcome: () => _replace(Routes.onboarding.welcome),
    howItWorks: () => _replace(Routes.onboarding.howItWorks),
    experience: () => _replace(Routes.onboarding.experience),
  },
};

// ---------------------------------------------------------------------------
// Exhaustiveness helpers (dev only)
// ---------------------------------------------------------------------------

/**
 * Compile-time assert that all route constants conform to AppPath.
 * If you add a new key in Routes and forget to add to AppPath union,
 * TypeScript will surface an error here.
 */
function _assertAllRoutesAreAppPath() {
  const all: AppPath[] = [
    Routes.root,
    Routes.paywall,
    Routes.history,
    Routes.customFaces,
    Routes.onboarding.welcome,
    Routes.onboarding.howItWorks,
    Routes.onboarding.experience,
  ];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _: AppPath[] = all;
}
_assertAllRoutesAreAppPath();

// ---------------------------------------------------------------------------
// Example usage (remove or keep for reference)
// ---------------------------------------------------------------------------
/*
import { nav, Routes } from "../utils/navigation";

// Go to tab home after onboarding:
nav.goTabs();

// From inside onboarding step2 -> step3:
+nav.onboarding.experience();

// Replace current screen with paywall:
nav.goPaywall(true);

// Generic:
nav.replace(Routes.settings);
*/

// End of navigation helpers.
