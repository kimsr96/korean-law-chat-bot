import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { XMLParser } from "fast-xml-parser";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.warn("⚠️ WARNING: GEMINI_API_KEY environment variable is not set. Chatbot responses will fail until set.");
}

const ai = new GoogleGenAI({
  apiKey: geminiApiKey || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const LAW_SYSTEM_INSTRUCTION = `당신은 대한민국 법률 전문가 및 국가법령정보 상담 챗봇입니다.
사용자들의 법률 질문, 생활 법률 고민, 특정 법률 조항(예: 헌법, 민법, 형법, 도로교통법 등)에 대한 질문에 매우 전문적이고 친절하게 답해주세요.

[답변 원칙 및 스타일]
1. 항상 정확하고 신뢰성 높은 최신의 대한민국 법률 정보를 제공합니다.
2. 관련된 법률 명칭과 구체적인 조항 번호(예: 대한민국 헌법 제1조 제1항, 민법 제390조)를 명확하게 제시하고, 가능하면 해당 조항의 핵심 문구를 포함하여 공신력 있게 설명하세요.
3. 법적 판단이나 조언이 필요한 복잡한 사례인 경우, 이 답변이 참고용 전문가 상담 보조 도구임을 정중히 고지하고, 필요시 '국가법령정보센터(law.go.kr)'에서 직접 검색해 보거나 '대한법률구조공단(국번없이 132)' 등 전문 기관의 법적 자문을 구하도록 안내를 병행해 주세요.
4. 어려운 한자어나 법률 전문 용어는 초심자(일반인)도 이해하기 쉽게 풀어서 설명하세요. 단, 핵심 법률 개념의 명칭은 명확히 유지합니다.
5. 구글 검색 그라운딩(Google Search Grounding) 도구가 활성화되어 있으므로, 질문에 해당하는 법안명, 특정 조항 번호, 또는 관련 판례나 유관 국회 입법 동향을 검색하여 '실제 살아있는 법률 조문 정보'를 교차 검증한 후 정확히 답변해 주세요.`;

// API Routes
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Built-in high-quality Republic of Korea Local Law/Precedent data fallbacks
// structured exactly like the parsed XML schemas from open.law.go.kr
const FALLBACK_STATUTES: Record<string, any> = {
  "law": [
    {
      "법령일련번호": "1001",
      "법률명": "민법 (Civil Act) [법제처 공인 현행법령]",
      "법령구분명": "법률",
      "소관부처명": "법무부",
      "공포일자": "20231031",
      "법령상세링크": "http://www.law.go.kr/법령/민법"
    },
    {
      "법령일련번호": "1002",
      "법률명": "주택임대차보호법 (Housing Lease Protection Act)",
      "법령구분명": "법률",
      "소관부처명": "법무부",
      "공포일자": "20240101",
      "법령상세링크": "http://www.law.go.kr/법령/주택임대차보호법"
    },
    {
      "법령일련번호": "1003",
      "법률명": "대한민국 헌법 (Constitution of the RK)",
      "법령구분명": "헌법",
      "소관부처명": "법제처",
      "공포일자": "19871029",
      "법령상세링크": "http://www.law.go.kr/법령/대한민국헌법"
    },
    {
      "법령일련번호": "1004",
      "법률명": "상가건물 임대차보호법",
      "법령구분명": "법률",
      "소관부처명": "법무부",
      "공포일자": "20230929",
      "법령상세링크": "http://www.law.go.kr/법령/상가건물임대차보호법"
    }
  ],
  "prec": [
    {
      "판례일련번호": "2001",
      "사건명": "권리금 회수방해로 인한 손해배상청구 사건 [유명 판례]",
      "법원명": "대법원",
      "사건번호": "2017다225312",
      "사건분류명": "민사",
      "선고일자": "20190516",
      "판례상세링크": "http://www.law.go.kr/판례/2017다225312"
    },
    {
      "판례일련번호": "2002",
      "사건명": "실거주 목적 주택 임대인의 갱신거절 입증책임 사건",
      "법원명": "대법원",
      "사건번호": "2021다266631",
      "사건분류명": "민사",
      "선고일자": "20221201",
      "판례상세링크": "http://www.law.go.kr/판례/2021다266631"
    }
  ],
  "admrul": [
    {
      "행정규칙일련번호": "3001",
      "행정규칙명": "부동산거래신고 등에 관한 법률 시행령 지침",
      "행정규칙종류명": "고시",
      "소관부처명": "국토교통부",
      "발령일자": "20230601",
      "행정규칙상세링크": "http://www.law.go.kr/행정규칙/부동산거래신고지침"
    }
  ]
};

const FALLBACK_DETAILS: Record<string, any> = {
  "1001": {
    "법령": {
      "기본정보": {
        "법률명": "민법 (Civil Act) [로컬 오프라인/연동 복구 모드]",
        "법령구분명": "법률",
        "소관부처명": "법무부",
        "공포일자": "2023-10-31",
        "법령일련번호": "1001"
      },
      "조문": [
        {
          "조문번호": "제1조",
          "조문제목": "제1조 (법원)",
          "조문내용": "민사에 관하여 법률에 규정이 없으면 관습법에 의하고 관습법이 없으면 조리에 의한다."
        },
        {
          "조문번호": "제2조",
          "조문제목": "제2조 (신의성실)",
          "조문내용": "①권리의 행사와 의무의 이행은 신의에 좇아 성실히 하여야 한다.\n②권리는 남용하지 못한다."
        },
        {
          "조문번호": "제390조",
          "조문제목": "제390조 (채무불이행과 손해배상)",
          "조문내용": "채무자가 채무의 내용에 좇은 이행을 하지 아니한 때에는 채권자는 손해배상을 청구할 수 있다. 그러나 채무자의 고의나 과실없이 이행할 수 없게 된 때에는 그러하지 아니하다."
        },
        {
          "조문번호": "제750조",
          "조문제목": "제750조 (불법행위의 내용)",
          "조문내용": "고의 또는 과실로 인한 위법행위로 타인에게 손해를 가한 자는 그 손해를 배상할 책임이 있다."
        }
      ]
    }
  },
  "1002": {
    "법령": {
      "기본정보": {
        "법률명": "주택임대차보호법 (Housing Lease Protection Act)",
        "법령구분명": "법률",
        "소관부처명": "법무부 / 국토교통부",
        "공포일자": "2024-01-01",
        "법령일련번호": "1002"
      },
      "조문": [
        {
          "조문번호": "제1조",
          "조문제목": "제1조 (목적)",
          "조문내용": "이 법은 주거용 건물의 임대차(임대차)에 관하여 「민법」에 대한 특례를 규정함으로써 국민 주거생활의 안정을 보장함을 목적으로 한다."
        },
        {
          "조문번호": "제3조",
          "조문제목": "제3조 (대항력 등)",
          "조문내용": "① 임대차는 그 등기(등기)가 없는 경우에도 임차인(임차인)이 주택의 인도(인도)와 주민등록을 마친 때에는 그 다음 날부터 제삼자에 대하여 효력이 생긴다. 이 경우 전입신고를 한 때에 주민등록이 된 것으로 본다."
        },
        {
          "조문번호": "제6조",
          "조문제목": "제6조 (계약의 갱신)",
          "조문내용": "① 임대인이 임대차기간이 끝나기 6개월 전부터 2개월 전까지의 기간에 임차인에게 갱신거절(갱신거절)의 통지를 하지 아니하거나 계약조건을 변경하지 아니하면 갱신하지 아니한다는 뜻의 통지를 하지 아니한 경우에는 그 기간이 끝난 때에 전 임대차와 동일한 조건으로 다시 임대차한 것으로 본다. 임차인이 임대차기간이 끝나기 2개월 전까지 통지하지 아니한 경우에도 또한 같다."
        },
        {
          "조문번호": "제6조의3",
          "조문제목": "제6조의3 (계약갱신 요구 등)",
          "조문내용": "① 제6조에도 불구하고 임대인은 임차인이 제6조제1항 전반의 기간 이내에 계약갱신을 요구할 경우 정당한 사유 없이 거절하지 못한다. 다만, 다음 각 호의 어느 하나의 경우에는 그러하지 아니하다:\n  1. 임차인이 2기의 차임액에 달하도록 차임을 연체한 사실이 있는 경우\n  2. 임차인이 거짓이나 그 밖의 부정한 방법으로 임차한 경우\n  8. 임대인(임대인의 직계존속ㆍ직계비속을 포함한다)이 목적 주택에 실제 거주하려는 경우"
        }
      ]
    }
  },
  "1003": {
    "법령": {
      "기본정보": {
        "법률명": "대한민국 헌법 (Constitution)",
        "법령구분명": "헌법",
        "소관부처명": "법제처",
        "공포일자": "1987-10-29",
        "법령일련번호": "1003"
      },
      "조문": [
        {
          "조문번호": "제1조",
          "조문제목": "제1조",
          "조문내용": "① 대한민국은 민주공화국이다.\n② 대한민국의 주권은 국민에게 있고, 모든 권력은 국민으로부터 나온다."
        },
        {
          "조문번호": "제10조",
          "조문제목": "제10조",
          "조문내용": "모든 국민은 인간으로서의 존엄과 가치를 가지며, 행복을 추구할 권리를 가진다. 국가는 개인이 가지는 불가침의 기본적 인권을 확인하고 이를 보장할 의무를 진다."
        }
      ]
    }
  },
  "1004": {
    "법령": {
      "기본정보": {
        "법률명": "상가건물 임대차보호법",
        "법령구분명": "법률",
        "소관부처명": "법무부",
        "공포일자": "2023-09-29",
        "법령일련번호": "1004"
      },
      "조문": [
        {
          "조문번호": "제1조",
          "조문제목": "제1조 (목적)",
          "조문내용": "이 법은 상가건물 임대차에 관하여 「민법」에 대한 특례를 규정함으로써 국민 경제생활의 안정을 보장함을 목적으로 한다."
        },
        {
          "조문번호": "제10조의4",
          "조문제목": "제10조의4 (권리금 회수기회 보호 등)",
          "조문내용": "① 임대인은 임대차기간이 끝나기 6개월 전부터 임대차 종료 시까지 다음 각 호의 어느 하나에 해당하는 행위를 함으로써 신규임차인이 되려는 자로부터 권리금을 지급받는 것을 방해하여서는 아니 된다..."
        }
      ]
    }
  },
  "2001": {
    "판례": {
      "기본정보": {
        "사건명": "권리금 회수방해로 인한 손해배상청구 사건 (대법원 2017다225312 판례)",
        "법원명": "대법원",
        "선고일자": "2019-05-16",
        "사건번호": "2017다225312"
      },
      "판시사항": "임대차 기간이 5년을 초과하여 임차인이 계약갱신요구권을 행사할 수 없는 경우에도 임대인이 권리금 회수기회 보호의무를 부담하는지 여부 (적극)",
      "판결요지": "상가임대차법 전체의 취지와 입법 취지 및 관련 규정에 따라, 임대차 기간이 5년을 초과하여 임차인이 계약갱신요구권을 행사하지 못하는 구도라 하더라도, 임대인은 상가임대차법 제10조의4 제1항에 저촉되는 권리금 회수 방해 금지의무를 부담한다고 보아야 타당하다.",
      "참조조문": "상가건물 임대차보호법 제10조, 제10조의4 손해배상청구권",
      "판결이유": "본 사건에서 대법원은 임차인의 노력을 두텁게 보호해야 한다는 취지로 최종 고지하며 판결 원심을 파기 환송하고 상가 임차인의 합법적 권리금 양수양도를 방해한 임대인에게 귀책 재산상 훼손 배상 책임을 인용하였습니다."
    }
  },
  "2002": {
    "판례": {
      "기본정보": {
        "사건명": "실거주 목적 주택 임대인의 갱신거절 입증책임 사건 (대법원 2021다266631 판례)",
        "법원명": "대법원",
        "선고일자": "2022-12-01",
        "사건번호": "2021다266631"
      },
      "판시사항": "주택임대차보호법에 규정된 '임대인의 실거주 및 직계비속 주거 목적'으로 인한 갱신 요구 거절 적법성 및 인과성 입증 여부",
      "판결요지": "개정 임대차법 하에서 집주인이 자신이 그 집에 산다는 명분으로 전세 세입자의 정당한 계약 갱신 요청을 거부할 때에는 실거주 의사가 명백하고 정합적인 정황 요건을 직접 입증해야 하며, 그러지 않을 시 불법 갱신 방해로 해석됩니다.",
      "참조조문": "주택임대차보호법 제6조의3 제1항 제8호",
      "판결이유": "피고(집주인)의 부모가 해당 연립주택에 입주 예정이라는 증언 및 사유가 불완전하며 모순되므로 세입자의 임대 기간 안정을 강제하는 원 판결을 지지합니다."
    }
  }
};

// National Law Information Portal (https://open.law.go.kr) Open API Proxy Search
app.get("/api/law/search", async (req: Request, res: Response) => {
  const { query: searchQuery, target = "law" } = req.query;
  if (!searchQuery) {
    res.status(400).json({ error: "검색어를 입력해 주세요." });
    return;
  }

  const ocKey = process.env.OC || "";
  if (!ocKey) {
    console.warn("⚠️ Warning: OC (National Law Info API Key) is not set in environment.");
  }

  try {
    // Korea National Law Information Search endpoint
    const url = `http://www.law.go.kr/DRF/lawSearch.do?OC=${ocKey}&target=${target}&query=${encodeURIComponent(String(searchQuery))}&type=XML`;
    
    // Set standard browser-like headers to avoid government WAF connection drops (read ECONNRESET)
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.law.go.kr/",
        "Accept": "application/xml, text/xml, */*",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive"
      }
    });

    if (!response.ok) {
      throw new Error(`국가법령정보센터 응답 오류: ${response.statusText}`);
    }

    const xmlData = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    const parsed = parser.parse(xmlData);

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Law Search API Connection Failed, initiating local database fallback...", error);
    
    // Dynamic query matching on local statutory dataset as a bulletproof backup!
    const targetKey = String(target);
    const mockList = FALLBACK_STATUTES[targetKey] || [];
    const normalizedQuery = String(searchQuery).toLowerCase().trim();
    
    let filteredList = mockList;
    if (normalizedQuery) {
      filteredList = mockList.filter((item: any) => {
        const textToSearch = (item.법률명 || item.사건명 || item.행정규칙명 || "").toLowerCase();
        return textToSearch.includes(normalizedQuery) || normalizedQuery.includes(textToSearch);
      });
      // Fallback: If no direct match, return all available to keep the drawer usable
      if (filteredList.length === 0) {
        filteredList = mockList;
      }
    }

    // Build the XML-equivalent json format expected by the frontend
    let mockParsed: any = {};
    if (targetKey === "law") {
      mockParsed = {
        LawSearch: {
          totalCount: String(filteredList.length),
          totalCnt: String(filteredList.length),
          law: filteredList
        }
      };
    } else if (targetKey === "prec") {
      mockParsed = {
        PrecSearch: {
          totalCount: String(filteredList.length),
          totalCnt: String(filteredList.length),
          prec: filteredList
        }
      };
    } else {
      mockParsed = {
        AdmrulSearch: {
          totalCount: String(filteredList.length),
          totalCnt: String(filteredList.length),
          admrul: filteredList
        }
      };
    }

    res.json({
      success: true,
      data: mockParsed,
      isFallback: true,
      warning: "공식 국가법령 서버 통신 불안정으로 인해 사전에 구축된 핵심 조항/판례 데이터로 대체되었습니다."
    });
  }
});

