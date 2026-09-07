import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";

/**
 * Urspace directive journeys (plan todo 20) — fully serial, real backend only.
 *
 * J1 member booking + coupon + QR e-ticket
 * J2 admin turnstile (approve → verify-qr check-in → check-out)
 * J3 admin management (create coupon → check endpoint → location update → footer)
 *
 * Clock-domain contract: the backend runs UTC (config/app.php) while the test
 * browser runs local time. The verify-qr endpoint compares against the BACKEND
 * "today" and the BACKEND now, so the booking date + slot are derived from the
 * backend clock (health envelope timestamp), never from the browser clock.
 *
 * J2 consumes J1's qr_payload and J2/J3 reuse their session via storageState —
 * safe because the config pins workers: 1 (strict serial file order).
 * No API route mocking anywhere: every step drives the real UI/DB.
 */

type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;

// Shared across specs — workers: 1 makes module state deterministic.
let j1QrPayload = "";
let j1BookingCode = "";
let memberStorage: StorageState;
let adminStorage: StorageState;

function isoDateUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Backend clock (any response envelope `timestamp`, UTC-aware ISO string). */
async function backendNow(request: APIRequestContext): Promise<Date> {
  const res = await request.get("/api/health");
  if (!res.ok()) throw new Error(`GET /api/health failed: ${res.status()}`);
  const body = await res.json();
  const ts = new Date(body.timestamp);
  if (Number.isNaN(ts.getTime())) {
    throw new Error(`Bad backend timestamp: ${body.timestamp}`);
  }
  return ts;
}

/**
 * Booking slot candidates from the BACKEND clock: whole hours whose
 * verify-qr window (jam_mulai ±30min on the backend clock) contains now —
 * ceil(now+10min)-first (future-leaning), floor(now) as the retry fallback.
 * Widget offers :00 hours only, 08:00–20:00.
 */
function backendSlotCandidates(now: Date): { tanggal: string; jam: string }[] {
  const msOfDay = now.getTime() % 86_400_000;
  const ceilHour = new Date(now.getTime() + 10 * 60 * 1000);
  ceilHour.setUTCMinutes(0, 0, 0);
  if (ceilHour.getTime() < now.getTime() + 10 * 60 * 1000) {
    ceilHour.setUTCHours(ceilHour.getUTCHours() + 1);
  }
  const hours = [...new Set([ceilHour.getUTCHours(), now.getUTCHours()])]
    .filter((h) => h >= 8 && h <= 20)
    .filter((h) => Math.abs(h * 3_600_000 - msOfDay) <= 30 * 60_000);
  if (hours.length === 0) {
    throw new Error(
      `No bookable hour within verify-qr's ±30min window (backend now ${now.toISOString()}); run the suite when the backend clock is between 07:30–20:30 UTC.`,
    );
  }
  const tanggal = isoDateUtc(now);
  return hours.map((h) => ({ tanggal, jam: `${String(h).padStart(2, "0")}:00` }));
}

async function loginViaUi(page: Page, username: string, password: string) {
  await page.goto("/login");
  const submit = page.getByRole("button", { name: "Masuk ke Akun" });
  await submit.waitFor({ timeout: 45_000 });
  // On a cold dev compile the SSR form may be clicked before React hydration:
  // that click native-submits and reloads with empty fields, so every later
  // click no-ops. Refill before each attempt to self-heal until the client
  // router finally navigates away.
  await expect
    .poll(
      async () => {
        if (/\/login/.test(new URL(page.url()).pathname)) {
          await page
            .getByLabel(/USERNAME ATAU EMAIL/i)
            .fill(username)
            .catch(() => {});
          await page.locator("#login-password").fill(password).catch(() => {});
          await submit.click().catch(() => {});
        }
        return page.url();
      },
      { timeout: 90_000, intervals: [2_500] },
    )
    .not.toMatch(/\/login/);
}

