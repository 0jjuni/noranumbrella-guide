import { useState, useMemo } from "react";
import { AlertTriangle, TrendingDown, TrendingUp, Printer } from "lucide-react";
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
import { REFUND_TABLE_GENERAL, REFUND_TABLE_DEEMED } from "../../data/tax";
import { SectionTitle } from "../../components/SectionTitle";
import { PrintReport } from "../../components/PrintReport";
import { cn, formatKRW, formatKRWShort } from "../../lib/format";

/* 적립이자 추정 — 약관 별표 정의: "각 납부한 날의 다음 날부터 해약일까지 기준이율로 부리 적립한 금액 중 납부부금을 제외한 지급이자"
   매월 P씩 N개월 납입 → 연단위 복리 적립식 FV 근사
   FV ≈ (P×12) × [(1+r)^(N/12) − 1] / r × √(1+r)    (연환산 + 매월 평균 6개월 추가 적립 보정) */
const accruedInterest = (monthly, months, annualRatePct) => {
  if (months === 0) return 0;
  const r = annualRatePct / 100;
  const years = months / 12;
  const principal = monthly * months;
  if (r === 0) return 0;
  const fv =
    monthly * 12 * (Math.pow(1 + r, years) - 1) / r * Math.sqrt(1 + r);
  return Math.max(0, fv - principal);
};

/* 별표1 차등지급이율 추정 — 가입 후 15년간 기준이율 + 0.3%, 그 이후 단계적 인하
   단순화: 평균 가산률 = 15년 이내 +0.3%, 그 외 +0.15% */
const norengGongjegumFV = (monthly, months, annualRatePct) => {
  const years = months / 12;
  const bonus = years <= 15 ? 0.3 : 0.15;
  const r = (annualRatePct + bonus) / 100;
  const principal = monthly * months;
  if (r === 0) return principal;
  return monthly * 12 * (Math.pow(1 + r, years) - 1) / r * Math.sqrt(1 + r);
};