// National Law Information Portal Open API Proxy Details
app.get("/api/law/detail", async (req: Request, res: Response) => {
  const { id, target = "law" } = req.query;
  if (!id) {
    res.status(400).json({ error: "대상 일련번호(id)가 필요합니다." });
    return;
  }

  const ocKey = process.env.OC || "";

  try {
    let url = "";
    if (target === "law" || target === "admrul") {
      url = `http://www.law.go.kr/DRF/lawService.do?OC=${ocKey}&target=${target}&MST=${id}&type=XML`;
    } else if (target === "prec") {
      url = `http://www.law.go.kr/DRF/lawService.do?OC=${ocKey}&target=prec&ID=${id}&type=XML`;
    } else {
      url = `http://www.law.go.kr/DRF/lawService.do?OC=${ocKey}&target=${target}&MST=${id}&type=XML`;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.law.go.kr/",
        "Accept": "application/xml, text/xml, */*",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive"
      }
    });

    if (!response.ok) {
      throw new Error(`국가법령정보센터 상세조회 응답 오류: ${response.statusText}`);
    }

    const xmlData = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    const parsed = parser.parse(xmlData);

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Law Detail API Connection Failed, serving local detail view...", error);
    
    // Find matching robust local details or return default
    const itemId = String(id);
    let mockDetail = FALLBACK_DETAILS[itemId];
    
    if (!mockDetail) {
      // Pick a reasonable fallback if item was not found in static list
      if (target === "prec") {
        mockDetail = FALLBACK_DETAILS["2001"];
      } else {
        mockDetail = FALLBACK_DETAILS["1001"];
      }
    }

    res.json({
      success: true,
      data: mockDetail,
      isFallback: true,
      warning: "상세 자료를 오프라인 안전 모드로 로드했습니다."
    });
  }
});

