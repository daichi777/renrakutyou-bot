"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Child } from "@/lib/types";

export default function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [keywords, setKeywords] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchChildren() {
      const { data } = await getSupabase()
        .from("children")
        .select("*")
        .order("birth_date", { ascending: true });
      if (data) {
        setChildren(data);
        if (data.length > 0) setSelectedChild(data[0].id);
      }
    }
    fetchChildren();
  }, []);

  async function handleGenerate() {
    if (!selectedChild) return;
    setLoading(true);
    setMessages([]);
    setCopiedIndex(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: selectedChild, keywords: keywords.trim() }),
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  const selectedChildData = children.find((c) => c.id === selectedChild);

  return (
    <div className="min-h-dvh bg-amber-50">
      <div className="mx-auto max-w-lg px-4 pb-12 pt-6 sm:px-6 sm:py-10">
        {/* Header */}
        <h1 className="mb-5 text-center text-xl font-bold text-amber-900 sm:text-2xl">
          連絡帳ボット
        </h1>

        {/* Child Selector */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-amber-800">お子さんを選択</p>
          <div className="flex gap-2 sm:gap-3">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => {
                  setSelectedChild(child.id);
                  setMessages([]);
                  setCopiedIndex(null);
                }}
                className={`flex-1 rounded-xl py-3.5 text-base font-bold transition-all active:scale-95 sm:text-lg ${
                  selectedChild === child.id
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-white text-amber-700 border-2 border-amber-200"
                }`}
              >
                {child.name}
                <span className="ml-1 text-xs font-normal sm:text-sm">
                  ({child.name_reading})
                </span>
              </button>
            ))}
          </div>
          {selectedChildData && (
            <p className="mt-2 text-center text-xs text-amber-600 leading-relaxed">
              {selectedChildData.birth_order} ・ {selectedChildData.personality}
            </p>
          )}
        </div>

        {/* Keywords Input */}
        <div className="mb-5">
          <label
            htmlFor="keywords"
            className="mb-2 block text-sm font-medium text-amber-800"
          >
            今日のキーワード
          </label>
          <textarea
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={"例: 公園で遊んだ、ご飯よく食べた\n空欄ならおまかせで生成します"}
            rows={3}
            className="w-full rounded-xl border-2 border-amber-200 bg-white p-3.5 text-base leading-relaxed text-gray-800 placeholder:text-amber-300 focus:border-amber-500 focus:outline-none sm:p-4"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mb-6 w-full rounded-xl bg-amber-600 py-4 text-base font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:bg-amber-300 disabled:cursor-not-allowed sm:text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              生成中...
            </span>
          ) : (
            "連絡帳を生成する"
          )}
        </button>

        {/* Results */}
        {messages.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium text-amber-800">
              生成結果（タップでコピー）
            </p>
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {messages.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => handleCopy(msg, i)}
                  className={`rounded-xl border-2 p-3.5 text-left text-sm leading-relaxed transition-all active:scale-[0.98] sm:p-4 sm:text-base ${
                    copiedIndex === i
                      ? "border-green-400 bg-green-50 text-green-800"
                      : "border-amber-200 bg-white text-gray-800"
                  }`}
                >
                  <span>{msg}</span>
                  <span
                    className={`mt-2 block text-right text-xs ${
                      copiedIndex === i ? "text-green-500 font-medium" : "text-amber-400"
                    }`}
                  >
                    {copiedIndex === i ? "コピーしました!" : `${msg.length}文字`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
