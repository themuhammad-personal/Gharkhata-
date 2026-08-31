import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY সেট করা নেই। দয়া করে সেটিংসে API কী প্রদান করুন।" },
        { status: 500 }
      );
    }

    const { prompt, systemInstruction: customSystem, transactions, todos, currentMonth, parseMode } = await req.json();

    const ai = new GoogleGenAI({ apiKey });

    if (parseMode) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `তুমি একটি স্মার্ট ফাইন্যান্স টেক্সট পার্সার। ব্যবহারকারীর স্বাভাবিক বাংলা/ইংরেজি বাক্য থেকে খরচ, আয় বা লেনদেনের বিবরণ পার্স করে শুধুমাত্র একটি বৈধ JSON অবজেক্ট আউটপুট দাও (কোনো markdown বা code block ছাড়া)।
JSON অবজেক্টে ফিল্ডগুলো থাকবে:
- title: string (বিবরণ)
- amount: number (টাকার পরিমাণ)
- categoryId: string ('income', 'bazar', 'dues', 'monthly', 'madrasa', 'medical', 'charity', 'todo' ইত্যাদি)
- date: string (YYYY-MM-DD)
- note: string (ঐচ্ছিক মন্তব্য)`,
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      try {
        const text = response.text || "{}";
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        return NextResponse.json(parsed);
      } catch {
        return NextResponse.json({ error: "Failed to parse json" }, { status: 500 });
      }
    }

    let txSummary = "";
    if (transactions && Array.isArray(transactions)) {
      const totalIncome = transactions.filter((t: any) => t.categoryId === 'income').reduce((s: number, t: any) => s + (t.amount || 0), 0);
      const totalExpense = transactions.filter((t: any) => t.categoryId !== 'income' && t.categoryId !== 'todo').reduce((s: number, t: any) => s + (t.amount || 0), 0);
      const totalDues = transactions.filter((t: any) => t.categoryId === 'dues' && t.status !== 'পরিশোধিত').reduce((s: number, t: any) => s + (t.amount || 0), 0);
      
      txSummary = `\n\n[ব্যবহারকারীর বর্তমান খরচের তথ্যভাণ্ডার]:
- নির্বাচিত মাস: ${currentMonth || 'চলতি'}
- মোট আয়: ৳${totalIncome}
- মোট ব্যয়: ৳${totalExpense}
- মোট অপরিশোধিত দোকান বাকি: ৳${totalDues}
- মোট লেনদেন সংখ্যা: ${transactions.length}টি
- কিছু সাম্প্রতিক লেনদেন:
${transactions.slice(0, 15).map((t: any) => `• ${t.date}: ${t.title} - ৳${t.amount} (${t.categoryId}${t.status ? ', ' + t.status : ''})`).join('\n')}
${todos && todos.length > 0 ? `\n- টাস্ক বা বাকি কাজের তালিকা:\n${todos.slice(0, 8).map((td: any) => `• [${td.done ? 'সম্পন্ন' : 'বাকি'}] ${td.title}`).join('\n')}` : ''}
`;
    }

    const defaultSystemInstruction = `তুমি 'ঘরখাতা' (Ghorkhata) অ্যাপের স্মার্ট পার্সোনাল ফাইন্যান্স ও খাতা হিসাবরক্ষক AI অ্যাসিস্ট্যান্ট।
তোমার উত্তর সবসময় স্পষ্ট, অমায়িক, পেশাদার এবং বাংলায় (বাংলা ভাষায়) হবে।
টাকার পরিমাণ উল্লেখের সময় '৳' বা 'টাকা' ব্যবহার করো।
ব্যবহারকারীর খরচের ধরন, সঞ্চয় করার পরামর্শ, বাজেট প্ল্যানিং এবং কেনাকাটা বা বিল সংক্রান্ত বিশ্লেষণ সহজ এবং কার্যকরভাবে প্রদান করবে।`;

    const fullPrompt = prompt + txSummary;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: customSystem || defaultSystemInstruction,
        temperature: 0.4,
      },
    });

    return NextResponse.json({
      text: response.text || "",
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gemini এআই রিকোয়েস্টে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
