import { useState, useMemo } from "react";
import {
  Info,
  Printer,
  Sparkles,
  Shield,
  Coins,
  PiggyBank,
  Heart,
  Lock,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { INCOME_BRACKETS } from "../../data/tax";
import { SectionTitle } from "../../components/SectionTitle";
import { PrintReport } from "../../components/PrintReport";
import { cn, formatKRW, formatKRWShort } from "../../lib/format";

/* 공통 적립식 미래가치 — RefundSimulator와 같은 공식
   매월 P씩 N개월 납입 → 연단위 복리, 매월 평균 6개월 추가 적립 보정 (√(1+r) 가산) */
const compoundFV = (monthly, months, annualRatePct) => {
  if (months === 0) return 0;
  const r = annualRatePct / 100;
  const years = months / 12;
  if (r === 0) return monthly * months;
  return monthly * 12 * (Math.pow(1 + r, years) - 1) / r * Math.sqrt(1 + r);
};

/* 별표1 폐업·사망공제금 차등지급이율 — 15년간 +0.3%, 이후 단계적 인하 (단순화: 평균 +0.15%) */
const closureBonusRate = (months) => (months / 12 <= 15 ? 0.3 : 0.15);

/* 일반 적금: 단리 (매월 납입분별 잔여기간 단리)
   총 이자 = P × r × N(N+1) / (2×12) */
const simpleSavingsFV = (monthly, months, annualRatePct) => {
  const r = annualRatePct / 100;
  const principal = monthly * months;
  if (r === 0) return principal;
  const interest = (monthly * r * months * (months + 1)) / (2 * 12);
  return principal + interest;
};

/* C. 상품 비교 계산기 (가입 시 안내 톤 — RefundSimulator와 일관) */
export const ProductCompare = ({ onOpenArticle }) => {
  const [monthlyAmount, setMonthlyAmount] = useState(300000);
  const [years, setYears] = useState(10);
  const [bracketId, setBracketId] = useState("40m_60m");
  const [yumamRate, setYumamRate] = useState(3.0);
  const [savingsRate, setSavingsRate] = useState(3.5);
  const [pensionRate, setPensionRate] = useState(3.5);
  const [withIncentive, setWithIncentive] = useState(true);
  const [incentiveMonthly, setIncentiveMonthly] = useState(20000); // 월 적립 장려금 (지자체 평균)

  const bracket = INCOME_BRACKETS.find((b) => b.id === bracketId);

  const result = useMemo(() => {
    const months = years * 12;
    const annualPayment = monthlyAmount * 12;
    const totalPrincipal = monthlyAmount * months;

    /* === 노란우산공제 — 2개 시나리오 동시 표시 === */
    // (a) 폐업·법인해산·사망공제금 — 별표1 차등지급이율 +0.3% (가장 유리)
    // (b) 노령급부 도달 — 별표1 기준이율 부리적립 (만 60세 + 120개월 충족)
    // 별표1 1~6회 납부는 납부부금만 (이자 미부리). 슬라이더가 1년~이라 항상 7회 이상.
    const yumamClosureRefund = months <= 6
      ? monthlyAmount * months
      : compoundFV(monthlyAmount, months, yumamRate + closureBonusRate(months));
    const yumamNorengRefund = months <= 6
      ? monthlyAmount * months
      : compoundFV(monthlyAmount, months, yumamRate);
    const isNorengEligible = months >= 120;
    // 두 사유 모두 수령 시 퇴직소득세 (추정 8.8%)
    const yumamTaxRate = 0.088;
    const yumamClosureTax = yumamClosureRefund * yumamTaxRate;
    const yumamClosureNet = yumamClosureRefund - yumamClosureTax;
    const yumamNorengTax = yumamNorengRefund * yumamTaxRate;
    const yumamNorengNet = yumamNorengRefund - yumamNorengTax;
    // 소득공제 절세액 누적
    const yumamDeduction = Math.min(annualPayment, bracket.deductionLimit);
    const yumamTaxSavingAnnual = yumamDeduction * bracket.marginalRate;
    const yumamTaxSavingTotal = yumamTaxSavingAnnual * years;

    /* === 가입(희망)장려금 === */
    // 1년만 적립 (가입일로부터 12회) — 그 후 공제금 수령 시까지 연복리 부리
    const incentiveYears = withIncentive ? years : 0;
    let incentiveTotal = 0;
    if (withIncentive) {
      // 첫 1년간 매월 적립
      const incentivePrincipal = incentiveMonthly * 12;
      // 그 후 가입기간 - 1년 동안 yumamRate 연복리 부리
      const remainingYears = Math.max(0, years - 1);
      const r = yumamRate / 100;
      incentiveTotal = r === 0
        ? incentivePrincipal
        : incentivePrincipal * Math.pow(1 + r, remainingYears);
      // 임의해약(노령급부 조건 미충족) 시 장려금 미지급 가능성 있음 — 단순화: 노령급부 가정 시만 포함
      if (!isNorengEligible) incentiveTotal = incentiveTotal * 0.5; // 미지급 위험 반영
    }

    /* === 일반 적금 === */
    const savingsFV = simpleSavingsFV(monthlyAmount, months, savingsRate);
    const savingsInterest = savingsFV - totalPrincipal;
    const savingsTax = savingsInterest * 0.154; // 이자소득세 15.4%
    const savingsNet = savingsFV - savingsTax;

    /* === 연금저축 === */
    // 한도 600만원 — 사업/근로소득금액 ≤ 4천만(혹은 종합 4,500만 / 총급여 5,500만 이하)이면 16.5%, 외 13.2%
    const pensionCreditRate = bracket.id === "under_40m" ? 0.165 : 0.132;
    const pensionAnnualLimit = 6_000_000;
    const pensionDeduction = Math.min(annualPayment, pensionAnnualLimit);
    const pensionTaxSavingAnnual = pensionDeduction * pensionCreditRate;
    const pensionTaxSavingTotal = pensionTaxSavingAnnual * years;
    const pensionFV = compoundFV(monthlyAmount, months, pensionRate);
    // 만 55세 이후 연금 수령 가정. 연금소득세 평균 5.5% (지방세 포함) 추정
    const pensionTaxRate = 0.055;
    const pensionTax = pensionFV * pensionTaxRate;
    const pensionNet = pensionFV - pensionTax;

    /* === 총 혜택 합계 (세후 만기액 + 누적 절세액 + 장려금) === */
    const yumamClosureTotal = yumamClosureNet + yumamTaxSavingTotal + incentiveTotal;
    const yumamNorengTotal = yumamNorengNet + yumamTaxSavingTotal + incentiveTotal;
    const savingsTotal = savingsNet;
    const pensionTotal = pensionNet + pensionTaxSavingTotal;

    const products = [
      {
        key: "yumam-closure",
        name: "노란우산 (폐업·사망 시)",
        icon: Shield,
        color: "amber",
        principal: totalPrincipal,
        fv: yumamClosureRefund,
        tax: yumamClosureTax,
        taxRate: yumamTaxRate,
        taxLabel: "퇴직소득세 추정",
        net: yumamClosureNet,
        taxSaving: yumamTaxSavingTotal,
        taxSavingLabel: "소득공제 절세액",
        incentive: incentiveTotal,
        total: yumamClosureTotal,
        scenario: "별표1 차등지급이율 (15년간 기준이율 +0.3%) — 가장 유리한 사유",
        warning: false,
      },
      {
        key: "yumam-noreng",
        name: "노란우산 (노령급부 도달 시)",
        icon: Shield,
        color: "amber",
        principal: totalPrincipal,
        fv: yumamNorengRefund,
        tax: yumamNorengTax,
        taxRate: yumamTaxRate,
        taxLabel: "퇴직소득세 추정",
        net: yumamNorengNet,
        taxSaving: yumamTaxSavingTotal,
        taxSavingLabel: "소득공제 절세액",
        incentive: incentiveTotal,
        total: yumamNorengTotal,
        scenario: isNorengEligible
          ? "별표1 기준이율 부리적립 · 만 60세 + 120개월 충족 가정"
          : "⚠ 가입기간 10년 미만 — 노령급부 조건 미충족 (참고용 추정만)",
        warning: !isNorengEligible,
      },
      {
        key: "savings",
        name: "일반 적금",
        icon: PiggyBank,
        color: "stone",
        principal: totalPrincipal,
        fv: savingsFV,
        tax: savingsTax,
        taxRate: 0.154,
        taxLabel: "이자소득세",
        net: savingsNet,
        taxSaving: 0,
        taxSavingLabel: "절세 혜택 없음",
        incentive: 0,
        total: savingsTotal,
        scenario: "단리 이자 산정 + 이자소득세 15.4% 차감",
        warning: false,
      },
      {
        key: "pension",
        name: "연금저축",
        icon: Calendar,
        color: "blue",
        principal: totalPrincipal,
        fv: pensionFV,
        tax: pensionTax,
        taxRate: pensionTaxRate,
        taxLabel: "연금소득세 추정",
        net: pensionNet,
        taxSaving: pensionTaxSavingTotal,
        taxSavingLabel: `세액공제 (${(pensionCreditRate * 100).toFixed(1)}%, 한도 600만)`,
        incentive: 0,
        total: pensionTotal,
        scenario: "만 55세+ 연금 수령 가정 · 중도해지 시 기타소득세 16.5%",
        warning: false,
      },
    ];

    const best = products.reduce((m, p) => (p.total > m.total ? p : m), products[0]);

    return {
      months,
      totalPrincipal,
      isNorengEligible,
      products,
      best,
      pensionCreditRate,
    };
  }, [
    monthlyAmount,
    years,
    bracketId,
    yumamRate,
    savingsRate,
    pensionRate,
    withIncentive,
    incentiveMonthly,
    bracket,
  ]);

  const chartData = result.products.map((p) => ({
    name: p.name.replace("노란우산 (", "").replace(")", ""),
    "세후 이자수익": Math.max(0, p.net - p.principal),
    절세액: p.taxSaving,
    장려금: p.incentive,
  }));

  const generateScript = () => {
    const lines = result.products
      .map(
        (p) =>
          `【${p.name}】 세후 만기 ${formatKRW(p.net)} + 누적 절세 ${formatKRW(p.taxSaving)}${p.incentive > 0 ? ` + 장려금 ${formatKRW(p.incentive)}` : ""} = 총 혜택 ${formatKRW(p.total)}`
      )
      .join("\n");
    return `[가입 시 비교 안내 — 추정]
월 ${formatKRW(monthlyAmount)} × ${years}년 납입 시 (총 ${formatKRW(result.totalPrincipal)})

${lines}

💡 가장 유리한 상품은 「${result.best.name}」 — 총 혜택 약 ${formatKRW(result.best.total)} (납부원금 대비 +${(((result.best.total - result.totalPrincipal) / result.totalPrincipal) * 100).toFixed(1)}%)

[차별점 — 노란우산만의 혜택]
✓ 공제금 수급권 양도·압류·담보 금지 (중협법 §119)
✓ 무담보 공제계약 대출 (해약환급금 범위)
✓ 무료 단체상해보험 자동 가입 (월부금 150배, 최대 1.5억)
✓ 복지플러스 (건강검진 20~50% 할인, 여행 50~70% 할인, 무료 경영교육·세무 자문)
${withIncentive ? `✓ 지자체 가입(희망)장려금 (월 ${formatKRW(incentiveMonthly)} × 12회 + 연복리 이자)` : ""}

※ 수령 단계 차이:
· 노란우산 = 사유 발생 시 일시금/분할 (퇴직소득세)
· 적금 = 만기 일시금 (이자소득세 15.4% 원천징수)
· 연금저축 = 만 55세+ 연금 수령 (연금소득세). 중도해지 시 기타소득세 16.5%

※ 본 비교는 가정 이율 기준 단순 시뮬레이션입니다. 실제 상품의 약관·이율·수령 단계 과세는 직접 확인 필요.

— 정확한 비교 및 의사결정은 세무 전문가 상담 권유`;
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 print:hidden">
        {/* 입력부 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-stone-200 rounded-md p-5 space-y-4">
            <SectionTitle sub="고객의 가입 조건을 입력하세요">입력</SectionTitle>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                월 납입액: {formatKRW(monthlyAmount)}
              </label>
              <input
                type="range"
                min="50000"
                max="1000000"
                step="10000"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                가입기간: {years}년
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
              {!result.isNorengEligible && (
                <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50/60 border border-amber-200 rounded-sm p-2">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>가입기간 10년 미만은 노란우산 노령급부 조건 미충족. 임의해약(별표3) 시 환급률 낮음.</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                소득금액 구간 (절세 계산용)
              </label>
              <select
                value={bracketId}
                onChange={(e) => setBracketId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-sm focus:outline-none focus:border-amber-500"
              >
                {INCOME_BRACKETS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-500 mt-1">
                연금저축 세액공제율 자동 분기: 4천만 이하 16.5%, 그 외 13.2%
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-3">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                가정 이율
              </div>
              <div>
                <label className="block text-xs text-stone-700 mb-1">
                  노란우산공제: {yumamRate.toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={yumamRate}
                  onChange={(e) => setYumamRate(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-700 mb-1">
                  일반 적금: {savingsRate.toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.1"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(Number(e.target.value))}
                  className="w-full accent-stone-500"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-700 mb-1">
                  연금저축: {pensionRate.toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.1"
                  value={pensionRate}
                  onChange={(e) => setPensionRate(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 p-3 bg-amber-50/40 border border-amber-200 rounded-sm cursor-pointer">
              <input
                type="checkbox"
                checked={withIncentive}
                onChange={(e) => setWithIncentive(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-amber-600"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-stone-900">
                  지자체 가입(희망)장려금 포함
                </div>
                <div className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                  월 {formatKRW(incentiveMonthly)} × 1년 적립 후 연복리. 임의해약 시 미지급/감액 위험.
                </div>
                {withIncentive && (
                  <input
                    type="range"
                    min="10000"
                    max="30000"
                    step="10000"
                    value={incentiveMonthly}
                    onChange={(e) => {
                      e.stopPropagation();
                      setIncentiveMonthly(Number(e.target.value));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full mt-2 accent-amber-600"
                  />
                )}
              </div>
            </label>
          </div>

          <div className="bg-blue-50/40 border border-blue-200 rounded-md p-3 text-xs text-stone-700 leading-relaxed">
            <Info className="w-3.5 h-3.5 inline-block mr-1 text-blue-600" />
            노란우산공제·연금저축은 연단위 복리 적립식 + 매월 평균 6개월 추가 적립 보정. 적금은 매월 단리. 모든 결과는 세후 추정치이며 ±5~10% 편차 가능.
          </div>
        </div>

        {/* 결과부 */}
        <div className="lg:col-span-3 space-y-4">
          {/* 헤더 — 입력 요약 */}
          <div className="bg-stone-900 text-white rounded-md p-4">
            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">
              가입 조건
            </div>
            <div className="text-sm text-stone-300">
              월 <strong className="text-white">{formatKRW(monthlyAmount)}</strong> × {years}년 = 총 납부원금{" "}
              <strong className="text-amber-300">{formatKRW(result.totalPrincipal)}</strong>
            </div>
          </div>

          {/* 상품별 카드 3종 */}
          <div className="space-y-2.5">
            {result.products.map((p) => (
              <ProductCard
                key={p.key}
                data={p}
                isBest={p.key === result.best.key}
              />
            ))}
          </div>

          {/* 인쇄 */}
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-md font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>고객 전달용 인쇄</span>
            <span className="text-[11px] font-normal text-stone-300 hidden sm:inline">
              PDF 저장 가능 · 비교표 + 디스클레이머 포함
            </span>
          </button>

          {/* 차트 — 원금 제외, 순 혜택만 비교 */}
          <div className="bg-white border border-stone-200 rounded-md p-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
              {years}년 후 순 혜택 비교 (원금 제외 · 세후 기준)
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#44403c" }} interval={0} angle={-12} textAnchor="end" height={70} />
                <YAxis tickFormatter={(v) => formatKRWShort(v)} tick={{ fontSize: 10, fill: "#78716c" }} />
                <Tooltip formatter={(v) => formatKRW(v)} contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e7e5e4" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="세후 이자수익" stackId="a" fill="#f59e0b" />
                <Bar dataKey="절세액" stackId="a" fill="#10b981" />
                <Bar dataKey="장려금" stackId="a" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
              원금은 모든 상품 동일하므로 제외. 막대 높이 = 「세후 이자수익 + 절세액 + 장려금」 — 상품 간 차이가 한눈에.
            </p>
          </div>

          {/* 노란우산 차별점 카드 */}
          <div className="bg-amber-50/40 border border-amber-200 rounded-md p-4">
            <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              노란우산만의 차별점 (수치 외 영업 포인트)
            </h4>
            <div className="space-y-2 text-xs">
              <DiffRow icon={Lock} title="공제금 수급권 보호">
                양도·압류·담보 금지 (중협법 §119). 채무·소송 위험 자산 보호.
              </DiffRow>
              <DiffRow icon={Coins} title="공제계약 대출">
                해약환급금 범위 내 무담보 대출. 일시 자금 시 해약 대신 유지 가능.
              </DiffRow>
              <DiffRow icon={Heart} title="무료 단체상해보험">
                자동 가입. 월부금의 최대 150배 (750만~1.5억) 상해 보장.
              </DiffRow>
              <DiffRow icon={Calendar} title="복지플러스">
                건강검진 20~50% 할인 / 여행·숙박 50~70% 할인 / 무료 경영교육·법무·세무 자문.
              </DiffRow>
            </div>
          </div>

          {/* 수령 단계 비교 표 */}
          <div className="bg-white border border-stone-200 rounded-md p-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
              수령 단계·과세 비교
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-left">
                    <th className="py-2 px-1 font-bold text-stone-600">항목</th>
                    <th className="py-2 px-2 font-bold text-amber-700">노란우산</th>
                    <th className="py-2 px-2 font-bold text-stone-600">적금</th>
                    <th className="py-2 px-2 font-bold text-blue-700">연금저축</th>
                  </tr>
                </thead>
                <tbody className="text-stone-800">
                  <tr className="border-b border-stone-100">
                    <td className="py-2 px-1 font-semibold">수령 시기</td>
                    <td className="py-2 px-2">사유 발생 시</td>
                    <td className="py-2 px-2">만기 일시금</td>
                    <td className="py-2 px-2">만 55세+ 연금</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 px-1 font-semibold">정상 과세</td>
                    <td className="py-2 px-2">퇴직소득세 (5~15%)</td>
                    <td className="py-2 px-2">이자소득세 15.4%</td>
                    <td className="py-2 px-2">연금소득세 3.3~5.5%</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 px-1 font-semibold">중도해지 과세</td>
                    <td className="py-2 px-2">기타소득세 16.5%</td>
                    <td className="py-2 px-2">동일</td>
                    <td className="py-2 px-2 text-red-600 font-semibold">기타소득세 16.5% ⚠</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 px-1 font-semibold">압류 보호</td>
                    <td className="py-2 px-2 text-emerald-700 font-bold">✓ 양도·압류·담보 금지</td>
                    <td className="py-2 px-2 text-stone-500">없음</td>
                    <td className="py-2 px-2 text-stone-500">없음</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 px-1 font-semibold">담보 대출</td>
                    <td className="py-2 px-2 text-emerald-700 font-bold">✓ 무담보</td>
                    <td className="py-2 px-2 text-stone-500">예적금담보 가능</td>
                    <td className="py-2 px-2 text-stone-500">제한적</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 고객 안내 멘트 */}
          <div className="bg-amber-50/40 border border-amber-200 rounded-md p-4">
            <h4 className="text-sm font-bold text-stone-900 mb-2">
              고객 안내 멘트{" "}
              <span className="text-xs font-normal text-stone-500">
                (직원 참고용 — 인쇄 안 됨)
              </span>
            </h4>
            <pre className="text-[12px] leading-relaxed whitespace-pre-wrap font-sans bg-white/70 p-3 rounded-sm border border-amber-200/60 text-stone-800 max-h-80 overflow-y-auto">
              {generateScript()}
            </pre>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-md p-3 text-xs text-stone-600 leading-relaxed">
            <strong className="text-stone-800">계산 가정:</strong> 노란우산 만기 = 노령급부 도달(만 60세+120개월)·별표1 기준이율 부리적립. 퇴직소득세 8.8% 추정(실제 5~15%). 연금저축 = 적립식 미래가치, 세액공제율은 소득구간 분기, 연금소득세 5.5% 추정. 적금 = 매월 단리, 이자소득세 15.4%. 가입(희망)장려금은 첫 1년 적립 후 가정이율 복리. 모두 추정치이며 실제 상품의 약관·이율·수령 단계 과세는 직접 확인 필요.
          </div>
        </div>
      </div>

      {/* 인쇄용 */}
      <PrintReport
        title="가입 시 상품 비교 안내"
        subtitle={`노란우산공제 vs 일반 적금 vs 연금저축 · 월 ${formatKRW(monthlyAmount)} × ${years}년`}
        disclaimer={`본 비교는 가정 이율 기준 추정치이며 모두 세후 환산 기준입니다.\n· 노란우산 = 노령급부 도달(만 60세+120개월) 가정, 별표1 기준이율 부리적립 + 퇴직소득세 8.8% 추정 (실제 5~15%)\n· 적금 = 매월 단리 + 이자소득세 15.4% 원천징수\n· 연금저축 = 적립식 미래가치, 만 55세+ 연금 수령, 연금소득세 5.5% 추정\n적금·연금저축 이율은 상품·시점에 따라 상이하므로 실제 가입 상품의 약관·이율을 직접 확인해야 합니다. 정확한 비교 및 의사결정은 세무 전문가 상담을 권해 드립니다.${result.isNorengEligible ? "" : "\n⚠ 가입기간이 10년 미만으로 노란우산 노령급부 조건 미충족 — 임의해약(별표3) 가정으로 단기 환급률이 낮게 산정되었습니다."}`}
        inputs={[
          { label: "월 납입액", value: formatKRW(monthlyAmount) },
          { label: "가입(투자) 기간", value: `${years}년` },
          { label: "소득금액 구간", value: bracket.rangeText },
          {
            label: "가정 이율 — 노란우산공제",
            value: `${yumamRate.toFixed(1)}% (연단위 복리)`,
          },
          {
            label: "가정 이율 — 일반 적금",
            value: `${savingsRate.toFixed(1)}% (단리, 이자소득세 15.4% 차감)`,
          },
          {
            label: "가정 이율 — 연금저축",
            value: `${pensionRate.toFixed(1)}% (세액공제 ${(result.pensionCreditRate * 100).toFixed(1)}%, 한도 600만원)`,
          },
          ...(withIncentive
            ? [{
                label: "가입(희망)장려금 포함",
                value: `월 ${formatKRW(incentiveMonthly)} × 12회 적립 후 연복리`,
              }]
            : []),
        ]}
        results={[
          { label: "총 납부 원금", value: formatKRW(result.totalPrincipal) },
          ...result.products.flatMap((p) => [
            {
              label: `${p.name} — 세후 만기액`,
              value: formatKRW(p.net),
              sub: p.scenario,
            },
            {
              label: `${p.name} — ${p.taxSavingLabel}`,
              value: formatKRW(p.taxSaving),
            },
            ...(p.incentive > 0
              ? [{
                  label: `${p.name} — 가입(희망)장려금`,
                  value: formatKRW(p.incentive),
                }]
              : []),
            {
              label: `${p.name} — 총 혜택 합계`,
              value: formatKRW(p.total),
              emphasis: p.key === result.best.key,
              sub:
                p.key === result.best.key
                  ? "★ 가장 유리한 시나리오"
                  : `${result.best.name} 대비 ${formatKRWShort(p.total - result.best.total)}`,
            },
          ]),
        ]}
        notes={[
          `💡 가장 유리한 상품: 「${result.best.name}」 — 총 혜택 약 ${formatKRW(result.best.total)} (납부원금 대비 +${(((result.best.total - result.totalPrincipal) / result.totalPrincipal) * 100).toFixed(1)}%)`,
          "[수령 단계 차이]\n· 노란우산: 사유 발생 시 일시금/분할 (퇴직소득세)\n· 적금: 만기 일시금 (이자소득세 15.4% 원천징수)\n· 연금저축: 만 55세+ 연금 수령 (연금소득세 3.3~5.5%). 중도 해지 시 기타소득세 16.5%",
          "[노란우산만의 차별점 — 수치 외 영업 포인트]\n✓ 공제금 수급권 양도·압류·담보 금지 (중협법 §119)\n✓ 무담보 공제계약 대출\n✓ 무료 단체상해보험 (월부금 150배, 최대 1.5억)\n✓ 복지플러스 (건강검진·여행·교육·세무자문 할인)",
          "노란우산 가입기간 < 10년은 노령급부 조건 미충족 — 임의해약 시 별표3 적용으로 단기 손실 가능. 가입은 장기 유지 전제 권장.",
        ]}
        legalBasis="조세특례제한법 제86조의3 · 중소기업협동조합법 제115조·제119조 · 약관 별표1·별표2·별표3"
      />
    </div>
  );
};

