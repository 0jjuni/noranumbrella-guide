import { useState } from "react";
import { REASON_DOCUMENTS } from "../data/guides";
import { SourceBadge } from "../components/SourceBadge";
import { WarningBox } from "../components/WarningBox";
import { cn } from "../lib/format";

export const ChecklistPage = ({ onOpenArticle, initialReason }) => {
  const [activeReason, setActiveReason] = useState(
    initialReason && REASON_DOCUMENTS[initialReason] ? initialReason : "closure"
  );
  const [checked, setChecked] = useState({});

  const reason = REASON_DOCUMENTS[activeReason];

  const toggleCheck = (idx) => {
    setChecked((prev) => ({ ...prev, [`${activeReason}-${idx}`]: !prev[`${activeReason}-${idx}`] }));
  };

  const handleReasonChange = (key) => {
    setActiveReason(key);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">Document Checklist</span>
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1">구비서류 체크리스트</h1>
        <p className="text-sm text-stone-600 mt-1">사유별 필요 서류를 확인하고 상담 중 체크하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">사유 선택</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
            {Object.entries(REASON_DOCUMENTS).map(([key, r]) => (
              <button
                key={key}
                onClick={() => handleReasonChange(key)}
                className={cn(
                  "w-full text-left px-3 py-2.5 text-sm rounded-sm transition-colors",
                  activeReason === key
                    ? "bg-stone-900 text-white font-semibold"
                    : "bg-white border border-stone-200 text-stone-700 hover:border-stone-400"
                )}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-stone-200 rounded-md p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-stone-900">{reason.name}</h2>
              <SourceBadge articles={reason.sourceReference.articles} onClick={onOpenArticle} />
            </div>
            <p className="text-xs text-stone-500 mb-4">상담 중 체크박스로 진행 상황을 표시하세요.</p>

            <div className="space-y-2">
              {reason.docs.map((doc, idx) => {
                const key = `${activeReason}-${idx}`;
                const isChecked = checked[key];
                return (
                  <label
                    key={idx}
                    className={cn(
                      "flex items-start gap-3 p-3 border rounded-sm cursor-pointer transition-colors",
                      isChecked
                        ? "bg-amber-50/40 border-amber-300"
                        : "bg-white border-stone-200 hover:border-stone-400"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={!!isChecked}
                      onChange={() => toggleCheck(idx)}
                      className="mt-0.5 w-4 h-4 accent-amber-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn("text-sm font-semibold", isChecked && "line-through text-stone-500")}>
                          {doc.name}
                        </span>
                        {doc.required && (
                          <span className="text-[10px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">
                            필수
                          </span>
                        )}
                        {!doc.required && (
                          <span className="text-[10px] font-bold uppercase text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-sm">
                            권장
                          </span>
                        )}
                      </div>
                      {doc.note && (
                        <p className="text-xs text-stone-500 leading-relaxed">{doc.note}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <WarningBox items={reason.staffWarning} />
        </div>
      </div>
    </div>
  );
};