/* B. 해약환급금 시나리오 계산기 */
export const RefundSimulator = ({ onOpenArticle }) => {
  const [monthlyAmount, setMonthlyAmount] = useState(300000);
  const [paidMonths, setPaidMonths] = useState(36);
  const [refundType, setRefundType] = useState("general"); // general | deemed | forced
  const [assumedRate, setAssumedRate] = useState(3.0); // 가정 기준이율 %
  const [specialReason, setSpecialReason] = useState(false); // 특별해지사유 (퇴직소득세 적용)

  /* 단일 시점·해약유형 환급금 계산 */
  const calcRefund = (months, type) => {
    const principal = monthlyAmount * months;
    const interest = accruedInterest(monthlyAmount, months, assumedRate);

    let refund = 0;
    let label = "";

    if (type === "general" || type === "forced") {
      const tier = REFUND_TABLE_GENERAL.find(
        (r) => months >= r.from && months <= r.to
      );
      refund = principal * tier.baseRate + interest * tier.interestShare;
      if (type === "forced") {
        refund = refund * 0.8;
        label = `${tier.label} → 부정행위 강제해약 시 80% 적용`;
      } else {
        label = tier.label;
      }
    } else if (type === "deemed") {
      const tier = REFUND_TABLE_DEEMED.find(
        (r) => months >= r.from && months <= r.to
      );
      if (tier.calcType === "principal") refund = principal;
      else if (tier.calcType === "principal_plus")
        refund = principal + interest * tier.interestShare;
      else refund = principal + interest;
      label = tier.label;
    }

    return { principal, interest, refund, label };
  };

  /* 과세 추정 — 임의해약 기본은 기타소득세 16.5% / 특별해지사유 충족 시 퇴직소득세 추정 8.8% */
  const calcTax = (refund, type, isSpecial) => {
    if (type === "deemed") return { rate: 0, tax: 0, note: "간주해약은 임의해약 외 사유로 과세 미적용 (실제 처리는 중앙회 안내)" };
    const isPersonal = type === "general" || type === "forced";
    if (!isPersonal) return { rate: 0, tax: 0, note: "" };
    if (isSpecial) {
      const rate = 0.088;
      return {
        rate,
        tax: refund * rate,
        note: "특별해지사유 충족 시 퇴직소득세 추정 (근속·환산급여공제로 실제는 5~15% 범위)",
      };
    }
    return {
      rate: 0.165,
      tax: refund * 0.165,
      note: "기본 기타소득세 16.5% (지방세 포함) — 소득공제 받은 원금과 이자 모두 과세",
    };
  };

  const result = useMemo(() => {
    const main = calcRefund(paidMonths, refundType);
    const tax = calcTax(main.refund, refundType, specialReason);
    const netRefund = main.refund - tax.tax;
    const lossPercent = ((main.refund - main.principal) / main.principal) * 100;

    /* 시나리오 비교 — 현재 / +1년 / +3년 / +5년 / 노령급부 도달(120회+) */
    const futureMonths = [0, 12, 36, 60].map((extra) => paidMonths + extra);
    const norengMonths = Math.max(120, paidMonths);

    const scenarios = futureMonths.map((months) => {
      const s = calcRefund(months, refundType);
      const t = calcTax(s.refund, refundType, specialReason);
      const extra = months - paidMonths;
      return {
        label:
          extra === 0
            ? `현재 (${months}회)`
            : `+${extra / 12}년 (${months}회)`,
        principal: s.principal,
        refund: s.refund,
        net: s.refund - t.tax,
      };
    });

    /* 노령급부 도달 시 공제금 (별표1 차등지급이율) — 만 60세 가정 */
    const norengFV = norengGongjegumFV(monthlyAmount, norengMonths, assumedRate);
    const norengPrincipal = monthlyAmount * norengMonths;
    // 노령급부 사유는 통상 퇴직소득세 적용 → 약 8.8% 추정
    const norengTax = norengFV * 0.088;
    scenarios.push({
      label: `노령급부 (${norengMonths}회)`,
      principal: norengPrincipal,
      refund: norengFV,
      net: norengFV - norengTax,
      isNoreng: true,
    });

    return {
      principal: main.principal,
      interestEstimate: main.interest,
      refund: main.refund,
      tax,
      netRefund,
      lossPercent,
      calcDescription: main.label,
      scenarios,
      norengMonths,
    };
  }, [monthlyAmount, paidMonths, refundType, assumedRate, specialReason]);

  const generateScript = () => {
    const isLoss = result.refund < result.principal;
    const typeLabel = refundType === "general"
      ? "임의해약"
      : refundType === "deemed"
      ? "간주해약"
      : "강제해약(부정행위)";
    const taxLine = result.tax.rate > 0
      ? `▸ 과세 추정: ${(result.tax.rate * 100).toFixed(1)}% (${specialReason ? "특별해지사유 퇴직소득세" : "기타소득세"}) → 세금 약 ${formatKRW(result.tax.tax)}\n▸ 세후 실수령: 약 ${formatKRW(result.netRefund)}\n`
      : "";

    return `${
      isLoss ? "[원금 손실 발생 가능]" : "[참고용 추정]"
    } 현재 부금월액 ${formatKRW(monthlyAmount)}, 부금납부월수 ${paidMonths}회 기준 ${typeLabel} 시 추정 환급금:

▸ 납부원금: ${formatKRW(result.principal)}
▸ 추정 환급금 (세전): 약 ${formatKRW(result.refund)} ${
      isLoss
        ? `(원금 대비 ${result.lossPercent.toFixed(1)}%)`
        : `(+${result.lossPercent.toFixed(1)}%)`
    }
${taxLine}▸ 적용 기준: ${result.calcDescription}

${
  isLoss
    ? "⚠ 단기 해약 시 원금 손실이 발생합니다. 일시적 사정이시면 부금납부 중지(재해/입원/경영악화 등) 또는 부금월액 감액·공제계약 대출도 있으십니다.\n\n"
    : ""
}※ 본 추정은 가정 기준이율(${assumedRate}%) 연단위 복리 적립식으로 산정한 단순 시뮬레이션입니다. 실제 환급금은 매 분기 변동되는 기준이율, 부가지급률, 차등지급이율표 등에 따라 산정되므로 중앙회 시스템 조회로 정확한 금액을 확인해 주시기 바랍니다.
※ 과세는 추정치 — 특별해지사유 충족 여부, 소득공제 실제 적용분 등에 따라 달라집니다.

— 약관 근거: 약관 제24조(해약환급금), 별표2/3, 조특법 시행령 §80조의3`;
  };

  const refundTypeLabel = {
    general: "임의해약 (별표3)",
    deemed: "간주해약 (별표2)",
    forced: "강제해약/부정행위 (별표3 ×80%)",
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 print:hidden">
        {/* 입력부 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-stone-200 rounded-md p-5 space-y-4">
            <SectionTitle sub="고객 계약 정보 입력">입력</SectionTitle>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                해약 유형
              </label>
              <div className="space-y-1">
                {[
                  { id: "general", label: "임의해약 (개인사정)" },
                  { id: "deemed", label: "간주해약 (법인전환·사업양도 등)" },
                  { id: "forced", label: "강제해약 (부정행위)" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setRefundType(t.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-sm border transition-colors",
                      refundType === t.id
                        ? "bg-stone-900 text-white border-stone-900 font-semibold"
                        : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                부금월액: {formatKRW(monthlyAmount)}
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
                부금납부월수: {paidMonths}회 ({(paidMonths / 12).toFixed(1)}년)
              </label>
              <input
                type="range"
                min="1"
                max="240"
                step="1"
                value={paidMonths}
                onChange={(e) => setPaidMonths(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
              <div className="flex justify-between text-[11px] text-stone-500 mt-1">
                <span>1회</span>
                <span>120회 (10년)</span>
                <span>240회 (20년)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                가정 기준이율: {assumedRate.toFixed(1)}%
              </label>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={assumedRate}
                onChange={(e) => setAssumedRate(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                실제 기준이율은 매 분기 변동 — 노란우산 홈페이지 공시 확인
              </p>
            </div>

            {(refundType === "general" || refundType === "forced") && (
              <label className="flex items-start gap-2 p-3 bg-emerald-50/40 border border-emerald-200 rounded-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={specialReason}
                  onChange={(e) => setSpecialReason(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-stone-900">
                    특별해지사유 적용
                  </div>
                  <div className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                    120개월+ 경영악화, 천재지변, 해외이주, 3월+ 입원, 중앙회 해산, 재난 15일 입원 등 6종 사유 충족 시 → <strong>퇴직소득세</strong> 적용 (추정 ~8.8%, 기타소득세 16.5%보다 유리)
                  </div>
                </div>
              </label>
            )}
          </div>

          <div className="bg-red-50/40 border border-red-200 rounded-md p-3 text-xs text-stone-700 leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1 text-red-600" />
            적립이자는 연단위 복리 적립식 추정치입니다. 부가지급률·매 분기 변동 기준이율은 미반영이므로 실제 환급금과 ±5~10% 편차가 발생할 수 있습니다.
          </div>
        </div>

        {/* 결과부 */}
        <div className="lg:col-span-3 space-y-4">
          <div
            className={cn(
              "rounded-md p-6 border-2",
              result.refund < result.principal
                ? "bg-red-50 border-red-300"
                : "bg-emerald-50 border-emerald-300"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div
                  className={cn(
                    "text-xs uppercase tracking-wider font-bold mb-1",
                    result.refund < result.principal
                      ? "text-red-700"
                      : "text-emerald-700"
                  )}
                >
                  추정 환급금 ({refundTypeLabel[refundType]})
                </div>
                <div className="text-4xl font-black text-stone-900 tracking-tight">
                  {formatKRW(result.refund)}
                </div>
                <div className="text-xs text-stone-500 mt-0.5">세전 기준</div>
                <div className="text-sm mt-2">
                  <span className="text-stone-600">납부원금 대비: </span>
                  <span
                    className={cn(
                      "font-bold",
                      result.lossPercent < 0
                        ? "text-red-700"
                        : "text-emerald-700"
                    )}
                  >
                    {result.lossPercent >= 0 ? "+" : ""}
                    {result.lossPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              {result.refund < result.principal ? (
                <TrendingDown className="w-10 h-10 text-red-500" />
              ) : (
                <TrendingUp className="w-10 h-10 text-emerald-500" />
              )}
            </div>

            {result.tax.rate > 0 && (
              <div className="mt-3 p-3 bg-white/60 border border-stone-200 rounded-sm">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <div className="text-[11px] uppercase tracking-wider text-stone-600 font-bold">
                    세후 실수령 추정
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {specialReason ? "퇴직소득세" : "기타소득세"}{" "}
                    {(result.tax.rate * 100).toFixed(1)}% 차감
                  </div>
                </div>
                <div className="text-2xl font-black text-stone-900">
                  {formatKRW(result.netRefund)}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  세금 약 {formatKRW(result.tax.tax)} 차감 후
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-stone-200/50">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-0.5">
                  납부원금
                </div>
                <div className="text-base font-bold text-stone-900">
                  {formatKRW(result.principal)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-0.5">
                  적립이자 추정
                </div>
                <div className="text-base font-bold text-stone-900">
                  {formatKRW(result.interestEstimate)}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-stone-200/50 text-xs text-stone-600">
              적용 기준: {result.calcDescription}
            </div>

            <button
              onClick={() => window.print()}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-md font-semibold transition-colors"
              title="이 결과 전체를 디스클레이머·입력 조건 포함하여 인쇄"
            >
              <Printer className="w-4 h-4" />
              <span>고객 전달용 인쇄</span>
              <span className="text-[11px] font-normal text-stone-300 hidden sm:inline">
                PDF 저장 가능 · 디스클레이머·입력 조건 포함
              </span>
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-md p-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
              시점별 환급금 비교 (세전 · 세후 · 노령급부)
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={result.scenarios} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#78716c" }}
                />
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
                <Bar dataKey="principal" name="납부원금" fill="#a8a29e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="refund" name="환급금(세전)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="net" name="환급금(세후)" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              지금 해약 / 더 유지 / 노령급부 도달({result.norengMonths}회, 만 60세 가정) 비교. 노령급부 사유는 별표1 차등지급이율(15년간 +0.3%) 적용 + 퇴직소득세로 가장 유리.
            </p>
          </div>

          <div className="bg-amber-50/40 border border-amber-200 rounded-md p-4">
            <h4 className="text-sm font-bold text-stone-900 mb-2">
              고객 안내 멘트{" "}
              <span className="text-xs font-normal text-stone-500">
                (직원 참고용 — 인쇄 안 됨)
              </span>
            </h4>
            <pre className="text-[12px] leading-relaxed whitespace-pre-wrap font-sans bg-white/70 p-3 rounded-sm border border-amber-200/60 text-stone-800">
              {generateScript()}
            </pre>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-md p-3 text-xs text-stone-600 leading-relaxed">
            <strong className="text-stone-800">계산 근거:</strong>{" "}
            <button
              onClick={() => onOpenArticle("제24조")}
              className="text-amber-700 hover:text-amber-800 underline"
            >
              약관 제24조
            </button>{" "}
            + 별표2(간주해약), 별표3(일반해약). 본 시뮬레이션은 가정 기준이율 단리 평균 적용한 추정치이며, 실제 환급금은 연단위 복리·차등지급이율표·부가지급률에 따라 산정됩니다. 정확한 금액은 중앙회 시스템 조회 결과로 안내해 주세요.
          </div>
        </div>
      </div>

      {/* 인쇄용 — 화면 숨김, window.print() 호출 시 노출 */}
      <PrintReport
        title="해약환급금 시나리오 안내"
        subtitle={`${refundTypeLabel[refundType]}${specialReason ? " · 특별해지사유 적용" : ""} · 추정 시뮬레이션`}
        disclaimer={`본 시뮬레이션은 가정 기준이율 ${assumedRate.toFixed(1)}%를 연단위 복리 적립식으로 적용한 추정치입니다.\n부가지급률·매 분기 변동 기준이율은 미반영이므로 실제 환급금과 ±5~10% 편차가 발생할 수 있습니다. 정확한 금액은 중앙회 시스템 조회로 확인해야 합니다.\n과세 추정은 ${specialReason ? "특별해지사유 충족을 가정한 퇴직소득세 약 8.8% (실제는 5~15%)" : "기본 기타소득세 16.5% (지방세 포함)"} 적용.\n${
          result.refund < result.principal
            ? "⚠ 단기 해약 시 원금 손실이 발생합니다. 일시적 사정이라면 부금납부 중지(재해/입원/경영악화 6개월, 휴업/출산 1년) 또는 부금월액 감액·공제계약 대출 등의 대안을 우선 검토해 주세요."
            : ""
        }`.trim()}
        inputs={[
          {
            label: "해약 유형",
            value: refundTypeLabel[refundType] + (specialReason ? " (특별해지사유 적용)" : ""),
          },
          { label: "월 부금월액", value: formatKRW(monthlyAmount) },
          {
            label: "부금납부월수",
            value: `${paidMonths}회 (${(paidMonths / 12).toFixed(1)}년)`,
          },
          { label: "가정 기준이율", value: `${assumedRate.toFixed(1)}%` },
        ]}
        results={[
          { label: "납부원금", value: formatKRW(result.principal) },
          {
            label: "적립이자 추정",
            value: formatKRW(result.interestEstimate),
            sub: `연단위 복리 적립식 FV 기준 추정`,
          },
          {
            label: "추정 환급금 (세전)",
            value: formatKRW(result.refund),
            emphasis: true,
            sub: `납부원금 대비 ${result.lossPercent >= 0 ? "+" : ""}${result.lossPercent.toFixed(1)}%${
              result.refund < result.principal ? " (원금 손실)" : ""
            }`,
          },
          ...(result.tax.rate > 0 ? [{
            label: "추정 과세",
            value: `${(result.tax.rate * 100).toFixed(1)}% (${specialReason ? "퇴직소득세" : "기타소득세"})`,
            sub: `세금 약 ${formatKRW(result.tax.tax)}`,
          }, {
            label: "세후 실수령 추정",
            value: formatKRW(result.netRefund),
            emphasis: true,
          }] : []),
          {
            label: "적용 기준",
            value: result.calcDescription,
          },
        ]}
        notes={[
          `[시나리오 비교 — 세전 / 세후]\n· 현재 (${result.scenarios[0].label}): ${formatKRW(result.scenarios[0].refund)} / ${formatKRW(result.scenarios[0].net)}\n· ${result.scenarios[1].label}: ${formatKRW(result.scenarios[1].refund)} / ${formatKRW(result.scenarios[1].net)}\n· ${result.scenarios[2].label}: ${formatKRW(result.scenarios[2].refund)} / ${formatKRW(result.scenarios[2].net)}\n· ${result.scenarios[3].label}: ${formatKRW(result.scenarios[3].refund)} / ${formatKRW(result.scenarios[3].net)}\n· ${result.scenarios[4].label}: ${formatKRW(result.scenarios[4].refund)} / ${formatKRW(result.scenarios[4].net)} ★ 별표1 차등지급이율 + 퇴직소득세 적용`,
          "별표2(간주해약): 1~12회 납부부금만(이자 미부리), 13~36회 100%+이자 70%, 37회+ 부리적립 전액",
          "별표3(일반해약): 1~3회 80% / 4~6회 90% / 7~12회 100% / 13회+부터 적립이자 가산(10~95%)",
          "부정행위 강제해약 시 일반해약환급금의 80%만 지급. 24개월 이상 미납 강제해약은 별표3 100% 적용(임의해약과 동일)",
          "기본 과세는 기타소득세 16.5%(지방세 포함). 단, 120개월+경영악화 등 6종 특별해지사유 충족 시 「특별해지사유신고서」 제출로 퇴직소득 과세 적용 가능 (조특법 시행령 §80조의3)",
          "노령급부 사유(만 60세 + 부금납부월수 120개월 이상)는 별표1 차등지급이율(15년간 기준이율+0.3%)로 가장 유리. 영업점에서는 해약 대신 노령급부 도달까지 유지 권장",
        ]}
        legalBasis="약관 제24조(해약환급금), 별표1·별표2·별표3, 조세특례제한법 시행령 제80조의3"
      />
    </div>
  );
};
