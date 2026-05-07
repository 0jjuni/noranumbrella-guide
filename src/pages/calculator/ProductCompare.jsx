import { useState, useMemo } from "react";
import { Info, Printer } from "lucide-react";
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
import { CopyButton } from "../../components/CopyButton";
import { PrintReport } from "../../components/PrintReport";
import { formatKRW, formatKRWShort } from "../../lib/format";

/* C. 상품 비교 계산기 (적금 / 연금저축 / 노란우산공제) */
export const ProductCompare = () => {
  const [monthlyAmount, setMonthlyAmount] = useState(300000);
  const [years, setYears] = useState(10);
  const [bracketId, setBracketId] = useState("40m_60m");
  // 가정 이율
  const [yumamRate, setYumamRate] = useState(3.0); // 노란우산
  const [savingsRate, setSavingsRate] = useState(3.5); // 적금
  const [pensionRate, setPensionRate] = useState(3.5); // 연금저축

  const bracket = INCOME_BRACKETS.find((b) => b.id === bracketId);

  const result = useMemo(() => {
    const months = years * 12;
    const annualPayment = monthlyAmount * 12;
    const totalPrincipal = monthlyAmount * months;

    // 노란우산: 연 단위 복리 (단순화 — 매월 납부 후 연단위 복리 적립)
    const calcCompound = (monthly, totalMonths, annualRatePct) => {
      const r = annualRatePct / 100;
      // 매월 납입 → 연 단위 복리. 단순화: 평균 (totalMonths/2)개월 적립.
      // 더 정확한 방법은 미래가치 적립식
      // FV = P × [((1+r)^n - 1) / r] (n=년수)
      const yearsCount = totalMonths / 12;
      const yearlyContribution = monthly * 12;
      if (r === 0) return yearlyContribution * yearsCount;
      return (
        yearlyContribution * (Math.pow(1 + r, yearsCount) - 1) / r
      );
    };

    const yumamFV = calcCompound(monthlyAmount, months, yumamRate);
    const savingsFV = calcCompound(monthlyAmount, months, savingsRate);
    const pensionFV = calcCompound(monthlyAmount, months, pensionRate);

    // 노란우산 — 연도별 소득공제 절세액 누적
    const annualDeduction = Math.min(annualPayment, bracket.deductionLimit);
    const annualTaxSaving = annualDeduction * bracket.marginalRate;
    const yumamTaxSavingTotal = annualTaxSaving * years;

    // 적금 — 이자소득세 15.4% 차감
    const savingsInterest = savingsFV - totalPrincipal;
    const savingsTax = savingsInterest * 0.154;
    const savingsNet = savingsFV - savingsTax;

    // 연금저축 — 세액공제 13.2% 또는 16.5% (총급여 기준)
    // 단순화: 한도 600만원, 세액공제율 13.2% (총급여 5500만원 초과) 가정
    // 실제로는 IRP/연금저축 합산 한도 900만원, 세율 13.2%~16.5%
    const pensionAnnualLimit = 6_000_000; // 연금저축 600만원 한도
    const pensionDeduction = Math.min(annualPayment, pensionAnnualLimit);
    const pensionCreditRate = 0.132; // 보수적 가정
    const pensionAnnualCredit = pensionDeduction * pensionCreditRate;
    const pensionCreditTotal = pensionAnnualCredit * years;
    // 연금소득세 5.5%~3.3% 별도 (수령 시 과세) — 단순화 위해 미반영
    const pensionNet = pensionFV;

    // 노란우산 — 공제금/환급금 수령 시 퇴직소득세 별도 (단순화 위해 미반영, 안내문 명시)
    const yumamNet = yumamFV;

    return {
      months,
      totalPrincipal,
      // 만기 시 자산 (원금 + 이자, 세후)
      yumam: {
        fv: yumamFV,
        taxSaving: yumamTaxSavingTotal,
        totalBenefit: yumamFV + yumamTaxSavingTotal,
        net: yumamNet,
      },
      savings: {
        fv: savingsFV,
        tax: savingsTax,
        net: savingsNet,
        totalBenefit: savingsNet,
      },
      pension: {
        fv: pensionFV,
        taxSaving: pensionCreditTotal,
        net: pensionNet,
        totalBenefit: pensionFV + pensionCreditTotal,
      },
    };
  }, [monthlyAmount, years, bracketId, yumamRate, savingsRate, pensionRate, bracket]);

  const chartData = [
    {
      name: "노란우산공제",
      원금: result.totalPrincipal,
      이자수익: result.yumam.fv - result.totalPrincipal,
      절세액: result.yumam.taxSaving,
    },
    {
      name: "일반 적금",
      원금: result.totalPrincipal,
      이자수익: result.savings.net - result.totalPrincipal,
      절세액: 0,
    },
    {
      name: "연금저축",
      원금: result.totalPrincipal,
      이자수익: result.pension.fv - result.totalPrincipal,
      절세액: result.pension.taxSaving,
    },
  ];

  const generateScript = () => {
    return `[참고용 비교 시뮬레이션 — 가정 기준]
월 ${formatKRW(monthlyAmount)}을 ${years}년간 납입할 경우 추정 결과:

【노란우산공제】 (가정이율 ${yumamRate}%)
▸ 만기 적립금: 약 ${formatKRW(result.yumam.fv)}
▸ ${years}년 누적 절세액: 약 ${formatKRW(result.yumam.taxSaving)}
▸ 총 혜택 합계: 약 ${formatKRW(result.yumam.totalBenefit)}

【일반 적금】 (가정이율 ${savingsRate}%, 이자소득세 15.4%)
▸ 세후 만기액: 약 ${formatKRW(result.savings.net)}

【연금저축】 (가정이율 ${pensionRate}%, 세액공제 13.2%, 한도 600만원)
▸ 만기 적립금: 약 ${formatKRW(result.pension.fv)}
▸ ${years}년 누적 세액공제: 약 ${formatKRW(result.pension.taxSaving)}
▸ 총 혜택 합계: 약 ${formatKRW(result.pension.totalBenefit)}

※ 본 비교는 가정 이율 기준 단순 시뮬레이션입니다.
※ 노란우산공제 수령 시 퇴직소득세, 연금저축 수령 시 연금소득세 등 수령 단계 과세는 미반영.
※ 적금/연금저축 이율은 상품·시점에 따라 상이하며, 실제 가입 상품의 약관·이율을 직접 확인하셔야 합니다.
※ 노란우산공제는 공제금 수급권의 양도·압류·담보 제공이 법적으로 금지되는 등 다른 상품과 차별되는 보호 혜택이 있습니다 (중협법 제119조).

— 정확한 비교 및 의사결정은 세무 전문가 상담 권유`;
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-stone-200 rounded-md p-5 space-y-4">
            <SectionTitle sub="가정 조건 입력">입력</SectionTitle>

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
          </div>

          <div className="bg-blue-50/40 border border-blue-200 rounded-md p-3 text-xs text-stone-700 leading-relaxed">
            <Info className="w-3.5 h-3.5 inline-block mr-1 text-blue-600" />
            본 비교는 가정 이율 기준 단순 시뮬레이션입니다. 실제 상품의 약관·이율·수령 단계 과세를 반드시 확인해야 합니다.
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-amber-50 border-2 border-amber-400 rounded-md p-3">
              <div className="text-[10px] uppercase tracking-wider text-amber-800 font-bold mb-1">
                노란우산공제
              </div>
              <div className="text-xl font-black text-stone-900">
                {formatKRWShort(result.yumam.totalBenefit)}
              </div>
              <div className="text-[10px] text-stone-600 mt-1">
                적립 + 절세액
              </div>
            </div>
            <div className="bg-stone-100 border border-stone-300 rounded-md p-3">
              <div className="text-[10px] uppercase tracking-wider text-stone-600 font-bold mb-1">
                일반 적금
              </div>
              <div className="text-xl font-black text-stone-900">
                {formatKRWShort(result.savings.net)}
              </div>
              <div className="text-[10px] text-stone-500 mt-1">세후 만기액</div>
            </div>
            <div className="bg-blue-50 border border-blue-300 rounded-md p-3">
              <div className="text-[10px] uppercase tracking-wider text-blue-800 font-bold mb-1">
                연금저축
              </div>
              <div className="text-xl font-black text-stone-900">
                {formatKRWShort(result.pension.totalBenefit)}
              </div>
              <div className="text-[10px] text-stone-500 mt-1">
                적립 + 세액공제
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-md p-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
              {years}년 후 자산 구성 비교
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#44403c" }} />
                <YAxis
                  tickFormatter={(v) => formatKRWShort(v)}
                  tick={{ fontSize: 10, fill: "#78716c" }}
                />
                <Tooltip
                  formatter={(v) => formatKRW(v)}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 4,
                    border: "1px solid #e7e5e4",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="원금" stackId="a" fill="#a8a29e" />
                <Bar dataKey="이자수익" stackId="a" fill="#f59e0b" />
                <Bar dataKey="절세액" stackId="a" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-stone-200 rounded-md p-4 space-y-3">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              상품별 특성 비교
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex gap-3 items-start">
                <span className="font-bold text-amber-700 w-20 flex-shrink-0">
                  노란우산
                </span>
                <span className="text-stone-700">
                  연 복리 적립 + 소득공제 + 공제금 양도·압류·담보 금지 + 무담보 대출 가능. 단, 단기 해약 시 원금 손실, 수령 시 퇴직소득세 별도.
                </span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="font-bold text-stone-600 w-20 flex-shrink-0">
                  적금
                </span>
                <span className="text-stone-700">
                  자유로운 입출금. 이자소득세 15.4% 원천징수. 압류 보호 없음.
                </span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="font-bold text-blue-700 w-20 flex-shrink-0">
                  연금저축
                </span>
                <span className="text-stone-700">
                  세액공제 13.2~16.5% (한도 600만원). 만 55세 이후 연금 수령. 중도 해지 시 기타소득세 16.5%. 노란우산과 중복 공제 가능.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/40 border border-amber-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-stone-900">
                고객 안내 스크립트
              </h4>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-amber-400 bg-white hover:bg-amber-50 text-amber-800 rounded-sm transition-colors"
                  title="고객 전달용으로 인쇄 (디스클레이머·입력 조건 포함)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  인쇄
                </button>
                <CopyButton text={generateScript()} />
              </div>
            </div>
            <pre className="text-[12px] leading-relaxed whitespace-pre-wrap font-sans bg-white/70 p-3 rounded-sm border border-amber-200/60 text-stone-800 max-h-64 overflow-y-auto">
              {generateScript()}
            </pre>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-md p-3 text-xs text-stone-600 leading-relaxed">
            <strong className="text-stone-800">계산 가정:</strong> 노란우산공제는 연 단위 복리 적립식 미래가치 공식, 적금은 이자소득세 15.4% 차감, 연금저축은 세액공제 13.2%(보수적 가정) 적용. 수령 단계 과세(퇴직소득세·연금소득세)는 미반영. 실제 상품의 이율·세금 처리는 약관 직접 확인 필요.
          </div>
        </div>
      </div>

      {/* 인쇄용 — 화면 숨김, window.print() 호출 시 노출 */}
      <PrintReport
        title="상품 비교 시뮬레이션"
        subtitle={`노란우산공제 vs 일반 적금 vs 연금저축 · ${years}년 가정`}
        disclaimer={`본 비교는 가정 이율 기준 단순 시뮬레이션입니다. 노란우산공제 수령 시 퇴직소득세, 연금저축 수령 시 연금소득세 등 수령 단계 과세는 미반영했습니다.\n적금/연금저축 이율은 상품·시점에 따라 상이하므로 실제 가입 상품의 약관·이율을 직접 확인해야 합니다.\n정확한 비교 및 의사결정은 세무 전문가 상담을 권해 드립니다.`}
        inputs={[
          { label: "월 납입액", value: formatKRW(monthlyAmount) },
          { label: "가입(투자) 기간", value: `${years}년` },
          {
            label: "소득금액 구간 (절세 계산용)",
            value: bracket.rangeText,
          },
          {
            label: "가정 이율 — 노란우산공제",
            value: `${yumamRate.toFixed(1)}% (연 단위 복리)`,
          },
          {
            label: "가정 이율 — 일반 적금",
            value: `${savingsRate.toFixed(1)}% (이자소득세 15.4% 차감)`,
          },
          {
            label: "가정 이율 — 연금저축",
            value: `${pensionRate.toFixed(1)}% (세액공제 13.2%, 한도 600만원)`,
          },
        ]}
        results={[
          {
            label: "총 납부 원금",
            value: formatKRW(result.totalPrincipal),
          },
          {
            label: "노란우산공제 — 만기 적립금",
            value: formatKRW(result.yumam.fv),
          },
          {
            label: `노란우산공제 — ${years}년 누적 추정 절세액`,
            value: formatKRW(result.yumam.taxSaving),
          },
          {
            label: "노란우산공제 — 총 혜택 합계 (적립 + 절세)",
            value: formatKRW(result.yumam.totalBenefit),
            emphasis: true,
          },
          {
            label: "일반 적금 — 세후 만기액",
            value: formatKRW(result.savings.net),
            sub: `이자소득세 ${formatKRW(result.savings.tax)} 차감`,
          },
          {
            label: "연금저축 — 만기 적립금",
            value: formatKRW(result.pension.fv),
          },
          {
            label: `연금저축 — ${years}년 누적 추정 세액공제`,
            value: formatKRW(result.pension.taxSaving),
          },
          {
            label: "연금저축 — 총 혜택 합계 (적립 + 세액공제)",
            value: formatKRW(result.pension.totalBenefit),
          },
        ]}
        notes={[
          "[상품별 특성]",
          "· 노란우산공제: 연 복리 적립 + 소득공제 + 공제금 양도·압류·담보 금지 + 무담보 대출 가능. 단, 단기 해약 시 원금 손실, 수령 시 퇴직소득세 별도.",
          "· 일반 적금: 자유로운 입출금. 이자소득세 15.4% 원천징수. 압류 보호 없음.",
          "· 연금저축: 세액공제 13.2~16.5% (한도 600만원). 만 55세 이후 연금 수령. 중도 해지 시 기타소득세 16.5%. 노란우산과 중복 공제 가능.",
          "본 비교의 노란우산공제 절세액은 입력한 「소득금액 구간」 기준이며, 다른 소득공제 항목·세법 개정에 따라 달라집니다.",
          "노란우산공제 수령 시 퇴직소득세·연금저축 수령 시 연금소득세는 본 시뮬레이션에 반영되지 않았습니다.",
        ]}
        legalBasis="조세특례제한법 제86조의3 (소기업·소상공인 공제부금에 대한 소득공제), 중소기업협동조합법 제119조 (수급권 보호)"
      />
    </div>
  );
};
