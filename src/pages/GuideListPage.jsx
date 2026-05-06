import { useState } from "react";
import { CATEGORIES } from "../data/categories";
import { GUIDES } from "../data/guides";
import { SourceBadge } from "../components/SourceBadge";
import { cn } from "../lib/format";

export const GuideListPage = ({ onSelectGuide }) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const filtered = activeCategory === "all" ? GUIDES : GUIDES.filter((g) => g.category === activeCategory);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">Topic Guide</span>
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1">업무별 가이드</h1>
        <p className="text-sm text-stone-600 mt-1">약관 근거가 명시된 상담 가이드를 영역별로 확인하세요.</p>
      </div>

      <div className="flex flex-wrap gap-1.5 pb-3 border-b border-stone-200">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "px-3 py-1.5 text-sm rounded-sm transition-colors",
            activeCategory === "all"
              ? "bg-stone-900 text-white font-semibold"
              : "bg-white border border-stone-200 text-stone-700 hover:border-stone-400"
          )}
        >
          전체
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-sm transition-colors",
              activeCategory === cat.id
                ? "bg-stone-900 text-white font-semibold"
                : "bg-white border border-stone-200 text-stone-700 hover:border-stone-400"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((guide) => {
          const cat = CATEGORIES.find((c) => c.id === guide.category);
          return (
            <button
              key={guide.id}
              onClick={() => onSelectGuide(guide.id)}
              className="group text-left bg-white border border-stone-200 hover:border-amber-400 hover:shadow-sm rounded-md p-4 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm">
                  {cat?.name}
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1.5 group-hover:text-amber-700 transition-colors">
                {guide.title}
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed mb-3 line-clamp-2">{guide.summary}</p>
              <SourceBadge articles={guide.sourceReference.articles.slice(0, 4)} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
