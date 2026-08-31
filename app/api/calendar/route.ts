import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return NextResponse.json({ error: "Google সাইন-ইন টোকেন পাওয়া যায়নি" }, { status: 401 });
  try {
    const { transactions = [], todos = [] } = await req.json();
    const items = [
      ...transactions.map((t: any) => ({ summary: `ঘরখাতা: ${t.title || "বিল"}`, description: `পরিমাণ: ৳${t.amount || 0}`, date: t.date })),
      ...todos.map((t: any) => ({ summary: `ঘরখাতা: ${t.title || "কাজ"}`, date: t.dueDate || new Date().toISOString().slice(0, 10) })),
    ];
    let syncedCount = 0;
    for (const item of items) {
      const date = item.date || new Date().toISOString().slice(0, 10);
      const start = `${date}T00:00:00+06:00`;
      const end = `${date}T23:59:00+06:00`;
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ summary: item.summary, description: item.description || "ঘরখাতা রিমাইন্ডার", start: { dateTime: start, timeZone: "Asia/Dhaka" }, end: { dateTime: end, timeZone: "Asia/Dhaka" } }),
      });
      if (response.ok) syncedCount++;
    }
    return NextResponse.json({ syncedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Calendar সিঙ্ক ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