test.describe.serial("Urspace directive journeys", () => {
  test.beforeAll(async ({ browser }) => {
    // Member session (J1) — created once, reused via storageState.
    const memberCtx = await browser.newContext();
    const memberPage = await memberCtx.newPage();
    await loginViaUi(memberPage, "budi.member", "Member123!");
    memberStorage = await memberCtx.storageState();
    await memberCtx.close();

    // Admin session (J2/J3).
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await loginViaUi(adminPage, "admin_demo", "Admin123!");
    adminStorage = await adminCtx.storageState();
    await adminCtx.close();
  });

  test("J1 — member books Personal Desk – Flexi 01 today with DISKONMEMBER20 and gets a QR e-ticket", async ({
    browser,
    request,
  }) => {
    const ctx = await browser.newContext({ storageState: memberStorage });
    const page = await ctx.newPage();

    // Catalog → the card's CTA link (cards are <div>s; only the per-card CTA
    // is an <a>, and its href embeds the seeded slug deterministically).
    await page.goto("/spaces");
    const card = page
      .locator('a[href*="/spaces/personal-desk-flexi-01"]')
      .first();
    await expect(card).toBeVisible({ timeout: 60_000 });
    await card.click();
    await expect(page).toHaveURL(/\/spaces\/personal-desk-flexi-01/);

    // Booking widget: date + slot from the BACKEND clock (verify-qr contract),
    // 3h duration.
    const now = await backendNow(request);
    const slot = backendSlotCandidates(now)[0];

    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible({ timeout: 45_000 });
    await dateInput.fill(slot.tanggal);
    await expect(dateInput).toHaveValue(slot.tanggal);
    await page.locator("select").first().selectOption(slot.jam);

    // Durasi 3 jam via the stepper (default 4 → one minus click).
    const minus = page.getByRole("button", { name: "Kurangi durasi" });
    const plus = page.getByRole("button", { name: "Tambah durasi" });
    let guard = 0;
    while (guard < 12) {
      const current = await page
        .locator("span", { hasText: /^\d+ Jam$/ })
        .last()
        .innerText();
      const n = parseInt(current, 10);
      if (n === 3) break;
      if (n > 3) await minus.click();
      else await plus.click();
      guard += 1;
    }
    await expect(page.locator("span", { hasText: /^3 Jam$/ }).last()).toHaveText("3 Jam");

    // Coupon DISKONMEMBER20 — validated server-side (POST /diskon/check).
    await page.getByPlaceholder("Masukkan kode promo").fill("DISKONMEMBER20");
    await page.getByRole("button", { name: "Terapkan" }).click();
    await expect(page.getByText(/Kupon DISKONMEMBER20 aktif/)).toBeVisible();

    // Widget CTA opens the confirmation modal, modal submit creates the booking.
    await page
      .getByRole("button", { name: /Konfirmasi & Buat Reservasi Sekarang/ })
      .click();
    await page
      .getByRole("button", { name: "Konfirmasi & Buat Reservasi", exact: true })
      .click();

    // Redirect to the e-ticket page.
    await expect(page).toHaveURL(/\/reservations\/\d+\/ticket/, { timeout: 30_000 });

    // QR payload text + real QR svg present; keep payload/code for J2.
    const payloadText = await page.getByTestId("qr-payload").innerText();
    expect(payloadText).toMatch(/^VERIFY-RESERVASI-\d+-BOOK-\d{8}-\d{4}$/);
    j1QrPayload = payloadText;
    j1BookingCode = payloadText.match(/BOOK-\d{8}-\d{4}/)?.[0] ?? "";
    expect(j1BookingCode).not.toBe("");
    await expect(page.locator("svg").first()).toBeVisible();
    await expect(page.getByText("QR INSTANT PASS")).toBeVisible();

    await ctx.close();
  });

  test("J2 — admin approves the booking, turnstile check-in, then check-out", async ({
    browser,
  }) => {
    test.skip(!j1QrPayload, "J1 must pass first (serial dependency)");

    const ctx = await browser.newContext({ storageState: adminStorage });
    const page = await ctx.newPage();

    await page.goto("/admin/reservations");

    // Find the J1 reservation row by its booking code. The page defaults to
    // the browser-current month filter; if the backend-clock booking falls
    // outside it, switch the period filter to "Semua Periode".
    const row = page.locator("tr", { hasText: j1BookingCode }).first();
    try {
      await expect(row).toBeVisible({ timeout: 8_000 });
    } catch {
      const label = `${MONTHS_ID[new Date().getMonth()]} ${new Date().getFullYear()}`;
      await page.getByRole("button", { name: label }).click();
      await page.getByRole("button", { name: "Semua Periode" }).click();
      await expect(row).toBeVisible({ timeout: 30_000 });
    }
    await expect(row).toContainText("Menunggu Konfirmasi");

    // Approve → optimistic update flips the badge to Disetujui (same row).
    await row.getByRole("button", { name: "Setujui" }).click();
    await expect(row).toContainText("Disetujui");

    // Quick Scanner: paste J1's payload → verify-qr → aktif + live timestamp.
    await page.getByRole("textbox", { name: "Token QR e-ticket" }).fill(j1QrPayload);
    await page.getByRole("button", { name: /Validasi & Check-In Instan/ }).click();
    await expect(
      page.getByText("Check-in berhasil — reservasi kini aktif."),
    ).toBeVisible();
    await expect(row).toContainText("Aktif / Digunakan");
    await expect(row.getByText(/Check-In \d{2}\.\d{2} WIB/)).toBeVisible();

    // Check-out → Selesai with timestamp.
    await row.getByRole("button", { name: "Proses Check-Out" }).click();
    await expect(row).toContainText("Selesai");
    await expect(row.getByText(/Check-Out \d{2}\.\d{2} WIB/)).toBeVisible();

    await ctx.close();
  });

  test("J3 — admin creates TESTE2E10, validates it via /diskon/check, updates location, footer reflects", async ({
    browser,
    request,
  }) => {
    const ctx = await browser.newContext({ storageState: adminStorage });
    const page = await ctx.newPage();

    // (a) Create coupon TESTE2E10 (10%) in the admin coupons page.
    await page.goto("/admin/coupons");
    const createButton = page.getByRole("button", { name: "Buat Kupon Baru" });
    await expect(createButton).toBeVisible({ timeout: 45_000 });
    await createButton.click();
    const createForm = page.locator("form").filter({
      has: page.getByText("Kode Promo (Kapital Otomatis, Unik)"),
    });
    await createForm.getByPlaceholder("CONTOH: MOKLETSALE20").fill("TESTE2E10");
    await createForm
      .getByPlaceholder("Misal: Flash Sale Kolaborasi Q4")
      .fill("E2E Journey 3");
    await createForm.locator('input[type="number"]').first().fill("10");
    // The form defaults dates to the BROWSER today; the backend clock (UTC)
    // may lag it, which would make the fresh coupon inactive server-side.
    const backendDate = await backendNow(request);
    const windowEnd = new Date(backendDate.getTime() + 30 * 86_400_000);
    await createForm.locator('input[type="date"]').nth(0).fill(isoDateUtc(backendDate));
    await createForm.locator('input[type="date"]').nth(1).fill(isoDateUtc(windowEnd));
    await createForm.getByRole("button", { name: "Simpan Kupon Baru" }).click();
    await expect(page.getByText('Kupon "TESTE2E10" berhasil dibuat!')).toBeVisible();
    await expect(page.locator("td", { hasText: "TESTE2E10" }).first()).toBeVisible();

    // (b) Validate via POST /diskon/check sending nama_diskon (J3 contract).
    const check = await request.post("/api/diskon/check", {
      data: { nama_diskon: "TESTE2E10", subtotal: 60000 },
    });
    expect(check.ok()).toBeTruthy();
    const checkBody = await check.json();
    expect(checkBody.data?.nama_diskon).toBe("TESTE2E10");
    expect(checkBody.data?.potongan).toBe(6000); // 10% of 60000

    // (c) Location settings: change alamat suffix → save.
    await page.goto("/admin/settings/location");
    const alamatBox = page.getByPlaceholder(
      "Jl. Danau Ranau No. 01, Sawojajar, Kedungkandang, Kota Malang, Jawa Timur 65139",
    );
    await expect(alamatBox).toBeVisible({ timeout: 45_000 });
    const currentAlamat = (await alamatBox.inputValue()).trim();
    const newAlamat = `${currentAlamat} [E2E]`;
    await alamatBox.fill(newAlamat);
    await page.getByRole("button", { name: /Simpan Perubahan Profil/ }).last().click();
    await expect(page.getByText(/berhasil diperbarui/i)).toBeVisible();

    // (d) Public location endpoint reflects the new address.
    const profile = await request.get("/api/location/profile");
    expect(profile.ok()).toBeTruthy();
    const profileBody = await profile.json();
    expect(profileBody.data?.alamat).toContain("[E2E]");

    // (e) Footer on / shows the new address (fresh context = no cached query).
    const pub = await browser.newContext();
    const pubPage = await pub.newPage();
    await pubPage.goto("/");
    await expect(pubPage.getByText(/\[E2E\]/).first()).toBeVisible({
      timeout: 45_000,
    });
    await pub.close();

    await ctx.close();
  });
});
