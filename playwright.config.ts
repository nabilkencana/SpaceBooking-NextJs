import { defineConfig } from "@playwright/test";

/**
 * E2E journeys run against REAL servers and the REAL dev database.
 *
 * Database reset contract (plan todo 20):
 * - globalSetup runs `php artisan migrate:fresh --seed` in ../paketb-backend.
 *   This resets the DEV database `coworking_space` (DB_CONNECTION=pgsql in
 *   paketb-backend/.env) — the Pest feature suite uses `coworking_space_test`
 *   (phpunit.xml), so there is no conflict.
 * - webServer array: Laravel API :8000 + Next dev :3001 (port deviation from
 *   the plan's :3000: that port is occupied on this machine by an unrelated,
 *   live third-party process — hermes-agent WhatsApp bridge — which must not
 *   be killed; frontendBaseURL is the single point to switch back).
 *
 * The suite is fully serial (workers: 1) because J2 consumes the qr_payload
 * captured in J1 via a module-level variable — no route mocking anywhere.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  // Retries stay off: the journeys mutate shared DB state, so a blind serial
  // re-run double-books/over-advances — a fresh full run (reseeded by
  // globalSetup) is the correct retry unit.
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  globalSetup: "./tests/e2e/global-setup.ts",
  webServer: [
    {
      command: "php artisan serve --port=8000",
      cwd: "../paketb-backend",
      url: "http://127.0.0.1:8000/api/health",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --port 3001",
      url: "http://localhost:3001",
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
