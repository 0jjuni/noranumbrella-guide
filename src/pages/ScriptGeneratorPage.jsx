import { useState } from "react";
import { CATEGORIES } from "../data/categories";
import { GUIDES } from "../data/guides";
import { SectionTitle } from "../components/SectionTitle";
import { CopyButton } from "../components/CopyButton";
import { cn } from "../lib/format";

export const ScriptGeneratorPage = () => {
  const [topic, setTopic] = useState("enrollment");
  const [tone, setTone] = useState("standard");
  const [vars, setVars] = useState({
    customerName: "",
    monthlyAmount: "",
    months: "",
    reason: "",
  });

  const generateScript = () => {
    const guide = GUIDES.find((g) => g.category === topic);
    if (!guide) return "";

    const greeting = vars.customerName ? `${vars.customerName} 고객님, ` : "고객님, ";
    let body = guide.customerScript;

    if (tone === "brief") {
      body = body.split(".").slice(0, 1).join(".") + ".";
    } else if (tone === "detailed") {
      const extra = guide.conditions.slice(0, 3).map((c) => `· ${c}`).join("\n");
      body = body + "\n\n[상세 조건]\n" + extra;
    }

    let vinfo = "";
    if (vars.monthlyAmount) vinfo += `\n- 부금월액: ${vars.monthlyAmount}원`;
    if (vars.months) vinfo += `\n- 부금납부월수: ${vars.months}회`;
    if (vars.reason) vinfo += `\n- 상담 사유: ${vars.reason}`;

    const sources = `\n\n[약관 근거]\n${guide.sourceReference.articles.join(", ")}`;

    return `${greeting}${body}${vinfo}${sources}\n\n※ 정확한 공제금·환급금·세액은 중앙회 시스템 조회로 안내드립니다.`;
  };

  const script = generateScript();

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">Script Generator</span>
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1">고객 안내 스크립트 생성</h1>
        <p className="text-sm text-stone-600 mt-1">상담 변수를 입력하면 약관 근거가 첨부된 표준 안내문을 생성합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-md p-5 space-y-4">
            <SectionTitle>입력</SectionTitle>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">상담 영역</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-sm focus:outline-none focus:border-amber-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">톤</label>
              <div className="flex gap-1.5">
                {[
                  { id: "brief", label: "간략" },
                  { id: "standard", label: "표준" },
                  { id: "detailed", label: "상세" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={cn(
                      "flex-1 px-3 py-1.5 text-xs rounded-sm border transition-colors",
                      tone === t.id
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">고객명 (선택)</label>
              <input
                value={vars.customerName}
                onChange={(e) => setVars({ ...vars, customerName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-sm focus:outline-none focus:border-amber-500"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">부금월액 (선택)</label>
              <input
                value={vars.monthlyAmount}
                onChange={(e) => setVars({ ...vars, monthlyAmount: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-sm focus:outline-none focus:border-amber-500"
                placeholder="300,000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">부금납부월수 (선택)</label>
              <input
                value={vars.months}
                onChange={(e) => setVars({ ...vars, months: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-sm focus:outline-none focus:border-amber-500"
                placeholder="36"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">상담 사유 (선택)</label>
              <input
                value={vars.reason}
                onChange={(e) => setVars({ ...vars, reason: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-sm focus:outline-none focus:border-amber-500"
                placeholder="폐업 / 임의해약 / 노령급부 등"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-stone-900 text-stone-100 rounded-md p-5 sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider">생성된 스크립트</h3>
              <CopyButton text={script} />
            </div>
            <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans bg-stone-800/50 p-4 rounded-sm border border-stone-700">
              {script}
            </pre>
          </div>
          <div className="bg-amber-50/40 border border-amber-200 rounded-md p-3">
            <p className="text-xs text-stone-700 leading-relaxed">
              💡 본 스크립트는 약관 기반 표준 안내문입니다. 고객의 구체적 상황(부금월수, 사유)에 따라 안내 내용이 달라질 수 있으니 상담 시 보조 자료로 사용하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
