import { useState, useMemo } from "react";
import { Info, Printer, Sparkles, AlertTriangle } from "lucide-react";
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

/* 적립이자 추정 — 약관 별표 정의: 각 납부한 날의 다음 날부터 해약일까지 기준이율로 부리 적립
   매월 P씩 N개월 납입 → 연단위 복리 적립식 FV 근사
   FV ≈ (P×12) × [(1+r)^(N/12) − 1] / r × √(1+r) */
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

/* 별표1 차등지급이율 단순 가산 — 폐업·사망공제금은 15년간 +0.3%, 이후 단계적 인하 */
const closureBonusRate = (months) => (months / 12 <= 15 ? 0.3 : 0.15);

/* 별표1 공제금 미래가치
   - withBonus=true: 폐업·사망공제금 (차등지급이율 +0.3% 가산)
   - withBonus=false: 노령·재난·질병·회생·파산 공제금 (기준이율 부리적립) */
const claimFV = (monthly, months, annualRatePct, withBonus) => {
  if (months === 0) return 0;
  const principal = monthly * months;
  // 별표1 1~6회: 납부부금만 (이자 미부리)
  if (months <= 6) return principal;
  const bonus = withBonus ? closureBonusRate(months) : 0;
  const r = (annualRatePct + bonus) / 100;
  const years = months / 12;
  if (r === 0) return principal;
  return monthly * 12 * (Math.pow(1 + r, years) - 1) / r * Math.sqrt(1 + r);
};

/* 별표3 일반해약환급금 */
const generalRefund = (monthly, months, annualRatePct) => {
  const principal = monthly * months;
  const interest = accruedInterest(monthly, months, annualRatePct);
  const tier = REFUND_TABLE_GENERAL.find((r) => months >= r.from && months <= r.to);
  return {
    refund: principal * tier.baseRate + interest * tier.interestShare,
    interest,
    tier,
  };
};

/* 별표2 간주해약환급금 */
const deemedRefund = (monthly, months, annualRatePct) => {
  const principal = monthly * months;
  const interest = accruedInterest(monthly, months, annualRatePct);
  const tier = REFUND_TABLE_DEEMED.find((r) => months >= r.from && months <= r.to);
  let refund = principal;
  if (tier.calcType === "principal_plus") refund = principal + interest * tier.interestShare;
  else if (tier.calcType === "full_compound") refund = principal + interest;
  return { refund, interest, tier };
};

