import { test, expect } from "@playwright/test";
import { lookup } from "node:dns/promises";

/**
 * The headline: the theme cookie (`Domain=.undef.test`) carries across subdomains,
 * so a theme set on one `*.undef.test` origin hydrates the others via the real
 * flagship boot (`/js/theme-boot.js`).
 *
 * Requires `*.undef.test` mapped to 127.0.0.1 (see /tmp/undef-test-hosts.sh) — the
 * whole suite is skipped cleanly when they're absent (CI / fresh checkouts).
 *
 * Reuses the site webServer (`http-server public`): it serves any Host header, and
 * `undef.test`/`admin.undef.test`/`account.undef.test` all resolve to 127.0.0.1.
 */

const PORT = 4173; // http-server public (playwright.config webServer)
const SUBDOMAINS = ["undef.test", "admin.undef.test", "account.undef.test"];

// A persisted state with the active tone = light, as if another domain set it.
const LIGHT_STATE = {
  version: 1,
  activeTone: "light",
  tones: {
    dark: { settings: { paletteBg: "#050607", paletteText: "#f4f4f0", paletteSignal: "#d8ff35", paletteMuted: "#f4f4f0" } },
    light: { settings: { paletteBg: "#f4f0df", paletteText: "#11130d", paletteSignal: "#405500", paletteMuted: "#11130d" } },
  },
};
const COOKIE_VALUE = encodeURIComponent(JSON.stringify(LIGHT_STATE));

let hostsReady = false;
test.beforeAll(async () => {
  try {
    await lookup("admin.undef.test");
    hostsReady = true;
  } catch {
    hostsReady = false;
  }
});
test.beforeEach(() => {
  test.skip(!hostsReady, "needs *.undef.test in /etc/hosts (run /tmp/undef-test-hosts.sh)");
});

test.describe("cross-domain theme (shared .undef.test cookie)", () => {
  test("a theme write on undef.test is scoped to the shared .undef.test cookie", async ({ page, context }) => {
    await page.goto(`http://undef.test:${PORT}/`);
    // Replicate the app's write (getCookieDomain('undef.test') -> '.undef.test').
    await page.evaluate((value) => {
      document.cookie = `undef-logos-theme=${value}; Path=/; Max-Age=31536000; SameSite=Lax; Domain=.undef.test`;
    }, COOKIE_VALUE);

    const themeCookie = (await context.cookies()).find((c) => c.name === "undef-logos-theme");
    expect(themeCookie, "theme cookie exists").toBeTruthy();
    expect(themeCookie?.domain, "cookie is scoped to the shared parent domain").toBe(".undef.test");
  });

  test("the theme carries to every subdomain — real boot hydrates each", async ({ page, context }) => {
    // The shared cookie, as the browser would hold it after a write on any *.undef.test.
    await context.addCookies([
      { name: "undef-logos-theme", value: COOKIE_VALUE, domain: ".undef.test", path: "/" },
    ]);

    for (const host of SUBDOMAINS) {
      await page.goto(`http://${host}:${PORT}/`);
      const snap = await page.evaluate(() => ({
        tone: document.documentElement.getAttribute("data-scan-tone"),
        bg: getComputedStyle(document.documentElement).getPropertyValue("--fx-bg").trim().toLowerCase(),
      }));
      expect(snap.tone, `data-scan-tone on ${host}`).toBe("light");
      expect(snap.bg, `--fx-bg on ${host}`).toBe("#f4f0df");
    }
  });
});
