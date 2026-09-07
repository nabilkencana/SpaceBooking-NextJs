import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Reset the dev database to deterministic seeder state before the journeys.
 *
 * Uses the DEV database `coworking_space` (paketb-backend/.env, pgsql) —
 * the Pest feature suite runs against `coworking_space_test` (phpunit.xml),
 * so this reset never conflicts with backend tests.
 */
export default function globalSetup(): void {
  const backendDir = path.resolve(__dirname, "..", "..", "..", "paketb-backend");
  execSync("php artisan migrate:fresh --seed", {
    cwd: backendDir,
    stdio: "inherit",
  });
}
