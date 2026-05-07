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

/* B. 해약환급금 시나리오 계산기 */
export const RefundSimulator = ({ onOpenArticle }) => {
  const [monthlyAmount, setMonthlyAmount] = useState(300000);
  const [paidMonths, setPaidMonths] = useState(36);
  const [refundType, setRefundType] = useState("general"); // general | deemed | forced
  const [assumedRate, setAssumedRate] = useState(3.0); // 가정 기준이율 %

  const result = useMemo(() => {
    const principal = monthlyAmount * paidMonths;

    // 평균 적립이자 추정 — 매월 납입액에 평균 (paidMonths/2)개월 동안 단리 적용
    // (실제 약관은 연단위 복리이지만 단순화된 추정)
    const avgMonths = paidMonths / 2;
    const annualRate = assumedRate / 100;
    const interestEstimate =
      principal * annualRate * (avgMonths / 12);

    let refund = 0;
    let calcDescription = "";

    if (refundType === "general" || refundType === "forced") {
      const tier = REFUND_TABLE_GENERAL.find(
        (r) => paidMonths >= r.from && paidMonths <= r.to
      );
      refund = principal * tier.baseRate + interestEstimate * tier.interestShare;
      if (refundType === "forced") {
        refund = refund * 0.8;
        calcDescription = `${tier.label} → 부정행위 강제해약 시 80% 적용`;
      } else {
        calcDescription = tier.label;
      }
    } else {
      // deemed (간주해약)
      const tier = REFUND_TABLE_DEEMED.find(
        (r) => paidMonths >= r.from && paidMonths <= r.to
      );
      if (tier.calcType === "principal") {
        refund = principal;
      } else if (tier.calcType === "principal_plus") {
        refund = principal + interestEstimate * tier.interestShare;
      } else {
        refund = principal + interestEstimate;
      }
      calcDescription = tier.label;
    }

    const lossPercent = ((refund - principal) / principal) * 100;

    // 시나리오 비교 — 1년/3년/5년 더 유지하면?
    const scenarios = [0, 12, 36, 60].map((extraMonths) => {
      const newMonths = paidMonths + extraMonths;
      const newPrincipal = monthlyAmount * newMonths;
      const newAvgMonths = newMonths / 2;
      const newInterestEst = newPrincipal * annualRate * (newAvgMonths / 12);

      let newRefund = 0;
      if (refundType === "general" || refundType === "forced") {
        const tier = REFUND_TABLE_GENERAL.find(
          (r) => newMonths >= r.from && newMonths <= r.to
        );
        newRefund =
          newPrincipal * tier.baseRate + newInterestEst * tier.interestShare;
        if (refundType === "forced") newRefund = newRefund * 0.8;
      } else {
        const tier = REFUND_TABLE_DEEMED.find(
          (r) => newMonths >= r.from && newMonths <= r.to
        );
        if (tier.calcType === "principal") newRefund = newPrincipal;
        else if (tier.calcType === "principal_plus")
          newRefund = newPrincipal + newInterestEst * tier.interestShare;
        else newRefund = newPrincipal + newInterestEst;
      }

      return {
        label:
          extraMonths === 0
            ? `현재 (${newMonths}회)`
            : `+${extraMonths / 12}년 후 (${newMonths}회)`,
        principal: newPrincipal,
        refund: newRefund,
        diff: newRefund - newPrincipal,
      };
    });

    return {
      principal,
      interestEstimate,
      refund,
      lossPercent,
      calcDescription,
      scenarios,
    };
  }, [monthlyAmount, paidMonths, refundType, assumedRate]);

  const generateScript = () => {
    const isLoss = result.refund < result.principal;
    return `${
      isLoss ? "[원금 손실 발생 가능]" : "[참고용 추정]"
    } 현재 부금월액 ${formatKRW(
      monthlyAmount
    )}, 부금납부월수 ${paidMonths}회 기준 ${
      refundType === "general"
        ? "임의해약"
        : refundType === "deemed"
        ? "간주해약"
        : "강제해약(부정행위)"
    } 시 추정 환급금:

▸ 납부원금: ${formatKRW(result.principal)}
▸ 추정 환급금: 약 ${formatKRW(result.refund)} ${
      isLoss
        ? `(원금 대비 ${result.lossPercent.toFixed(1)}%)`
        : `(+${result.lossPercent.toFixed(1)}%)`
    }
▸ 적용 기준: ${result.calcDescription}

${
  isLoss
    ? "⚠ 단기 해약 시 원금 손실이 발생합니다. 일시적 사정이시면 부금납부 중지 제도(재해/입원/경영악화 등)나 부금월액 감액을 통해 유지하시는 방법도 있으십니다.\n\n"
    : ""
}※ 본 추정은 가정 기준이율(${assumedRate}%)을 적용한 단순 시뮬레이션입니다. 실제 환급금은 매 분기 변동되는 기준이율, 부가지급률, 차등지급이율표 등에 따라 산정되므로 중앙회 시스템 조회로 정확한 금액을 확인해 주시기 바랍니다.

— 약관 근거: 약관 제24조(해약환급금), 별표2/3`;
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
          </div>

          <div className="bg-red-50/40 border border-red-200 rounded-md p-3 text-xs text-stone-700 leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1 text-red-600" />
            본 시뮬레이션은 평균 단리 추정치입니다. 실제 환급금은 약관 별표 기준(연단위 복리)·차등지급이율표·부가지급률 변동을 반영해야 정확합니다.
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
                <div className="text-sm mt-1">
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
              유지 시나리오 비교
            </h4>
            <ResponsiveContainer width="100%" height={220}>
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
                <Bar dataKey="refund" name="추정 환급금" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-stone-500 mt-2">
              지금 해약 vs 더 유지 시 비교 (1년/3년/5년 추가 납입 가정)
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
        subtitle={`${refundTypeLabel[refundType]} · 추정 시뮬레이션`}
        disclaimer={`본 시뮬레이션은 가정 기준이율 ${assumedRate.toFixed(1)}% (단리 평균)을 적용한 단순 추정치입니다.\n실제 환급금은 매 분기 변동되는 기준이율, 부가지급률, 차등지급이율표(연 단위 복리)에 따라 산정되므로 정확한 금액은 중앙회 시스템 조회로 확인해야 합니다.\n${
          result.refund < result.principal
            ? "⚠ 단기 해약 시 원금 손실이 발생합니다. 일시적 사정이라면 부금납부 중지(재해/입원/경영악화 6개월, 휴업/출산 1년) 또는 부금월액 감액(3개월 이상 납입 후) 등의 대안을 우선 검토해 주세요."
            : ""
        }`.trim()}
        inputs={[
          {
            label: "해약 유형",
            value: refundTypeLabel[refundType],
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
            sub: `단리 평균(부금납부월수 / 2개월) 적용 추정`,
          },
          {
            label: "추정 환급금",
            value: formatKRW(result.refund),
            emphasis: true,
            sub: `납부원금 대비 ${result.lossPercent >= 0 ? "+" : ""}${result.lossPercent.toFixed(1)}%${
              result.refund < result.principal ? " (원금 손실)" : ""
            }`,
          },
          {
            label: "적용 기준",
            value: result.calcDescription,
          },
        ]}
        notes={[
          `[유지 시 비교]\n· 현재 해약: ${formatKRW(result.scenarios[0].refund)}\n· 1년 더 유지: ${formatKRW(result.scenarios[1].refund)}\n· 3년 더 유지: ${formatKRW(result.scenarios[2].refund)}\n· 5년 더 유지: ${formatKRW(result.scenarios[3].refund)}`,
          "별표2(간주해약): 1~12회 납부부금만(이자 미부리), 13~36회 100%+이자 70%, 37회+ 부리적립 전액",
          "별표3(일반해약): 1~3회 80% / 4~6회 90% / 7~12회 100% / 13회+부터 적립이자 가산(10~95%)",
          "부정행위 강제해약 시 일반해약환급금의 80%만 지급",
          "기본 과세는 기타소득세 16.5%(지방세 포함). 단, 120개월+경영악화 또는 해지 전 6개월 내 5가지 사유 충족 시 「특별해지사유신고서」 제출로 퇴직소득 과세 적용 가능",
        ]}
        legalBasis="약관 제24조(해약환급금), 별표2·별표3, 조세특례제한법 시행령 제80조의3"
      />
    </div>
  );
};
