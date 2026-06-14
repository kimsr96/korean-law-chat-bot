import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  X, 
  Book, 
  ChevronRight, 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  MessageSquare,
  AlertCircle
} from "lucide-react";

interface LawSearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToChat: (text: string) => void;
}

type SearchTarget = "law" | "prec" | "admrul";

interface LawItem {
  id: string;
  title: string;
  type: string;
  dept?: string;
  date?: string;
  link?: string;
  originalData: any;
}

export default function LawSearchDrawer({ isOpen, onClose, onImportToChat }: LawSearchDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [target, setTarget] = useState<SearchTarget>("law");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LawItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  
  // Detail views
  const [selectedItem, setSelectedItem] = useState<LawItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailContent, setDetailContent] = useState<string>("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setErrorMessage("");
    setInfoMessage("");
    setResults([]);
    setSelectedItem(null);

    try {
      const response = await fetch(`/api/law/search?query=${encodeURIComponent(searchTerm)}&target=${target}`);
      if (!response.ok) {
        throw new Error("서버 응답 오류가 발생했습니다.");
      }
      
      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || "검색에 실패했습니다.");
      }

      if (resData.isFallback) {
        setInfoMessage(resData.warning || "정부 서버 응답 장애로 예비 안전모드 데이터베이스가 가동되었습니다.");
      } else {
        setInfoMessage("");
      }

      const parsedJSON = resData.data;
      let rawList: any[] = [];

      // Safe hierarchy parsing because Korean Law API tags differ by target
      if (target === "law" && parsedJSON?.LawSearch) {
        const root = parsedJSON.LawSearch;
        const total = parseInt(root.totalCnt || "0", 10);
        if (total === 0) {
          setErrorMessage("검색 결과가 없습니다. 정확한 법안명을 입력해 보세요.");
          return;
        }
        rawList = root.law || [];
      } else if (target === "prec" && parsedJSON?.PrecSearch) {
        const root = parsedJSON.PrecSearch;
        const total = parseInt(root.totalCnt || "0", 10);
        if (total === 0) {
          setErrorMessage("검색 결과가 없습니다. 관련 범죄명이나 핵심 판례 번호를 조회해 보세요.");
          return;
        }
        rawList = root.prec || [];
      } else if (target === "admrul" && parsedJSON?.AdmrulSearch) {
        const root = parsedJSON.AdmrulSearch;
        const total = parseInt(root.totalCnt || "0", 10);
        if (total === 0) {
          setErrorMessage("검색 결과가 없습니다.");
          return;
        }
        rawList = root.admrul || [];
      }

      // Convert single object to array of size 1 if XML parser did not make it an array
      const normalizedList = Array.isArray(rawList) ? rawList : [rawList];

      const mappedItems: LawItem[] = normalizedList.map((item: any, idx: number) => {
        if (target === "law") {
          return {
            id: String(item.법령일련번호 || idx),
            title: item.법률명 || "명칭 없음",
            type: item.법령구분명 || "법령",
            dept: item.소관부처명,
            date: item.공포일자 ? String(item.공포일자).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") : undefined,
            link: item.법령상세링크,
            originalData: item
          };
        } else if (target === "prec") {
          return {
            id: String(item.판례일련번호 || idx),
            title: item.사건명 || "명칭 없음",
            type: `${item.법원명 || "법원"} ${item.사건번호 || ""}`,
            dept: item.사건분류명,
            date: item.선고일자 ? String(item.선고일자).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") : undefined,
            link: item.판례상세링크,
            originalData: item
          };
        } else {
          return {
            id: String(item.행정규칙일련번호 || idx),
            title: item.행정규칙명 || "명칭 없음",
            type: item.행정규칙종류명 || "행정규칙",
            dept: item.소관부처명,
            date: item.발령일자 ? String(item.발령일자).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") : undefined,
            link: item.행정규칙상세링크,
            originalData: item
          };
        }
      });

      setResults(mappedItems);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "국가법령 공동활용 시스템 연동 중 장비 장애가 감지되었습니다. 잠시 후 재시도 바랍니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDetail = async (item: LawItem) => {
    setSelectedItem(item);
    setDetailLoading(true);
    setDetailContent("");

    try {
      const response = await fetch(`/api/law/detail?id=${item.id}&target=${target}`);
      if (!response.ok) {
        throw new Error("상세조회를 가져오는데 실패했습니다.");
      }

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || "상세조회 연동 실패");
      }

      // Format parsed XML details
      const parsedJSON = resData.data;
      let formattedText = "";

      if (target === "law" && parsedJSON?.법령) {
        const lawObj = parsedJSON.법령;
        formattedText = formatLawDetail(lawObj);
      } else if (target === "prec" && parsedJSON?.판례) {
        const precObj = parsedJSON.판례;
        formattedText = formatPrecDetail(precObj);
      } else {
        formattedText = `상세 정보를 불러왔으나 포맷할 수 없는 유형입니다.\n\n[원본 데이터 정보]\n${JSON.stringify(parsedJSON, null, 2)}`;
      }

      setDetailContent(formattedText);
    } catch (err: any) {
      console.error(err);
      setDetailContent(`⚠️ 상세 법조문 조회를 불러오지 못했습니다. (권한 초과 혹은 일시적 리소스 지연)\n\n오류 내용: ${err?.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  // XML detail node hierarchical formatter helper for Statutes
  const formatLawDetail = (law: any): string => {
    let text = "";
    text += `# ${law.기본정보?.법률명 || "국가 규정"} (${law.기본정보?.법령구분명 || "법률"})\n`;
    text += `* **소관 부처**: ${law.기본정보?.소관부처명 || "미지정부서"} | **공포일자**: ${law.기본정보?.공포일자 || "미지정"}\n`;
    text += `* **법령일련번호**: ${law.기본정보?.법령일련번호 || "N/A"}\n\n`;
    text += `---\n\n`;

    // Extract 조문 (Articles)
    if (law.조문체계도 || law.조문) {
      const articlesRoot = law.조문체계도?.조문 || law.조문;
      if (articlesRoot) {
        const list = Array.isArray(articlesRoot) ? articlesRoot : [articlesRoot];
        list.forEach((art: any) => {
          text += `### ${art.조문제목 || art.조문번호 || "조 편제"}\n`;
          if (art.조문내용) {
            text += `${art.조문내용}\n\n`;
          }
          
          // Paragraphs (항, 호)
          if (art.항) {
            const paragraphs = Array.isArray(art.항) ? art.항 : [art.항];
            paragraphs.forEach((p: any) => {
              text += `* ${p.항내용 || p}\n`;
              if (p.호) {
                const subItems = Array.isArray(p.호) ? p.호 : [p.호];
                subItems.forEach((sub: any) => {
                  text += `  - ${sub.호내용 || sub}\n`;
                });
              }
            });
            text += `\n`;
          }
        });
      } else {
        text += `조문 정보를 XML 문서 구조에서 파싱하지 못했습니다.\n`;
      }
    } else {
      text += `해당 조항의 요약 또는 연동 본문이 비어있습니다.\n`;
    }

    return text;
  };

  // Hierarchical formatter helper for Precedents (판례)
  const formatPrecDetail = (prec: any): string => {
    let text = "";
    text += `# 대법원 판례: ${prec.기본정보?.사건명 || "미명명 사건"}\n`;
    text += `* **선고 기관**: ${prec.기본정보?.법원명 || "대법원"} | **선고일자**: ${prec.기본정보?.선고일자 || "미선고"} | **사건번호**: ${prec.기본정보?.사건번호 || "N/A"}\n\n`;
    text += `---\n\n`;

    const sections = [
      { key: "판시사항", label: "⚖️ 판시사항 (Holdings)" },
      { key: "판결요지", label: "📝 판결요지 (Summary of Ruling)" },
      { key: "참조조문", label: "📂 참조조문 (Referenced Statutes)" },
      { key: "판결이유", label: "💬 판결이유 및 결론 (Full Opinion)" }
    ];

    sections.forEach(sec => {
      const val = prec[sec.key] || prec.기본정보?.[sec.key];
      if (val) {
        text += `## ${sec.label}\n`;
        text += `${val}\n\n`;
      }
    });

    return text;
  };

  const currentYear = new Date().getFullYear();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop mask */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 transition-opacity"
          />

          {/* Right Sliding Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] md:w-[540px] bg-[#FDFCF8] border-l-2 border-[#1A1A1A] text-[#1A1A1A] z-50 flex flex-col shadow-2xl font-serif h-screen overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#1A1A1A] bg-[#F5F4EF] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1 px-2 bg-[#1A1A1A] text-[#FDFCF8] text-[10px] uppercase font-sans font-bold tracking-widest leading-none">
                  Open API Hub
                </div>
                <h2 className="text-lg font-black italic tracking-tight font-serif flex items-center space-x-1.5">
                  <Book className="w-4 h-4 text-[#D93B2B]" />
                  <span>국가법령 공동활용 검색실</span>
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-[#1A1A1A] hover:text-[#FDFCF8] border border-transparent hover:border-[#1A1A1A] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inner Content area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6 space-y-5">
              
              {!selectedItem ? (
                /* Search Form & List View */
                <>
                  <form onSubmit={handleSearch} className="space-y-4">
                    {/* Source Selection Radios */}
                    <div className="grid grid-cols-3 gap-1.5 border border-[#1A1A1A] p-1 bg-[#F5F4EF] font-sans text-xs">
                      {(["law", "prec", "admrul"] as SearchTarget[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTarget(t)}
                          className={`py-2 text-center uppercase tracking-wider font-bold cursor-pointer transition-colors ${
                            target === t 
                              ? "bg-[#1A1A1A] text-[#FDFCF8]" 
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {t === "law" ? "법률" : t === "prec" ? "판례" : "행정규칙"}
                        </button>
                      ))}
                    </div>

                    {/* Search Field */}
                    <div className="flex space-x-2 w-full">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder={
                            target === "law" 
                              ? "법안명 입력 (예: 민법, 주택임대차보호법)..." 
                              : target === "prec" 
                                ? "판례사건명/사건번호 입력 (예: 권리금 회수방해)..." 
                                : "행정규칙명 검색..."
                          }
                          className="w-full bg-[#FDFCF8] border border-[#1A1A1A] py-2.5 pl-9 pr-4 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-[#D93B2B] focus:border-[#D93B2B]"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#1A1A1A] hover:bg-[#D93B2B] text-white px-5 py-2.5 font-sans font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        {loading ? "SEARCHING..." : "검색"}
                      </button>
                    </div>
                  </form>

                  {/* Info helper */}
                  {results.length === 0 && !loading && !errorMessage && (
                    <div className="p-4 bg-[#F5F4EF] border-l-2 border-[#D93B2B] font-serif text-xs leading-relaxed space-y-1 mt-2">
                      <p className="font-sans font-bold text-[#1A1A1A] uppercase tracking-wider text-[10px]">Open.law.go.kr API Active Connector</p>
                      <p className="text-slate-700">대한민국 정부 국가법령정보 서비스 연동 키가 활성화되었습니다. 수백만 건의 실제 실공포 법령 및 대법원 판례 데이터의 실시간 조회가 가능합니다.</p>
                    </div>
                  )}

                  {/* Error State */}
                  {errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2 font-sans">
                      <AlertCircle className="w-4 h-4 text-[#D93B2B] flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="block font-bold">API 연결 실패</strong>
                        <p className="leading-relaxed opacity-90">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Fallback Warning Notice */}
                  {infoMessage && (
                    <div className="p-4 bg-[#FDFBF2] border border-[#EBE3C5] text-[#805C15] text-xs flex items-start space-x-2 font-serif rounded-none mt-2">
                      <AlertCircle className="w-4 h-4 text-[#D93B2B] flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="block font-sans font-bold uppercase tracking-wider text-[10px]">로컬 예비 활성모드 가동</strong>
                        <p className="leading-relaxed opacity-90">{infoMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Loading spinner */}
                  {loading && (
                    <div className="py-24 text-center flex flex-col items-center space-y-3">
                      <div className="w-7 h-7 border border-[#D93B2B] border-t-transparent animate-spin rounded-full"></div>
                      <span className="font-sans text-[11px] uppercase tracking-widest text-[#8C8C8C] animate-pulse">Requesting open database...</span>
                    </div>
                  )}

                  {/* Results list */}
                  {results.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="block text-[10px] font-sans font-bold text-[#8C8C8C] uppercase tracking-widest border-b border-[#E5E5E1] pb-1.5 mb-2">
                        Statutory Listing ({results.length} found)
                      </span>
                      
                      <div className="space-y-2 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
                        {results.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleFetchDetail(item)}
                            className="p-4 bg-[#FDFCF8] border border-[#1A1A1A] hover:border-[#D93B2B] hover:shadow-[4px_4px_0px_0px_#1A1A1A] cursor-pointer transition-all space-y-2 relative group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-sans font-bold text-[#D93B2B] uppercase tracking-wider bg-[#F5F4EF] px-2 py-0.5 border border-[#1A1A1A]/25">
                                {item.type}
                              </span>
                              {item.dept && (
                                <span className="text-[10px] font-sans text-slate-500 font-bold">{item.dept}</span>
                              )}
                            </div>
                            
                            <h3 className="font-bold text-sm md:text-base leading-snug font-serif text-[#1A1A1A] group-hover:text-[#D93B2B] transition-colors">
                              {item.title}
                            </h3>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans pt-1 border-t border-[#E5E5E1]/40">
                              <span>발행/공포일: {item.date || "미정"}</span>
                              <span className="flex items-center space-x-1 font-bold tracking-wider text-slate-600 group-hover:text-[#D93B2B]">
                                <FileText className="w-3 h-3" />
                                <span>전문 보기</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Detail Page View */
                <div className="space-y-4 h-full flex flex-col min-h-0">
                  {/* Detail operations hub */}
                  <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3 mb-1">
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="inline-flex items-center space-x-1.5 py-1.5 px-3 bg-[#F5F4EF] border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FDFCF8] text-xs font-sans font-bold transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>LIST</span>
                    </button>

                    <button
                      onClick={() => {
                        if (detailContent) {
                          onImportToChat(detailContent);
                        }
                      }}
                      disabled={detailLoading}
                      className="inline-flex items-center space-x-1.5 py-1.5 px-3.5 bg-[#D93B2B] text-white hover:bg-[#1A1A1A] text-xs font-sans font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>대화창에 조문 연동</span>
                    </button>
                  </div>

                  {/* Detail paper content */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white border border-[#1A1A1A] shadow-inner font-serif text-sm md:text-base leading-relaxed text-[#1A1A1A] space-y-4 max-h-[calc(100vh-230px)]">
                    {detailLoading ? (
                      <div className="py-24 text-center flex flex-col justify-center items-center space-y-3 h-full">
                        <div className="w-7 h-7 border border-[#D93B2B] border-t-transparent animate-spin rounded-full"></div>
                        <span className="font-sans text-[11px] uppercase tracking-widest text-slate-500 animate-pulse">Retrieving Gazettes...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{detailContent}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1A1A1A] bg-[#F5F4EF] text-center">
              <span className="text-[9px] font-sans text-slate-500 uppercase tracking-widest leading-none">
                © {currentYear} Supreme National Law Registry (open.law.go.kr)
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
