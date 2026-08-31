import { NextRequest, NextResponse } from "next/server";

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

function token(req: NextRequest) {
  const value = req.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

async function drive(req: NextRequest, url: string, init: RequestInit = {}) {
  const accessToken = token(req);
  if (!accessToken) throw new Error("Google সাইন-ইন টোকেন পাওয়া যায়নি");
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...(init.headers || {}) },
  });
  if (!response.ok) throw new Error((await response.text()) || "Google Drive অনুরোধ ব্যর্থ হয়েছে");
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();
    const q = encodeURIComponent("name = 'ghorkhata_backup.json' and trashed = false");
    const found = await drive(req, `${DRIVE_FILES_URL}?q=${q}&fields=files(id,name,modifiedTime)&pageSize=1`);
    const files = (await found.json()).files || [];
    if (action === "backup") {
      const body = JSON.stringify(data);
      let fileId = files[0]?.id;
      if (!fileId) {
        const created = await drive(req, DRIVE_FILES_URL, {
          method: "POST", body: JSON.stringify({ name: "ghorkhata_backup.json", mimeType: "application/json" }),
          headers: { "Content-Type": "application/json" },
        });
        fileId = (await created.json()).id;
      }
      await drive(req, `${DRIVE_FILES_URL}/${fileId}?uploadType=media`, {
        method: "PATCH", body, headers: { "Content-Type": "application/json" },
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "restore") {
      if (!files[0]) return NextResponse.json({ error: "কোনো ব্যাকআপ পাওয়া যায়নি" }, { status: 404 });
      const result = await drive(req, `${DRIVE_FILES_URL}/${files[0].id}?alt=media`);
      return NextResponse.json({ data: await result.json() });
    }
    return NextResponse.json({ error: "অজানা Drive action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Google Drive অনুরোধ ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