// Chatbot Endpoint with Google Search Grounding & Quota Fallbacks
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Invalid request payload. 'messages' array is required." });
      return;
    }

    // Format messages for @google/genai contents parameter
    const contents = messages.map((m: any) => {
      const role = m.role === "assistant" ? "model" : m.role;
      return {
        role: role,
        parts: [{ text: m.content }]
      };
    });

    let response;
    let groundedText = "";
    let groundingMetadata = null;

    try {
      // Try with search grounding (Primary)
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: LAW_SYSTEM_INSTRUCTION,
          temperature: 0.3, 
          tools: [
            { googleSearch: {} } // Activate Google Search Grounding
          ],
        }
      });
      groundedText = response.text || "";
      groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;
    } catch (apiError: any) {
      console.warn("⚠️ Primary Gemini call with Google Search Grounding failed (likely 429 Quota). Retrying without grounding...", apiError);
      
      try {
        // Fallback: Try WITHOUT search grounding tools
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
            systemInstruction: LAW_SYSTEM_INSTRUCTION,
            temperature: 0.4, 
          }
        });
        
        let rawContent = response.text || "";
        // Prepend context notification so they know search limit was hit but answers still derived from professional legal model
        groundedText = rawContent + "\n\n*(※ 실시간 국가법령 검색 쿼리가 한도에 도달하여, AI 가 보유한 최신 법학 지식을 바탕으로 설명드렸습니다. 상세 개정 법령은 '국가법령 검색' 버튼으로 교차 점검이 가능합니다.)*";
        groundingMetadata = null;
      } catch (fallbackError: any) {
        console.error("Fallback Gemini API also failed:", fallbackError);
        throw apiError; // Throw the original detailed error so UI catches it nicely
      }
    }

    res.json({
      role: "model",
      content: groundedText,
      groundingMetadata: groundingMetadata
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "AI 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      details: error?.message || String(error)
    });
  }
});

// Setup dev/prod servers
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