/* 상품별 카드 — RefundSimulator의 CaseCard 스타일 */
const ProductCard = ({ data, isBest }) => {
  const palette = {
    amber: { bg: "bg-amber-50/50", border: "border-amber-300", accent: "text-amber-700" },
    stone: { bg: "bg-stone-50", border: "border-stone-200", accent: "text-stone-600" },
    blue: { bg: "bg-blue-50/40", border: "border-blue-300", accent: "text-blue-700" },
  };
  const c = palette[data.color] || palette.stone;
  const Icon = data.icon;

  return (
    <div
      className={cn(
        "border-2 rounded-md p-4 transition-colors",
        isBest ? "bg-emerald-50 border-emerald-400" : `${c.bg} ${c.border}`
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", isBest ? "text-emerald-700" : c.accent)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <h4 className="text-base font-bold text-stone-900">{data.name}</h4>
              {isBest && (
                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-sm">
                  <Sparkles className="w-2.5 h-2.5" />
                  가장 유리
                </span>
              )}
              {data.warning && (
                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-red-700 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded-sm">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  조건 미충족
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">{data.scenario}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-200/70">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-0.5">
            세후 만기액 ({data.taxLabel} {(data.taxRate * 100).toFixed(1)}%)
          </div>
          <div className="text-lg font-black text-stone-900 tracking-tight">
            {formatKRW(data.net)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-0.5">
            {data.taxSavingLabel}
          </div>
          <div className={cn("text-lg font-black tracking-tight", data.taxSaving > 0 ? "text-emerald-700" : "text-stone-400")}>
            {data.taxSaving > 0 ? formatKRW(data.taxSaving) : "—"}
          </div>
        </div>
        {data.incentive > 0 && (
          <div className="col-span-2 pt-3 border-t border-stone-200/70">
            <div className="text-[10px] uppercase tracking-wider text-violet-700 font-bold mb-0.5">
              가입(희망)장려금 적립
            </div>
            <div className="text-base font-bold text-violet-700">
              {formatKRW(data.incentive)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-stone-200/70 flex items-baseline justify-between gap-3">
        <span className="text-xs text-stone-600">총 혜택 합계 (세후 + 절세 + 장려)</span>
        <span className={cn("text-xl font-black tracking-tight", isBest ? "text-emerald-700" : "text-stone-900")}>
          {formatKRW(data.total)}
        </span>
      </div>
    </div>
  );
};

const DiffRow = ({ icon: Icon, title, children }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <span className="font-bold text-stone-900">{title}</span>
      <span className="text-stone-700"> — {children}</span>
    </div>
  </div>
);
