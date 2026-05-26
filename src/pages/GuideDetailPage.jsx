import { BookOpen } from "lucide-react";
import { CATEGORIES } from "../data/categories";
import { ARTICLES } from "../data/articles";
import { SourceBadge } from "../components/SourceBadge";
import { WarningBox } from "../components/WarningBox";
import { SectionTitle } from "../components/SectionTitle";
import { CopyButton } from "../components/CopyButton";

export const GuideDetailPage = ({ guide, onBack, onOpenArticle }) => {
  if (!guide) return null;
  const cat = CATEGORIES.find((c) => c.id === guide.category);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1"
      >
        ← 가이드 목록
      </button>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm">
            {cat?.name}
          </span>
          <SourceBadge articles={guide.sourceReference.articles} onClick={onOpenArticle} />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">{guide.title}</h1>
        <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">{guide.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-stone-200 rounded-md p-5">
            <SectionTitle sub="상담 시 직원이 우선 확인할 내용">핵심 내용</SectionTitle>
            <ul className="space-y-2">
              {guide.conditions.map((c, i) => (
                <li key={i} className="text-sm text-stone-800 leading-relaxed flex gap-2">
                  <span className="text-amber-600 mt-1 text-[10px]">●</span>
                  <span className="flex-1 whitespace-pre-line">{c}</span>
                </li>
              ))}
            </ul>
            {guide.restrictions && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <h4 className="text-sm font-bold text-stone-900 mb-2">제한 사항</h4>
                <ul className="space-y-1.5">
                  {guide.restrictions.map((r, i) => (
                    <li key={i} className="text-sm text-stone-700 flex gap-2">
                      <span className="text-stone-400 mt-1">·</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-white border border-stone-200 rounded-md p-5">
            <SectionTitle sub="고객에게 먼저 확인해야 할 질문">고객 확인 질문</SectionTitle>
            <ol className="space-y-2">
              {guide.requiredQuestions.map((q, i) => (
                <li key={i} className="text-sm text-stone-800 flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-stone-100 text-stone-600 rounded-full text-[11px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-amber-50/40 border border-amber-200 rounded-md p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[15px] font-bold text-stone-900">고객 안내 문구</h3>
                <p className="text-xs text-stone-500 mt-0.5">상담 중 그대로 사용 가능한 표준 안내문</p>
              </div>
              <CopyButton text={guide.customerScript} />
            </div>
            <p className="text-sm text-stone-800 leading-relaxed bg-white/70 p-3 rounded-sm border border-amber-200/60">
              {guide.customerScript}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <WarningBox items={guide.staffWarning} />

          <div className="bg-white border border-stone-200 rounded-md p-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">관련 약관</h4>
            <div className="space-y-1.5">
              {guide.sourceReference.articles.map((a) => (
                <button
                  key={a}
                  onClick={() => onOpenArticle(a)}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-stone-50 rounded-sm group"
                >
                  <BookOpen className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600" />
                  <span className="text-sm text-stone-700 group-hover:text-amber-700">
                    {a} {ARTICLES[a]?.title || ""}
                  </span>
                </button>
              ))}
            </div>
            {guide.sourceReference.keywords && (
              <div className="mt-3 pt-3 border-t border-stone-100">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">키워드</h4>
                <div className="flex flex-wrap gap-1">
                  {guide.sourceReference.keywords.map((k) => (
                    <span key={k} className="text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-sm">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
