import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export async function POST(request: NextRequest) {
  try {
    const { childId, keywords } = await request.json();

    if (!childId || !keywords) {
      return NextResponse.json(
        { error: "childIdとkeywordsは必須です" },
        { status: 400 }
      );
    }

    // Supabaseから子供情報を取得
    const { data: child, error } = await supabase
      .from("children")
      .select("*")
      .eq("id", childId)
      .single();

    if (error || !child) {
      return NextResponse.json(
        { error: "子供の情報が見つかりません" },
        { status: 404 }
      );
    }

    const age = calculateAge(child.birth_date);

    const prompt = `あなたは保育園の連絡帳を書くアシスタントです。
以下の子供の情報とキーワードをもとに、保護者が保育園に提出する連絡帳の「家庭での様子」欄に書く文章を5パターン生成してください。

【子供の情報】
名前: ${child.name}（${child.name_reading}）
年齢: ${age}歳（${child.birth_date}生まれ）
${child.birth_order}
性格: ${child.personality || "特になし"}
備考: ${child.notes || "特になし"}

【キーワード】
${keywords}

【条件】
- 各パターン120〜140文字程度
- 保育園の先生に伝える丁寧だが堅すぎないトーン
- 子供の年齢に合った表現
- 具体的でリアルな日常の描写
- 5パターンをJSON配列で返してください（文字列の配列のみ、他のテキストは一切不要）

出力例:
["文章1", "文章2", "文章3", "文章4", "文章5"]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text?.trim() || "[]";

    // JSON配列をパース（Geminiがmarkdownコードブロックで返す場合の対応）
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let messages: string[];
    try {
      messages = JSON.parse(cleanedText);
    } catch {
      // パース失敗時は改行で分割してフォールバック
      messages = text
        .split("\n")
        .map((line) => line.replace(/^[\d]+[.)\s]+/, "").trim())
        .filter((line) => line.length > 0);
    }

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("Generation error:", err);
    return NextResponse.json(
      { error: "生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