/* B. 해약·공제금 시나리오 계산기 — 가입 단계 안내용 */
export const RefundSimulator = ({ onOpenArticle }) => {
  const [monthlyAmount, setMonthlyAmount] = useState(300000);
  const [paidMonths, setPaidMonths] = useState(60); // 5년 디폴트
  const [assumedRate, setAssumedRate] = useState(3.0);
  const [specialReason, setSpecialReason] = useState(false);

  const result = useMemo(() => {
    const principal = monthlyAmount * paidMonths;

    /* 사유별 환급금 4종 */
    // 1) 폐업·법인해산·사망 공제금 — 별표1 차등지급이율 (+0.3% 가산, 가장 유리)
    const closureFV = claimFV(monthlyAmount, paidMonths, assumedRate, true);

    // 2) 노령급부·재난·질병·회생·파산 공제금 — 별표1 기준이율 부리적립
    const norengFV = claimFV(monthlyAmount, paidMonths, assumedRate, false);

    // 3) 간주해약 — 별표2
    const deemed = deemedRefund(monthlyAmount, paidMonths, assumedRate);

    // 4) 임의해약 — 별표3
    const general = generalRefund(monthlyAmount, paidMonths, assumedRate);

    /* 과세 추정
       - 공제금 수급(폐업·사망·노령 등) = 퇴직소득세 ~8.8%
       - 임의해약 = 기본 기타소득세 16.5% (특별해지사유 충족 시 퇴직소득세 ~8.8%)
       - 간주해약 = 별도 처리 (코드는 미과세로 표시, 실제 처리 중앙회 안내) */
    const retirementRate = 0.088;
    const otherRate = 0.165;
    const generalTaxRate = specialReason ? retirementRate : otherRate;

    const cases = [
      {
        key: "closure",
        title: "폐업·법인해산·사망 시",
        sublabel: "공제금 — 별표1 차등지급이율 (+0.3%)",
        priority: 1,
        refund: closureFV,
        taxRate: retirementRate,
        taxLabel: "퇴직소득세",
        table: "별표1",
        article: "제17조 제1항 제1호/제2호",
      },
      {
        key: "noreng",
        title: "노령급부 도달 또는 재난·질병·회생·파산 시",
        sublabel: "공제금 — 별표1 기준이율 부리적립",
        priority: 2,
        refund: norengFV,
        taxRate: retirementRate,
        taxLabel: "퇴직소득세",
        table: "별표1",
        article: "제17조 제1항 제4·5·6·7·8호",
      },
      {
        key: "deemed",
        title: "법인전환·배우자/자녀 양도 시 (간주해약)",
        sublabel: deemed.tier.label,
        priority: 3,
        refund: deemed.refund,
        taxRate: 0,
        taxLabel: "별도 안내",
        table: "별표2",
        article: "제8조 제3항",
      },
      {
        key: "general",
        title: "중도에 임의로 해약 시",
        sublabel: general.tier.label,
        priority: 4,
        refund: general.refund,
        taxRate: generalTaxRate,
        taxLabel: specialReason ? "퇴직소득세" : "기타소득세",
        table: "별표3",
        article: "제24조 제2항",
      },
    ];

    /* 각 케이스에 세후·손익 계산 */
    const withTax = cases.map((c) => {
      const tax = c.refund * c.taxRate;
      const net = c.refund - tax;
      const diff = c.refund - principal;
      const netDiff = net - principal;
      return {
        ...c,
        principal,
        tax,
        net,
        diff,
        netDiff,
        pctGross: principal > 0 ? (diff / principal) * 100 : 0,
        pctNet: principal > 0 ? (netDiff / principal) * 100 : 0,
      };
    });

    /* 가장 유리한 케이스 (세후 기준) */
    const best = withTax.reduce((m, c) => (c.net > m.net ? c : m), withTax[0]);

    return { principal, cases: withTax, best };
  }, [monthlyAmount, paidMonths, assumedRate, specialReason]);

  const chartData = result.cases.map((c) => ({
    name: c.title.split(" ")[0].replace(/[·,]/g, "·"),
    원금: result.principal,
    "세전 환급금": c.refund,
    "세후 환급금": c.net,
    isBest: c.key === result.best.key,
  }));

  const generateScript = () => {
    const lines = result.cases.map((c) => {
      const taxLine =
        c.taxRate > 0
          ? `${formatKRW(c.refund)} → 세후 약 ${formatKRW(c.net)} (${c.taxLabel} ${(c.taxRate * 100).toFixed(1)}%)`
          : `${formatKRW(c.refund)} (과세 별도 안내)`;
      return `▸ ${c.title}: ${taxLine}`;
    });
    return `[가입 시 안내 — 추정] 월 ${formatKRW(monthlyAmount)} × ${paidMonths}회(${(paidMonths / 12).toFixed(1)}년) 납입 시 사유별 환급금:

납부원금: ${formatKRW(result.principal)}

${lines.join("\n")}

💡 가장 유리한 시나리오는 「${result.best.title}」 — 세후 약 ${formatKRW(result.best.net)} (납부원금 대비 ${result.best.pctNet >= 0 ? "+" : ""}${result.best.pctNet.toFixed(1)}%)

※ 본 추정은 가정 기준이율 ${assumedRate}% 연단위 복리 적립식 기준입니다. 매 분기 변동되는 기준이율·부가지급률 등은 미반영. 정확한 금액은 중앙회 시스템(1666-9988) 조회 권장.

— 약관 근거: 약관 제17조·제18조(공제금), 제24조(해약환급금), 별표1·2·3`;
  };

  const years = (paidMonths / 12).toFixed(1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 print:hidden">
        {/* 입력부 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-stone-200 rounded-md p-5 space-y-4">
            <SectionTitle sub="가입 조건을 입력하세요">입력</SectionTitle>

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
              <div className="flex justify-between text-[11px] text-stone-500 mt-1">
                <span>5만원</span>
                <span>50만원</span>
                <span>100만원</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                납입 기간: {years}년 ({paidMonths}회)
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
                <span>10년 (120회)</span>
                <span>20년 (240회)</span>
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

            <label className="flex items-start gap-2 p-3 bg-emerald-50/40 border border-emerald-200 rounded-sm cursor-pointer">
              <input
                type="checkbox"
                checked={specialReason}
                onChange={(e) => setSpecialReason(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-600"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-stone-900">
                  임의해약에 특별해지사유 적용
                </div>
                <div className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                  120개월+ 경영악화, 천재지변, 해외이주, 3월+ 입원, 중앙회 해산, 재난 15일 입원 등 6종 충족 시 → 임의해약도 퇴직소득세 (기타소득세 16.5% → 약 8.8%로 완화)
                </div>
              </div>
            </label>
          </div>

          <div className="bg-blue-50/40 border border-blue-200 rounded-md p-3 text-xs text-stone-700 leading-relaxed">
            <Info className="w-3.5 h-3.5 inline-block mr-1 text-blue-600" />
            연단위 복리 적립식 추정. 부가지급률·매 분기 변동 기준이율은 미반영이므로 실제 환급금과 ±5~10% 편차가 발생할 수 있습니다.
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
              월 <strong className="text-white">{formatKRW(monthlyAmount)}</strong> × {paidMonths}회({years}년) = 총 납부원금{" "}
              <strong className="text-amber-300">{formatKRW(result.principal)}</strong>
            </div>
          </div>

          {/* 사유별 환급금 카드 4종 */}
          <div className="space-y-2.5">
            {result.cases.map((c) => (
              <CaseCard
                key={c.key}
                data={c}
                isBest={c.key === result.best.key}
                onOpenArticle={onOpenArticle}
              />
            ))}
          </div>

          {/* 인쇄 버튼 */}
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-md font-semibold transition-colors"
            title="이 결과 전체를 디스클레이머·입력 조건 포함하여 인쇄"
          >
            <Printer className="w-4 h-4" />
            <span>고객 전달용 인쇄</span>
            <span className="text-[11px] font-normal text-stone-300 hidden sm:inline">
              PDF 저장 가능 · 모든 사유 환급금 + 디스클레이머 포함
            </span>
          </button>

          {/* 차트 */}
          <div className="bg-white border border-stone-200 rounded-md p-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
              사유별 환급금 비교 (세전 · 세후)
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#78716c" }} />
                <YAxis tickFormatter={(v) => formatKRWShort(v)} tick={{ fontSize: 10, fill: "#78716c" }} />
                <Tooltip formatter={(v) => formatKRW(v)} contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e7e5e4" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="원금" fill="#a8a29e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="세전 환급금" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="세후 환급금" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
            <strong className="text-stone-800">계산 근거:</strong>{" "}
            <button onClick={() => onOpenArticle("제17조")} className="text-amber-700 hover:text-amber-800 underline">약관 제17조</button>(공제사유),{" "}
            <button onClick={() => onOpenArticle("제18조")} className="text-amber-700 hover:text-amber-800 underline">제18조</button>(공제금),{" "}
            <button onClick={() => onOpenArticle("제24조")} className="text-amber-700 hover:text-amber-800 underline">제24조</button>(해약환급금) + 별표1(차등지급이율)·별표2(간주해약)·별표3(임의해약). 본 시뮬레이션은 연단위 복리 적립식 추정치이며, 실제 환급금은 매 분기 변동되는 기준이율·부가지급률·차등지급이율표 단계적 인하에 따라 산정됩니다.
          </div>
        </div>
      </div>

      {/* 인쇄용 */}
      <PrintReport
        title="가입 시 사유별 환급금 안내"
        subtitle={`월 ${formatKRW(monthlyAmount)} × ${paidMonths}회(${years}년) 가입 가정`}
        disclaimer={`본 시뮬레이션은 가정 기준이율 ${assumedRate.toFixed(1)}%를 연단위 복리 적립식으로 적용한 추정치입니다.\n부가지급률·매 분기 변동 기준이율은 미반영이므로 실제 환급금과 ±5~10% 편차가 발생할 수 있습니다.\n과세 추정 — 공제금 지급(폐업·사망·노령 등): 퇴직소득세 약 8.8% / 임의해약: 기타소득세 16.5% (특별해지사유 충족 시 퇴직소득세). 실제 퇴직소득세는 근속·환산급여공제에 따라 5~15% 범위.\n정확한 금액은 중앙회 시스템(1666-9988) 조회로 확인해 주세요.`}
        inputs={[
          { label: "월 부금월액", value: formatKRW(monthlyAmount) },
          { label: "납입 기간", value: `${paidMonths}회 (${years}년)` },
          { label: "가정 기준이율", value: `${assumedRate.toFixed(1)}%` },
          {
            label: "임의해약 특별해지사유 적용",
            value: specialReason ? "예 (퇴직소득세)" : "아니오 (기타소득세 16.5%)",
          },
        ]}
        results={[
          { label: "납부원금", value: formatKRW(result.principal) },
          ...result.cases.flatMap((c) => [
            {
              label: `${c.title}`,
              value: `${formatKRW(c.refund)} (세전)`,
              sub: c.sublabel,
              emphasis: c.key === result.best.key,
            },
            {
              label: `  └ 세후 추정 (${c.taxLabel})`,
              value: c.taxRate > 0 ? `${formatKRW(c.net)} (세금 ${formatKRW(c.tax)} 차감)` : "별도 안내 (과세 처리 중앙회 확인)",
              sub: `납부원금 대비 ${c.pctNet >= 0 ? "+" : ""}${c.pctNet.toFixed(1)}%`,
            },
          ]),
        ]}
        notes={[
          `💡 가장 유리한 시나리오: 「${result.best.title}」 — 세후 약 ${formatKRW(result.best.net)} (납부원금 대비 ${result.best.pctNet >= 0 ? "+" : ""}${result.best.pctNet.toFixed(1)}%)`,
          "별표1 (공제금): 1~6회 납부부금만 / 7회+ 「폐업·사망」은 차등지급이율(15년간 +0.3%) / 「노령·재난·질병·회생·파산」은 기준이율 부리적립",
          "별표2 (간주해약): 1~12회 납부부금만(이자 미부리) / 13~36회 100%+이자 70% / 37회+ 부리적립 전액",
          "별표3 (임의해약): 1~3회 80% / 4~6회 90% / 7~12회 100% / 13회+ 부터 적립이자 단계 가산 (10~95%)",
          "공제금(폐업·사망·노령 등) 지급 시 소득공제 받은 원금과 이자에 퇴직소득세가 원천징수됩니다 (실제 세율 5~15%).",
          "임의해약 시 기본은 기타소득세 16.5% (지방세 포함). 단, 120개월+경영악화 등 6종 특별해지사유 충족 시 「특별해지사유신고서」 제출로 퇴직소득세 적용 가능 (조특법 시행령 §80조의3 제9항).",
          "임의해약 시 1~6회 단기 해약은 원금 손실(80~90% 환급)이 발생합니다. 가입 후 일시 자금이 필요하시면 공제계약 대출(해약환급금 범위 내 무담보)을 우선 검토해 주세요.",
        ]}
        legalBasis="약관 제17조·제18조(공제금), 제24조(해약환급금), 별표1·별표2·별표3, 조세특례제한법 시행령 제80조의3"
      />
    </div>
  );
};

