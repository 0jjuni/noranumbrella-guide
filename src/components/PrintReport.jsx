/* 계산기 결과를 고객에게 인쇄·전달하기 위한 표준 양식.
   화면에는 hidden, 인쇄(window.print) 시에만 노출되도록 print:block 적용.
   디스클레이머·입력 조건·결과·법령 근거를 모두 포함하여 고객에게 전달 시 오해를
   줄이는 것이 목적. */
export const PrintReport = ({
  title,
  subtitle,
  disclaimer,
  inputs = [],
  results = [],
  notes = [],
  legalBasis,
  showId,
}) => {
  const now = new Date();
  const printedAt = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, "0")}. ${String(
    now.getDate()
  ).padStart(2, "0")}. ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div
      className="hidden print:block print-report fixed inset-0 bg-white text-stone-900 z-[100] overflow-auto"
      style={{ fontFamily: "'Noto Sans KR', 'Pretendard', system-ui, sans-serif" }}
      aria-hidden="true"
    >
      <div className="p-8 max-w-3xl mx-auto leading-normal">
        {/* 헤더 */}
        <div className="border-b-2 border-stone-900 pb-3 mb-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                노란우산공제 상담 자료 · iM뱅크
              </div>
              <h1 className="text-xl font-black text-stone-900 mt-0.5">{title}</h1>
              {subtitle && <p className="text-sm text-stone-700 mt-0.5">{subtitle}</p>}
            </div>
            <div className="text-right text-[10px] text-stone-500 leading-snug flex-shrink-0">
              <div>인쇄일시: {printedAt}</div>
              {showId && <div>참조번호: {showId}</div>}
            </div>
          </div>
        </div>

        {/* 디스클레이머 — 가장 눈에 띄게 */}
        <div className="border-2 border-amber-600 bg-amber-50 rounded-sm p-3 mb-5">
          <div className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">⚠</span>
            <div className="flex-1">
              <div className="text-[11px] font-black text-amber-900 uppercase tracking-wider mb-1">
                본 안내는 추정치입니다 — 반드시 확인해 주세요
              </div>
              <p className="text-[12px] text-stone-900 leading-relaxed whitespace-pre-line">
                {disclaimer}
              </p>
            </div>
          </div>
        </div>

        {/* 입력 조건 — 어떤 조건으로 산정했는지 명시 */}
        {inputs.length > 0 && (
          <section className="mb-5">
            <h2 className="text-[12px] font-black uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
              입력 조건 (산정 기준)
            </h2>
            <table className="w-full text-[12px]">
              <tbody>
                {inputs.map(({ label, value }, i) => (
                  <tr key={i} className="border-b border-stone-100 last:border-b-0">
                    <td className="py-1.5 pr-3 text-stone-600 w-2/5 align-top">{label}</td>
                    <td className="py-1.5 text-stone-900 font-semibold">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 추정 결과 */}
        {results.length > 0 && (
          <section className="mb-5">
            <h2 className="text-[12px] font-black uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
              추정 결과
            </h2>
            <table className="w-full text-[12px]">
              <tbody>
                {results.map(({ label, value, emphasis, sub }, i) => (
                  <tr
                    key={i}
                    className={
                      emphasis
                        ? "border-b-2 border-amber-600 bg-amber-50"
                        : "border-b border-stone-100"
                    }
                  >
                    <td
                      className={`py-2 px-2 text-stone-600 w-2/5 align-top ${
                        emphasis ? "font-bold text-amber-900" : ""
                      }`}
                    >
                      {label}
                    </td>
                    <td className={`py-2 px-2 ${emphasis ? "text-base font-black text-amber-900" : "text-stone-900 font-semibold"}`}>
                      {value}
                      {sub && (
                        <div className="text-[11px] font-normal text-stone-600 mt-0.5">
                          {sub}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 참고 사항 */}
        {notes.length > 0 && (
          <section className="mb-5">
            <h2 className="text-[12px] font-black uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
              참고 사항
            </h2>
            <ul className="text-[12px] text-stone-800 leading-relaxed space-y-1">
              {notes.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-stone-500 flex-shrink-0">·</span>
                  <span className="flex-1 whitespace-pre-line">{n}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 푸터 — 법령 근거 + 콜센터 + 단정 안내 금지 */}
        <div className="border-t-2 border-stone-900 pt-3 mt-6 text-[10.5px] text-stone-700 leading-relaxed space-y-1">
          {legalBasis && (
            <p>
              <strong className="text-stone-900">법령 근거:</strong> {legalBasis}
            </p>
          )}
          <p>
            <strong className="text-stone-900">출처:</strong> 소기업·소상공인공제 약관(2026.1.1 시행),
            조세특례제한법(2026.2.27 시행), 중소기업협동조합법(제121조의2 2026.6.3 시행)
          </p>
          <p>
            <strong className="text-stone-900">문의:</strong> 중소기업중앙회 노란우산공제 1666-9988 ·
            https://www.8899.or.kr/
          </p>
          <p className="text-stone-500 mt-2">
            본 자료는 iM뱅크 영업점 직원이 고객 상담 시 참고용으로 제공하는 추정 안내입니다. 실제
            공제금·환급금·세액·이율은 다른 소득공제 항목, 추가 소득, 시점, 세법 개정, 분기별 기준이율
            변동 등에 따라 달라질 수 있으니 정확한 금액은 중앙회 시스템 조회 결과로 확인해 주시기
            바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
};
