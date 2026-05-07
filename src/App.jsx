import { useState, useEffect } from "react";
import {
  Search,
  Home,
  ClipboardList,
  FileText,
  HelpCircle,
  CheckSquare,
  MessageSquare,
  ExternalLink,
  Calculator,
  Menu,
  X,
} from "lucide-react";
import { GUIDES } from "./data/guides";
import { ArticleModal } from "./components/ArticleModal";
import { GlobalWarning } from "./components/GlobalWarning";
import { DateBadge } from "./components/DateBadge";
import { Dashboard } from "./pages/Dashboard";
import { GuideListPage } from "./pages/GuideListPage";
import { GuideDetailPage } from "./pages/GuideDetailPage";
import { FaqPage } from "./pages/FaqPage";
import { ChecklistPage } from "./pages/ChecklistPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { ScriptGeneratorPage } from "./pages/ScriptGeneratorPage";
import { CalculatorPage } from "./pages/calculator/CalculatorPage";
import { cn } from "./lib/format";

const NAV_ITEMS = [
  { id: "dashboard", label: "대시보드", icon: Home },
  { id: "simulator", label: "상담 시뮬레이터", icon: MessageSquare },
  { id: "calculator", label: "계산기", icon: Calculator, highlight: true },
  { id: "guide", label: "업무별 가이드", icon: ClipboardList },
  { id: "checklist", label: "구비서류 체크리스트", icon: CheckSquare },
  { id: "faq", label: "FAQ 검색", icon: HelpCircle },
  { id: "script", label: "스크립트 생성기", icon: FileText },
];

const Brand = () => (
  <div className="flex items-center gap-2.5">
    <div className="relative w-9 h-9 flex-shrink-0">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-amber-500 rounded-md transform rotate-3" />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-md flex items-center justify-center shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-stone-900"
        >
          <path d="M12 2v2M12 20v2M2 12c0-5.523 4.477-10 10-10s10 4.477 10 10H2z" />
          <path d="M12 12v8a2 2 0 0 1-2-2" />
        </svg>
      </div>
    </div>
    <div className="min-w-0">
      <div className="text-[13px] font-black text-stone-900 leading-tight">
        노란우산 상담 가이드
      </div>
      <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
        iM뱅크 영업점 전용
      </div>
    </div>
  </div>
);

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedGuideId, setSelectedGuideId] = useState(null);
  const [openArticle, setOpenArticle] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checklistReason, setChecklistReason] = useState(null);

  const selectedGuide = GUIDES.find((g) => g.id === selectedGuideId);

  const handleNavigate = (p) => {
    setPage(p);
    setSelectedGuideId(null);
    setDrawerOpen(false);
    if (p !== "checklist") setChecklistReason(null);
  };

  const handleGoToChecklist = (reasonKey) => {
    setChecklistReason(reasonKey);
    setPage("checklist");
    setSelectedGuideId(null);
    setDrawerOpen(false);
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const renderPage = () => {
    if (page === "guide" && selectedGuide) {
      return (
        <GuideDetailPage
          guide={selectedGuide}
          onBack={() => setSelectedGuideId(null)}
          onOpenArticle={setOpenArticle}
          onGoToScript={() => setPage("script")}
        />
      );
    }
    switch (page) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} onOpenArticle={setOpenArticle} />;
      case "simulator":
        return (
          <SimulatorPage
            onOpenArticle={setOpenArticle}
            onGoToChecklist={handleGoToChecklist}
          />
        );
      case "calculator":
        return <CalculatorPage onOpenArticle={setOpenArticle} />;
      case "guide":
        return <GuideListPage onSelectGuide={setSelectedGuideId} />;
      case "checklist":
        return (
          <ChecklistPage
            onOpenArticle={setOpenArticle}
            initialReason={checklistReason}
          />
        );
      case "faq":
        return <FaqPage onOpenArticle={setOpenArticle} />;
      case "script":
        return <ScriptGeneratorPage />;
      default:
        return <Dashboard onNavigate={handleNavigate} onOpenArticle={setOpenArticle} />;
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-stone-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Brand />
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden p-1.5 hover:bg-stone-100 rounded-sm flex-shrink-0"
            aria-label="메뉴 닫기"
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        <button
          onClick={() => handleNavigate("faq")}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-sm transition-colors group"
        >
          <Search className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600" />
          <span className="text-[11px] text-stone-500 group-hover:text-stone-700 flex-1 text-left">
            약관·FAQ 검색
          </span>
          <kbd className="text-[9px] font-mono text-stone-400 bg-white px-1 py-0.5 rounded border border-stone-200">
            /
          </kbd>
        </button>

        <DateBadge />
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm transition-colors relative",
                isActive
                  ? "bg-stone-900 text-white font-semibold"
                  : item.highlight
                  ? "text-stone-800 hover:bg-amber-50 border border-amber-200 bg-amber-50/30"
                  : "text-stone-700 hover:bg-stone-100"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.highlight && !isActive && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded-sm">
                  세일즈
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-stone-200 space-y-2">
        <div className="bg-stone-50 border border-stone-200 rounded-sm p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
              중앙회 콜센터
            </div>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="운영 중" />
          </div>
          <div className="text-sm font-bold text-stone-900">1666-9988</div>
          <a
            href="https://www.8899.or.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-stone-500 hover:text-amber-700 mt-0.5 flex items-center gap-0.5"
          >
            www.8899.or.kr
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <div className="text-[9px] text-stone-400 text-center leading-relaxed px-1">
          v1.5 · 약관 2026.1.1 + 조특법 2026.2.27<br />
          + 중협법 2026.6.3 반영
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 print:min-h-0 print:bg-white" style={{ fontFamily: "'Noto Sans KR', 'Pretendard', system-ui, sans-serif" }}>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-stone-200 flex items-center gap-3 px-3 py-2 print:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 hover:bg-stone-100 rounded-sm"
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5 text-stone-700" />
        </button>
        <div className="flex-1 min-w-0">
          <Brand />
        </div>
      </header>

      <div className="md:flex">
        {/* Mobile drawer backdrop */}
        {drawerOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — desktop static, mobile drawer */}
        <aside
          className={cn(
            "bg-white border-r border-stone-200 flex flex-col print:hidden",
            // Desktop
            "md:w-60 md:min-h-screen md:static md:translate-x-0",
            // Mobile drawer
            "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 ease-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          {sidebarContent}
        </aside>

        {/* Main */}
        <main className="flex-1 min-h-screen min-w-0 print:min-h-0">
          <GlobalWarning />
          <div className="p-4 md:p-8 max-w-6xl print:p-0 print:max-w-none">{renderPage()}</div>
        </main>
      </div>

      <ArticleModal articleNo={openArticle} onClose={() => setOpenArticle(null)} />
    </div>
  );
}
