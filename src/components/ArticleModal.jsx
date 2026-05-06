import { X } from "lucide-react";
import { ARTICLES } from "../data/articles";
import { cn } from "../lib/format";

export const ArticleModal = ({ articleNo, onClose }) => {
  if (!articleNo) return null;
  const article = ARTICLES[articleNo] || {
    title: "외부 법령 또는 내부 규정",
    section: "약관 외 출처",
  };
  const isExternal =
    articleNo.includes("중협법") ||
    articleNo.includes("조특법") ||
    articleNo.includes("운용요강") ||
    articleNo.includes("자산운용") ||
    articleNo.includes("리스크관리") ||
    articleNo.includes("IPS");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-lg w-full rounded-md shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <div>
            <div className="text-xs text-stone-500">{article.section}</div>
            <h3 className="text-lg font-bold text-stone-900">
              {articleNo} {article.title}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-sm">
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>
        <div className="p-5">
          <div
            className={cn(
              "border rounded-sm p-4 mb-4",
              isExternal
                ? "bg-blue-50/40 border-blue-200"
                : "bg-amber-50/40 border-amber-200"
            )}
          >
            <p className="text-sm text-stone-800 leading-relaxed">
              <strong className={isExternal ? "text-blue-900" : "text-amber-900"}>
                {isExternal ? "외부 법령·규정 출처:" : "약관 원문 인용:"}
              </strong>
              <br />
              본 화면은 직원 안내용 요약입니다.{" "}
              {isExternal
                ? "정확한 조항은 해당 법령·시행령·내부 규정 원문을 직접 참조하시기 바랍니다."
                : `정확한 조항 원문은 첨부된 약관 책자(2026. 1. 1 시행) ${articleNo} ${article.title}를 직접 참조하시기 바랍니다.`}
            </p>
          </div>
          <div className="text-xs text-stone-500 leading-relaxed space-y-1">
            <p>📚 출처: 소기업·소상공인공제 약관 (2026. 1. 1 시행), 중소기업협동조합법, 조세특례제한법, 운용요강, 자산운용 관련 내부 규정</p>
            <p>📞 문의: 중소기업중앙회 노란우산공제 1666-9988</p>
          </div>
        </div>
      </div>
    </div>
  );
};