/* 사유별 환급금 카드 */
const CaseCard = ({ data, isBest, onOpenArticle }) => {
  const isLoss = data.netDiff < 0;
  return (
    <div
      className={cn(
        "border-2 rounded-md p-4 transition-colors",
        isBest
          ? "bg-emerald-50 border-emerald-400"
          : isLoss
          ? "bg-stone-50 border-stone-200"
          : "bg-white border-stone-200"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            {isBest && (
              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-sm">
                <Sparkles className="w-2.5 h-2.5" />
                가장 유리
              </span>
            )}
            <span className="text-[9px] uppercase tracking-wider font-bold text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-sm">
              {data.table}
            </span>
            <button
              onClick={() => onOpenArticle?.(data.article)}
              className="text-[9px] uppercase tracking-wider font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-sm transition-colors"
            >
              {data.article}
            </button>
          </div>
          <h4 className="text-sm font-bold text-stone-900 leading-snug">{data.title}</h4>
          <p className="text-[11px] text-stone-500 mt-0.5">{data.sublabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-stone-200/70">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-0.5">
            세전 환급금
          </div>
          <div className="text-lg font-black text-stone-900 tracking-tight">
            {formatKRW(data.refund)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-0.5">
            세후 추정 ({data.taxLabel})
          </div>
          <div
            className={cn(
              "text-lg font-black tracking-tight",
              isBest ? "text-emerald-700" : "text-stone-900"
            )}
          >
            {data.taxRate > 0 ? formatKRW(data.net) : "별도 안내"}
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-stone-200/70 flex items-baseline justify-between gap-3 text-xs">
        <span className="text-stone-600">납부원금 대비</span>
        <span
          className={cn(
            "font-bold",
            isLoss ? "text-red-600" : "text-emerald-700"
          )}
        >
          {data.taxRate > 0
            ? `${data.pctNet >= 0 ? "+" : ""}${data.pctNet.toFixed(1)}% (세후)`
            : `${data.pctGross >= 0 ? "+" : ""}${data.pctGross.toFixed(1)}% (세전)`}
          {isLoss && (
            <AlertTriangle className="w-3 h-3 inline-block ml-1 text-red-500" />
          )}
        </span>
      </div>
    </div>
  );
};
