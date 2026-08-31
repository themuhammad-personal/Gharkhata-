import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Google অ্যাক্সেস টোকেন পাওয়া যায়নি" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { action, data } = await req.json();

    if (action === "backup") {
      // 1. Search for existing ghorkhata_backup.json
      const searchRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=name%3D'ghorkhata_backup.json'+and+trashed%3Dfalse&fields=files(id,name)",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const searchData = await searchRes.json();
      const existingFile = searchData.files && searchData.files[0];

      const fileContent = JSON.stringify(data, null, 2);
      let driveRes;

      if (existingFile) {
        // Update existing file
        driveRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: fileContent,
          }
        );
      } else {
        // Create new file with multipart upload
        const metadata = {
          name: "ghorkhata_backup.json",
          mimeType: "application/json",
          description: "Ghorkhata Cloud Backup File",
        };
        const boundary = "-------ghorkhata_drive_boundary";
        const delimiter = "\r\n--" + boundary + "\r\n";
        const closeDelimiter = "\r\n--" + boundary + "--";

        const multipartBody =
          delimiter +
          "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
          JSON.stringify(metadata) +
          delimiter +
          "Content-Type: application/json\r\n\r\n" +
          fileContent +
          closeDelimiter;

        driveRes = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": `multipart/related; boundary=${boundary}`,
            },
            body: multipartBody,
          }
        );
      }

      if (!driveRes.ok) {
        const errJson = await driveRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Google Drive ফাইলে ব্যাকআপ সংরক্ষণ ব্যর্থ হয়েছে");
      }

      return NextResponse.json({ success: true });
    } else if (action === "restore") {
      // Find backup file
      const searchRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=name%3D'ghorkhata_backup.json'+and+trashed%3Dfalse&fields=files(id,name)&orderBy=modifiedTime+desc",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const searchData = await searchRes.json();
      const existingFile = searchData.files && searchData.files[0];

      if (!existingFile) {
        return NextResponse.json({ error: "Google Drive-এ কোনো ghorkhata_backup.json ফাইল পাওয়া যায়নি" }, { status: 404 });
      }

      const fileRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!fileRes.ok) {
        throw new Error("Google Drive থেকে ব্যাকআপ ফাইল ডাউনলোড করা যায়নি");
      }

      const backupData = await fileRes.json();
      return NextResponse.json({ success: true, data: backupData });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Drive API Error:", error);
    return NextResponse.json({ error: error.message || "Drive প্রসেসিং ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
