import { PredefinedPrompt } from "./types";

export const LAW_CATEGORIES = [
  { id: "all", name: "전체" },
  { id: "civil", name: "생활민사 & 주택임대차" },
  { id: "criminal", name: "형사 & 교통법규" },
  { id: "labor", name: "근로 & 노동" },
  { id: "constitution", name: "헌법 & 기본권" },
];

export const PREDEFINED_PROMPTS: PredefinedPrompt[] = [
  {
    id: "p1",
    category: "civil",
    label: "임대차 전입신고와 확정일자 대항력",
    prompt: "아파트나 원룸 전세 계약 후 전입신고를 하고 확정일자를 받으면 언제부터 대항력과 우선변제권이 발생하게 되나요? 관련 주택임대차보호법 조항과 함께 구체적 효력 발생 시점을 알려주세요."
  },
  {
    id: "p2",
    category: "civil",
    label: "상가 계약갱신요구권 행사 기간",
    prompt: "상가 임대차 계약 시 임차인이 임대인에게 계약갱신요구권을 행사할 수 있는 최대 기간은 몇 년이며, 계약 만료 전 언제까지 요구해야 법적으로 인정받나요? 상가건물 임대차보호법 조문을 근거로 설명해주세요."
  },
  {
    id: "p3",
    category: "criminal",
    label: "단순 음주운전 처벌 기준",
    prompt: "도로교통법에 따르면 혈중알코올농도 수치별로 단순 음주운전(인명 피해가 없는 경우) 시 부과되는 형사처벌 수준(벌금 또는 징역)과 면허 정지/취소 처분 기준은 각각 어떻게 되나요?"
  },
  {
    id: "p4",
    category: "labor",
    label: "주휴수당 지급 조건 및 계산법",
    prompt: "근로기준법상 주휴수당을 지급받기 위해 충족해야 하는 주당 최소 소정근로시간과 조건이 궁금합니다. 주 15시간 일하는 파트타임의 경우 어떻게 계산되는지도 법적 조항과 계산방법을 소상히 알려주세요."
  },
  {
    id: "p5",
    category: "constitution",
    label: "헌법 제1조와 영토 조항",
    prompt: "대한민국 헌법 제1조와 제3조(영토 조항)가 가지는 헌법적 의의를 헌법 조문 텍스트와 함께 알기 쉽게 설명해 주시고 가치를 알려주세요."
  },
  {
    id: "p6",
    category: "labor",
    label: "퇴직금 지급 요건 및 소멸시효",
    prompt: "직장에서 퇴직금을 받을 수 있는 최소 근무 기간과 기준 근로 조건은 무엇이며, 퇴직금 지급을 청구할 수 있는 권리의 소멸시효는 몇 년인가요? 관련 임금퇴직예배보장법이나 근로기준법을 대조해주세요."
  }
];
