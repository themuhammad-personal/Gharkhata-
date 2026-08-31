import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Google অ্যাক্সেস টোকেন পাওয়া যায়নি" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { transactions, todos } = await req.json();

    let count = 0;

    // Create Calendar events for each pending transaction/due
    if (transactions && Array.isArray(transactions)) {
      for (const t of transactions) {
        const title = `[ঘরখাতা] ${t.title || 'বিল'} পরিশোধ - ৳${t.amount || 0}`;
        const dateStr = t.date || new Date().toISOString().split("T")[0];
        
        const event = {
          summary: title,
          description: `ঘরখাতা অ্যাপ রিমাইন্ডার:\nবিবরণ: ${t.title}\nপরিমাণ: ৳${t.amount}\nক্যাটাগরি: ${t.categoryId}\nনোট: ${t.note || 'নেই'}`,
          start: {
            date: dateStr,
          },
          end: {
            date: dateStr,
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 9 * 60 }, // 9 AM
            ],
          },
        };

        const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });

        if (res.ok) {
          count++;
        }
      }
    }

    // Add pending todos with dates as well
    if (todos && Array.isArray(todos)) {
      for (const td of todos) {
        const title = `[ঘরখাতা টাস্ক] ${td.title}`;
        const dateStr = td.date || new Date().toISOString().split("T")[0];
        const event = {
          summary: title,
          description: `ঘরখাতা টাস্ক রিমাইন্ডার: ${td.title}`,
          start: { date: dateStr },
          end: { date: dateStr },
        };

        const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });

        if (res.ok) count++;
      }
    }

    return NextResponse.json({ success: true, syncedCount: count });
  } catch (error: any) {
    console.error("Calendar API Error:", error);
    return NextResponse.json({ error: error.message || "Calendar সিঙ্ক ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
