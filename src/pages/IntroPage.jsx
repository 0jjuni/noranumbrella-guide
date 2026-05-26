import {
  Lightbulb,
  Shield,
  Coins,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Phone,
  ChevronRight,
  Building2,
  Calculator,
  MessageSquare,
  HelpCircle,
  BookOpen,
} from "lucide-react";

/* 노란우산공제를 처음 접하는 직원을 위한 한 페이지 스크롤 입문서.
   약관·법령 근거를 명시한 채로 5분 안에 핵심을 잡을 수 있도록 구성. */
export const IntroPage = ({ onNavigate, onOpenArticle }) => {
  return (
    <div className="space-y-14 max-w-3xl">
      {/* 히어로 */}
      <div className="pb-2">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          <span className="text-[13px] uppercase tracking-widest text-amber-700 font-bold">
            5분 입문
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-[1.15]">
          노란우산공제,<br />
          한 번에 정리합니다
        </h1>
        <p className="text-lg text-stone-600 mt-5 leading-loose">
          이 페이지만 읽으셔도 고객 응대에 필요한 기본은 다 잡힙니다.<br />
          더 깊은 내용은 각 섹션의 약관·법령 링크로 이동하세요.
        </p>
      </div>

      {/* §1. 제도 정체성 */}
      <Section
        num="1"
        title="노란우산공제는 어떤 제도예요?"
        subtitle="한 줄로 — 소기업·소상공인 대표자를 위한 「퇴직금」 성격의 공제 제도"
      >
        <div className="bg-amber-50/60 border-l-4 border-amber-500 p-6 rounded-r-md space-y-4">
          <p className="text-[15px] text-stone-800 leading-loose">
            <strong className="text-stone-900">운영 주체</strong> — 중소기업중앙회의 공제사업
          </p>
          <p className="text-[15px] text-stone-800 leading-loose">
            <strong className="text-stone-900">본질</strong> — 일반 「적금」이 아니라 「공제」. 사업자가 폐업·사망·노령·재난·질병 등으로 사업을 더 못 하시게 됐을 때, 그동안 모으신 돈을 「퇴직금」처럼 받으시는 구조입니다.
          </p>
          <p className="text-[15px] text-stone-800 leading-loose">
            <strong className="text-stone-900">다른 상품과 차이</strong> — ① 소득공제 ② 공제금 수급권 양도·압류·담보 금지. 적금엔 둘 다 없습니다.
          </p>
        </div>
        <Refs onOpenArticle={onOpenArticle} items={["중협법 제115조", "조특법 제86조의3", "중협법 제119조"]} />
      </Section>

      {/* §2. 누가 가입 가능? */}
      <Section
        num="2"
        title="누가 가입할 수 있어요?"
        subtitle="소기업·소상공인 대표자만 가능 — 7개 업종은 가입 제한"
        icon={Building2}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="가입 가능">
            <ul className="text-[15px] text-stone-800 space-y-2.5 leading-relaxed">
              <li>· 개인사업자 또는 영리법인 대표자</li>
              <li>· 청약 시점 사업 영위 중</li>
              <li>· 이미 가입한 노란우산이 없을 것</li>
              <li>· 부정수급으로 해지 후 1년 경과</li>
            </ul>
          </Card>
          <Card title="가입 제한 7개 업종" color="red">
            <ul className="text-sm text-stone-800 space-y-2 leading-relaxed">
              <li>· 일반/무도유흥주점업 (56211/56212)</li>
              <li>· 무도장 운영업 (91291)</li>
              <li>· 기타 사행시설 관리·운영업 (91249)</li>
              <li>· 카지노 운영업 (91242)</li>
              <li>· 유사 의료업 (86902)</li>
              <li>· 시각장애인 운영 안 하는 안마원·안마시술소</li>
            </ul>
          </Card>
        </div>
        <p className="text-sm text-stone-700 mt-5 leading-loose">
          부금월액은 <strong className="text-stone-900">월 5만원부터 100만원까지 1만원 단위</strong>로 선택. 월납·분기납 중 택일.
        </p>
        <Refs onOpenArticle={onOpenArticle} items={["제9조"]} />
      </Section>

      {/* §3. 세제 혜택 */}
      <Section
        num="3"
        title="왜 좋아요 ① — 소득공제 (최대 연 600만원)"
        subtitle="사업소득에서 직접 빼주는 세금 혜택"
        icon={Coins}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[15px] border border-stone-200 rounded-md overflow-hidden">
            <thead className="bg-stone-100 border-b-2 border-stone-300">
              <tr className="text-left">
                <th className="px-4 py-3 font-bold text-stone-800">사업·근로소득금액</th>
                <th className="px-4 py-3 font-bold text-stone-800">소득공제 한도</th>
                <th className="px-4 py-3 font-bold text-stone-800 text-right">절세 예시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr className="hover:bg-stone-50/50"><td className="px-4 py-3.5">4천만원 이하</td><td className="px-4 py-3.5 font-bold">600만원</td><td className="px-4 py-3.5 text-right text-emerald-700 font-black">약 99만원</td></tr>
              <tr className="hover:bg-stone-50/50"><td className="px-4 py-3.5">4천만원 초과 ~ 6천만원 이하</td><td className="px-4 py-3.5 font-bold">500만원</td><td className="px-4 py-3.5 text-right text-emerald-700 font-black">약 132만원</td></tr>
              <tr className="hover:bg-stone-50/50"><td className="px-4 py-3.5">6천만원 초과 ~ 1억원 이하</td><td className="px-4 py-3.5 font-bold">400만원</td><td className="px-4 py-3.5 text-right text-emerald-700 font-black">약 154만원</td></tr>
              <tr className="hover:bg-stone-50/50"><td className="px-4 py-3.5">1억원 초과</td><td className="px-4 py-3.5 font-bold">200만원</td><td className="px-4 py-3.5 text-right text-emerald-700 font-black">약 84만원</td></tr>
            </tbody>
          </table>
        </div>
        <div className="bg-amber-50/60 border border-amber-200 rounded-md p-5 mt-5 text-[15px] text-stone-800 leading-loose">
          <strong className="text-stone-900">법인대표는 다릅니다.</strong> 총급여 8천만원 초과(= 근로소득금액 6,625만원 초과) 시 근로소득금액에서 소득공제 불가. 사업소득은 부동산임대업 비중만큼 한도 차감.
        </div>
        <Refs onOpenArticle={onOpenArticle} items={["조특법 제86조의3"]} />
        <button
          onClick={() => onNavigate?.("calculator")}
          className="mt-5 inline-flex items-center gap-1.5 text-base text-amber-700 hover:text-amber-800 font-bold"
        >
          <Calculator className="w-4 h-4" />
          내 고객 절세효과 즉시 계산
          <ChevronRight className="w-4 h-4" />
        </button>
      </Section>

      {/* §4. 안전판 */}
      <Section
        num="4"
        title="왜 좋아요 ② — 안전판 (양도·압류·담보 금지)"
        subtitle="일반 적금엔 없는 차별화 요소"
        icon={Shield}
      >
        <div className="space-y-4">
          <div className="bg-emerald-50/50 border-l-4 border-emerald-500 rounded-r-md p-6">
            <p className="text-[15px] text-stone-800 leading-loose">
              <strong className="text-stone-900">공제금 수급권은 양도·압류·담보 제공 모두 금지</strong>. 사업자가 채무·소송에 휘말려도 노란우산 공제금은 안전하게 받으실 수 있습니다.
            </p>
            <p className="text-sm text-stone-600 mt-3 leading-relaxed">
              ※ 단 「행복지킴이 통장」 등 압류방지 통장을 사용하셔야 통장 단계에서도 완전 보호.
            </p>
          </div>
          <div className="bg-blue-50/50 border-l-4 border-blue-500 rounded-r-md p-6">
            <p className="text-[15px] text-stone-800 leading-loose">
              <strong className="text-stone-900">공제계약 대출도 가능</strong> — 해약환급금 범위 내 무담보 대출. 일시적 자금 필요 시 해약 대신 대출로 유지 권장.
            </p>
          </div>
        </div>
        <Refs onOpenArticle={onOpenArticle} items={["중협법 제119조", "중협법 제121조의2", "제32조"]} />
      </Section>

      {/* §5. 공제사유 */}
      <Section
        num="5"
        title="언제 돈을 받으시나요? — 공제사유 8가지"
        subtitle="이 중 하나가 발생하면 「공제금」 청구"
        icon={ClipboardList}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[15px]">
          {[
            "① 폐업 (개인) / 법인 폐업·해산",
            "② 사망",
            "③ 질병·부상으로 법인대표 퇴임",
            "④ 노령급부 (만 60세 + 부금납부월수 120개월 이상)",
            "⑤ 자연재난 또는 사회재난(특별재난지역 한정)",
            "⑥ 6개월 이상 요양 필요 질병·부상",
            "⑦ 회생절차 개시",
            "⑧ 파산선고",
          ].map((reason, i) => (
            <div key={i} className="flex items-start gap-2.5 p-4 bg-white border border-stone-200 rounded-md hover:border-amber-300 transition-colors">
              <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="text-stone-800 leading-relaxed">{reason}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-stone-700 mt-5 leading-loose">
          공제금 = 납부부금 + 별표1 차등지급이율표 적용 (15년간 기준이율 + 0.3%, 이후 단계적 인하).
        </p>
        <Refs onOpenArticle={onOpenArticle} items={["제17조", "제18조"]} />
      </Section>

      {/* §6. 해약은 손해 */}
      <Section
        num="6"
        title="해약은 손해입니다 — 단정 안내 금지"
        subtitle="단기 해약 시 원금 손실이 발생"
        icon={AlertTriangle}
      >
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-md p-6 space-y-4">
          <p className="text-[15px] text-stone-800 leading-loose">
            <strong className="text-red-700">1~3회 납부 후 해약 시 80%, 4~6회 90%, 7~12회 100%만 환급</strong> (별표3 일반해약환급금). 즉 단기에 해약하시면 원금 손실이 발생합니다.
          </p>
          <p className="text-[15px] text-stone-800 leading-loose">
            일시적 사정이신 고객에게는 해약 대신 먼저 다음 대안을 안내해 주세요:
          </p>
          <ul className="text-[15px] text-stone-800 space-y-2 leading-relaxed pl-2">
            <li><strong className="text-stone-900">① 부금납부 중지</strong> — 재해·입원·경영악화 6개월 / 휴업·파산절차·출산 1년</li>
            <li><strong className="text-stone-900">② 부금월액 감액</strong> — 3개월 이상 납입 후 가능</li>
            <li><strong className="text-stone-900">③ 공제계약 대출</strong> — 해약환급금 범위 내 무담보</li>
          </ul>
        </div>
        <Refs onOpenArticle={onOpenArticle} items={["제24조", "제12조"]} />
        <button
          onClick={() => onNavigate?.("calculator")}
          className="mt-5 inline-flex items-center gap-1.5 text-base text-amber-700 hover:text-amber-800 font-bold"
        >
          <Calculator className="w-4 h-4" />
          해약환급금 시나리오 계산기
          <ChevronRight className="w-4 h-4" />
        </button>
      </Section>

      {/* §7. 직원이 꼭 기억할 점 */}
      <Section
        num="7"
        title="직원이 꼭 기억할 5가지"
        subtitle="고객 안내 전 체크리스트"
      >
        <div className="space-y-3">
          {[
            { k: "단정 안내 금지", v: "기준이율·부가지급률은 매 분기 변동. 절세액·환급금은 모두 「추정치」. 정확한 금액은 중앙회 시스템 조회로 안내." },
            { k: "가입 제한 업종 확인", v: "한국표준산업분류 코드까지 확인. 사후 무효 판명 시 원금에 기타소득세 16.5% / 이자 15.4% 부과." },
            { k: "자필서명·약관 교부", v: "청약서 자필서명은 본인 직접. 약관 미교부·중요내용 미설명·자필서명 누락 시 3개월 내 계약 취소 가능." },
            { k: "행정정보 공동이용 동의", v: "별지 제61호 동의서 자필서명 시 12종(사업자등록증명·폐업사실증명·소득세액공제확인서 등) 자동 조회. 신분증·청구서만 받아도 OK." },
            { k: "고객 개인정보 금지", v: "본 도구의 시뮬레이션·계산기에는 절대 실제 고객정보 입력 금지. 가상 변수로만 진행." },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-5 bg-white border border-stone-200 rounded-md hover:border-amber-300 transition-colors">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-900 text-white text-sm font-black flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-stone-900 mb-1.5">{item.k}</div>
                <div className="text-[15px] text-stone-700 leading-loose">{item.v}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* §8. 다음 단계 */}
      <Section
        num="8"
        title="이제 어디로 가시면 돼요?"
        subtitle="상황별로 추천 메뉴"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NextCard
            icon={MessageSquare}
            title="실제 손님 응대 중"
            desc="상담 시뮬레이터로 단계별 분류"
            onClick={() => onNavigate?.("simulator")}
          />
          <NextCard
            icon={Calculator}
            title="세금 혜택 보여드리기"
            desc="계산기 — 절세액 / 환급금 / 비교"
            onClick={() => onNavigate?.("calculator")}
            highlight
          />
          <NextCard
            icon={ClipboardList}
            title="특정 업무가 막혔을 때"
            desc="업무별 가이드 20개"
            onClick={() => onNavigate?.("guide")}
          />
          <NextCard
            icon={HelpCircle}
            title="짧은 질문 한 건"
            desc="FAQ 60개 검색"
            onClick={() => onNavigate?.("faq")}
          />
        </div>

        <div className="mt-5 p-6 bg-stone-900 text-white rounded-md flex items-center gap-4">
          <Phone className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-widest text-stone-400 font-bold mb-0.5">중앙회 콜센터</div>
            <div className="text-2xl font-black tracking-tight">1666-9988</div>
          </div>
          <a
            href="https://www.8899.or.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-300 hover:text-amber-200 underline font-medium"
          >
            www.8899.or.kr
          </a>
        </div>
      </Section>
    </div>
  );
};

/* 스크롤 섹션 wrapper */
const Section = ({ num, title, subtitle, icon: Icon, children }) => (
  <section className="space-y-5">
    <div className="flex items-start gap-4 border-b-2 border-stone-900 pb-4">
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 text-white text-lg font-black tracking-tight flex-shrink-0">
        {num}
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-stone-700" />}
          <h2 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight leading-snug">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
    {children}
  </section>
);

const Card = ({ title, color = "stone", children }) => {
  const colors = {
    stone: "bg-stone-50 border-stone-200",
    red: "bg-red-50/40 border-red-200",
    amber: "bg-amber-50/40 border-amber-200",
  };
  return (
    <div className={`${colors[color]} border rounded-md p-5`}>
      <div className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">{title}</div>
      {children}
    </div>
  );
};

const NextCard = ({ icon: Icon, title, desc, onClick, highlight }) => (
  <button
    onClick={onClick}
    className={`group text-left p-5 border rounded-md transition-all ${
      highlight
        ? "bg-amber-50 border-amber-300 hover:border-amber-500"
        : "bg-white border-stone-200 hover:border-stone-400"
    }`}
  >
    <div className="flex items-start gap-3">
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${highlight ? "text-amber-700" : "text-stone-600"}`} />
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold text-stone-900 mb-1">{title}</div>
        <div className="text-sm text-stone-600 leading-relaxed">{desc}</div>
      </div>
      <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1.5 transition-transform group-hover:translate-x-0.5 ${highlight ? "text-amber-700" : "text-stone-400"}`} />
    </div>
  </button>
);

/* 섹션 하단 근거 조항 모음 — 본문 흐름과 분리해 가독성 확보 */
const Refs = ({ items = [], onOpenArticle }) => {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-4">
      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-stone-500">
        <BookOpen className="w-3 h-3" />
        근거
      </span>
      {items.map((a) => (
        <button
          key={a}
          onClick={() => onOpenArticle?.(a)}
          className="text-xs text-stone-600 hover:text-amber-700 bg-stone-100 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 px-2 py-0.5 rounded-sm transition-colors"
        >
          {a}
        </button>
      ))}
    </div>
  );
};
