import { expect, test } from "@playwright/test";

/**
 * Comprehensive QA Test Suite for UKK Paket B Coworking Space
 * Tests all backend endpoints integrated with the frontend.
 */

test.describe.serial("Comprehensive QA Suite — Backend Endpoints & Frontend UI", () => {
  const testMemberUser = `member_${Date.now()}`;
  const testAdminUser = `admin_${Date.now()}`;
  let memberToken = "";
  let adminToken = "";
  let createdSpaceId = 0;
  let createdMemberId = 0;
  let createdDiskonId = 0;
  let createdReservationId = 0;

  test("QA-01: Health & Root metadata check", async ({ request }) => {
    const health = await request.get("/api/health");
    expect(health.ok()).toBeTruthy();
    const healthBody = await health.json();
    expect(healthBody.status).toBe(true);
    expect(healthBody.data?.status).toBe("ok");
    expect(typeof healthBody.timestamp).toBe("string");

    const root = await request.get("/api/health");
    expect(root.ok()).toBeTruthy();
  });

  test("QA-02: Public Location Profile endpoint & Footer integration", async ({
    request,
    page,
  }) => {
    const res = await request.get("/api/location/profile");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe(true);
    expect(body.data?.nama_coworking).toBeDefined();
    expect(body.data?.telp).toBeDefined();

    // Verify footer displays coworking name
    await page.goto("/");
    await expect(page.getByText(body.data.nama_coworking).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("QA-03: Spaces Catalog, Types, and Detail by ID & Slug", async ({
    request,
    page,
  }) => {
    // 1. Types endpoint
    const typesRes = await request.get("/api/spaces/types");
    expect(typesRes.ok()).toBeTruthy();
    const typesBody = await typesRes.json();
    expect(Array.isArray(typesBody.data)).toBeTruthy();
    expect(typesBody.data.length).toBeGreaterThanOrEqual(3);

    // 2. Spaces list endpoint
    const listRes = await request.get("/api/spaces");
    expect(listRes.ok()).toBeTruthy();
    const listBody = await listRes.json();
    expect(Array.isArray(listBody.data)).toBeTruthy();
    const firstSpace = listBody.data[0];
    expect(firstSpace.slug).toBeDefined();

    // 3. Detail by ID
    const detailById = await request.get(`/api/spaces/${firstSpace.id}`);
    expect(detailById.ok()).toBeTruthy();
    const detailBody = await detailById.json();
    expect(detailBody.data?.id).toBe(firstSpace.id);

    // 4. Detail by Slug
    const detailBySlug = await request.get(`/api/spaces/${firstSpace.slug}`);
    expect(detailBySlug.ok()).toBeTruthy();
    const slugBody = await detailBySlug.json();
    expect(slugBody.data?.slug).toBe(firstSpace.slug);

    // 5. Check UI catalog navigation
    await page.goto("/spaces");
    await expect(page.getByText(firstSpace.nama_space).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("QA-04: Space Availability calculation check", async ({ request }) => {
    const spacesRes = await request.get("/api/spaces");
    const spaces = (await spacesRes.json()).data;
    const targetSpace = spaces[0];

    const today = new Date().toISOString().split("T")[0];
    const res = await request.get("/api/spaces/availability", {
      params: {
        id_space: targetSpace.id,
        tanggal: today,
        jam_mulai: "10:00",
        durasi_jam: 2,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe(true);
    expect(body.data?.available).toBe(true);
    expect(body.data?.jam_selesai).toBe("12:00");
  });

  test("QA-05: Member Registration & Login flow", async ({ request, page }) => {
    // 1. Direct API Registration
    const regRes = await request.post("/api/auth/register/member", {
      data: {
        username: testMemberUser,
        password: "Password123!",
        nama_member: "QA Tester Member",
        instansi: "QA Labs Corp",
        alamat: "Jl. Pengujian No. 99, Malang",
        telp: "081987654321",
      },
    });
    expect(regRes.ok()).toBeTruthy();
    const regBody = await regRes.json();
    expect(regBody.data?.access_token).toBeDefined();
    memberToken = regBody.data.access_token;

    // 2. Member Profile verification
    const profileRes = await request.get("/api/auth/profile", {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(profileRes.ok()).toBeTruthy();
    const profileBody = await profileRes.json();
    expect(profileBody.data?.username).toBe(testMemberUser);
    expect(profileBody.data?.role).toBe("member");

    // 3. UI Login via proxy-login
    await page.goto("/login");
    await page.getByLabel(/USERNAME ATAU EMAIL/i).fill(testMemberUser);
    await page.locator("#login-password").fill("Password123!");
    await page.getByRole("button", { name: "Masuk ke Akun" }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
  });

  test("QA-06: Admin Registration & Profile Management", async ({ request }) => {
    // 1. Admin Registration
    const regRes = await request.post("/api/auth/register/admin-space", {
      data: {
        username: testAdminUser,
        password: "AdminPassword123!",
        nama_coworking: "QA Test Space Hub",
        nama_pemilik: "QA Admin Boss",
        telp: "081234509876",
        alamat: "Jl. Administrator No. 1",
        deskripsi: "Space khusus QA automated testing.",
      },
    });
    expect(regRes.ok()).toBeTruthy();
    const regBody = await regRes.json();
    expect(regBody.data?.access_token).toBeDefined();
    adminToken = regBody.data.access_token;

    // 2. Admin Profile GET
    const profileRes = await request.get("/api/admin/profile", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(profileRes.ok()).toBeTruthy();
    const profileBody = await profileRes.json();
    expect(profileBody.data?.nama_coworking).toBe("QA Test Space Hub");

    // 3. Admin Profile PUT
    const updateRes = await request.put("/api/admin/profile", {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        nama_coworking: "QA Test Space Hub (Updated)",
        nama_pemilik: "QA Admin Boss, S.Kom",
        telp: "081234509877",
        alamat: "Jl. Administrator No. 2",
        deskripsi: "Deskripsi terupdate.",
      },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updateBody = await updateRes.json();
    expect(updateBody.data?.nama_coworking).toBe("QA Test Space Hub (Updated)");
  });

  test("QA-07: Admin Spaces CRUD endpoints", async ({ request }) => {
    // 1. Create Space
    const createRes = await request.post("/api/admin/spaces", {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        nama_space: "QA Automated Pod 01",
        harga_per_jam: 35000,
        tipe: "desk",
        kapasitas: 2,
        deskripsi: "Pod khusus pengujian otomatis.",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createBody = await createRes.json();
    expect(createBody.data?.id).toBeDefined();
    createdSpaceId = createBody.data.id;

    // 2. Get Space By ID
    const getRes = await request.get(`/api/admin/spaces/${createdSpaceId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(getRes.ok()).toBeTruthy();
    const getBody = await getRes.json();
    expect(getBody.data?.nama_space).toBe("QA Automated Pod 01");

    // 3. Update Space
    const updateRes = await request.put(`/api/admin/spaces/${createdSpaceId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        nama_space: "QA Automated Pod 01 (Renamed)",
        harga_per_jam: 40000,
      },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updateBody = await updateRes.json();
    expect(updateBody.data?.nama_space).toBe("QA Automated Pod 01 (Renamed)");

    // 4. Delete Space
    const delRes = await request.delete(`/api/admin/spaces/${createdSpaceId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delRes.ok()).toBeTruthy();
  });

  test("QA-08: Admin Member Management (CRUD)", async ({ request }) => {
    const tempMemberUsername = `temp_${Date.now()}`;
    // 1. Create Member by Admin
    const createRes = await request.post("/api/admin/members", {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        username: tempMemberUsername,
        password: "TempPassword123!",
        nama_member: "Temp Member QA",
        instansi: "SMK Telkom",
        alamat: "Malang",
        telp: "08123123123",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createBody = await createRes.json();
    expect(createBody.data?.id).toBeDefined();
    createdMemberId = createBody.data.id;

    // 2. Get Member by ID
    const getRes = await request.get(`/api/admin/members/${createdMemberId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(getRes.ok()).toBeTruthy();
    const getBody = await getRes.json();
    expect(getBody.data?.nama_member).toBe("Temp Member QA");

    // 3. Update Member
    const updateRes = await request.put(`/api/admin/members/${createdMemberId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        nama_member: "Temp Member QA (Updated)",
      },
    });
    expect(updateRes.ok()).toBeTruthy();

    // 4. Delete Member
    const delRes = await request.delete(`/api/admin/members/${createdMemberId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delRes.ok()).toBeTruthy();
  });

  test("QA-09: Diskon / Promo Management & Validation", async ({ request }) => {
    const promoCode = `PROMOQA${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 86400000);

    // 1. Create Promo by Admin
    const createRes = await request.post("/api/admin/diskon", {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        nama_diskon: promoCode,
        persentase_diskon: 25,
        tanggal_awal: now.toISOString(),
        tanggal_akhir: nextMonth.toISOString(),
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createBody = await createRes.json();
    expect(createBody.data?.id).toBeDefined();
    createdDiskonId = createBody.data.id;

    // 2. Check Promo validity (Public/Member endpoint)
    const checkRes = await request.post("/api/diskon/check", {
      data: {
        nama_diskon: promoCode,
        subtotal: 100000,
      },
    });
    expect(checkRes.ok()).toBeTruthy();
    const checkBody = await checkRes.json();
    expect(checkBody.data?.persentase_diskon).toBe(25);
    expect(checkBody.data?.potongan).toBe(25000);

    // 3. Active Promos list
    const activeRes = await request.get("/api/diskon/active");
    expect(activeRes.ok()).toBeTruthy();
    const activeBody = await activeRes.json();
    expect(
      activeBody.data?.some((d: { nama_diskon: string }) => d.nama_diskon === promoCode),
    ).toBeTruthy();

    // 4. Delete Promo
    const delRes = await request.delete(`/api/admin/diskon/${createdDiskonId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delRes.ok()).toBeTruthy();
  });

  test("QA-10: Member Reservation Lifecycle & Cancellation", async ({
    request,
  }) => {
    // 1. Get spaces to find an available space ID
    const spacesRes = await request.get("/api/spaces");
    const spaces = (await spacesRes.json()).data;
    const targetSpace = spaces[0];

    const today = new Date().toISOString().split("T")[0];

    // 2. Create Reservation
    const createRes = await request.post("/api/reservasi", {
      headers: { Authorization: `Bearer ${memberToken}` },
      data: {
        id_space: targetSpace.id,
        tanggal_reservasi: today,
        jam_mulai: "18:00",
        durasi_jam: 1,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createBody = await createRes.json();
    expect(createBody.data?.id).toBeDefined();
    createdReservationId = createBody.data.id;
    expect(createBody.data?.status).toBe("belum_dikonfirm");

    // 3. Member My Reservations
    const myRes = await request.get("/api/reservasi/my", {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(myRes.ok()).toBeTruthy();
    const myBody = await myRes.json();
    expect(
      myBody.data?.some((r: { id: number }) => r.id === createdReservationId),
    ).toBeTruthy();

    // 4. Member Reservation History
    const historyRes = await request.get("/api/reservasi/my/history", {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(historyRes.ok()).toBeTruthy();

    // 5. Member Cancels Reservation
    const cancelRes = await request.patch(
      `/api/reservasi/${createdReservationId}/cancel`,
      {
        headers: { Authorization: `Bearer ${memberToken}` },
      },
    );
    expect(cancelRes.ok()).toBeTruthy();
    const cancelBody = await cancelRes.json();
    expect(cancelBody.data?.status).toBe("dibatalkan");
  });

  test("QA-11: Admin Financial Reports & Analytics", async ({ request }) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // 1. Monthly Report
    const monthlyRes = await request.get("/api/admin/reports/monthly", {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { month, year },
    });
    expect(monthlyRes.ok()).toBeTruthy();
    const monthlyBody = await monthlyRes.json();
    expect(monthlyBody.data?.total_transaksi).toBeDefined();
    expect(monthlyBody.data?.estimasi_pendapatan_kotor).toBeDefined();
    expect(monthlyBody.data?.rincian_per_tipe).toBeDefined();

    // 2. Income Report
    const incomeRes = await request.get("/api/admin/reports/income", {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { month, year },
    });
    expect(incomeRes.ok()).toBeTruthy();
    const incomeBody = await incomeRes.json();
    expect(incomeBody.data?.realisasi_pendapatan_bersih).toBeDefined();
  });
});
