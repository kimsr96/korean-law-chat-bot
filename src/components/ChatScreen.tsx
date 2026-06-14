import React, { useState, useRef, useEffect } from "react";
import { Send, Scale, User, Gavel, Sparkles, BookOpen } from "lucide-react";
import Markdown from "react-markdown";
import { Message } from "../types";
import GroundingSources from "./GroundingSources";

interface ChatScreenProps {
  messages: Message[];
  activeSessionTitle: string;
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  onOpenLawSearch: () => void;
}

export default function ChatScreen({
  messages,
  activeSessionTitle,
  onSendMessage,
  isGenerating,
  onOpenLawSearch
}: ChatScreenProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isGenerating) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  // Keep scrolled to bottom upon receiving messages or loading state transitions
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FDFCF8] max-w-5xl mx-auto w-full border-l border-[#1A1A1A]">
      {/* Active Conversation header */}
      <div className="h-20 border-b border-[#1A1A1A] bg-[#FDFCF8] px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="p-1.5 bg-[#1A1A1A] text-[#FDFCF8]">
            <BookOpen className="w-4 h-4 text-[#D93B2B]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-serif font-extrabold text-[#1A1A1A] text-lg truncate tracking-tight">
              {activeSessionTitle || "법령 상담 대화"}
            </h2>
            <p className="text-[10px] font-sans text-slate-500 uppercase tracking-widest font-bold">
              대한민국 법령 실시간 교차분석 저널
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenLawSearch}
            className="flex items-center space-x-2 text-[10px] bg-white text-[#D93B2B] hover:bg-[#F5F4EF] border border-[#1A1A1A] py-1.5 px-3 font-sans font-extrabold uppercase tracking-widest transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>국가법령 검색</span>
          </button>

          <div className="flex items-center space-x-2 text-[10px] bg-[#F5F4EF] text-[#1A1A1A] border border-[#1A1A1A] py-1.5 px-3.5 font-sans font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#D93B2B]" />
            <span>Gemini 3.5 Grounded</span>
          </div>
        </div>
      </div>

      {/* Message List Stream */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-[#FDFCF8]"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";

          return (
            <div 
              key={msg.id || index}
              className="w-full max-w-4xl mx-auto"
            >
              {isUser ? (
                /* User Inquiry Editorial block style */
                <div className="w-full border-b border-[#1A1A1A] pb-6 mb-2">
                  <span className="block text-[10px] font-sans font-bold text-[#8C8C8C] mb-2 uppercase tracking-widest">USER INQUIRY</span>
                  <p className="text-2xl md:text-3xl font-light tracking-tight text-[#1A1A1A] font-serif leading-tight">
                    "{msg.content}"
                  </p>
                </div>
              ) : (
                /* Statutory Response column format matching PDF/Journal design */
                <div className="w-full grid grid-cols-12 gap-3 md:gap-6 border-b border-[#E5E5E1] pb-8 mb-2">
                  <div className="col-span-1 flex justify-start items-start">
                    <span className="text-3xl italic font-black text-[#D93B2B] font-serif">A.</span>
                  </div>
                  
                  <div className="col-span-11 space-y-4">
                    <span className="block text-[11px] font-sans font-bold text-[#D93B2B] uppercase tracking-widest leading-none">Statutory Analysis Result</span>
                    
                    <div className="markdown-body text-[#1A1A1A] font-serif text-sm md:text-base leading-relaxed space-y-3">
                      <Markdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg font-extrabold mt-6 mb-2 border-b border-[#1A1A1A] pb-1.5 text-slate-950 font-serif" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-extrabold mt-4 mb-2 text-slate-900 font-serif" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-3 mb-1 text-slate-800 font-serif" {...props} />,
                          p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-[#1A1A1A] font-serif" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 text-sm space-y-1.5 text-slate-850 font-serif" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 text-sm space-y-1.5 text-slate-850 font-serif" {...props} />,
                          li: ({node, ...props}) => <li className="pl-0.5" {...props} />,
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-4 border border-[#1A1A1A]">
                              <table className="w-full border-collapse text-xs font-serif text-slate-800 bg-white" {...props} />
                            </div>
                          ),
                          thead: ({node, ...props}) => <thead className="bg-[#F5F4EF] border-b border-[#1A1A1A] text-slate-950 font-sans uppercase font-bold text-[10px] tracking-wider" {...props} />,
                          tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-150" {...props} />,
                          tr: ({node, ...props}) => <tr className="hover:bg-[#FDFCF8] transition-colors" {...props} />,
                          th: ({node, ...props}) => <th className="p-2.5 border-r border-[#E5E5E1] last:border-0 text-left" {...props} />,
                          td: ({node, ...props}) => <td className="p-2.5 border-r border-[#E5E5E1] last:border-0" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-extrabold text-slate-950 bg-[#F5F4EF] px-1 py-0.5 border-b-2 border-[#D93B2B]" {...props} />,
                          a: ({node, ...props}) => <a className="text-[#D93B2B] underline font-bold hover:text-[#1A1A1A]" target="_blank" rel="noopener noreferrer" {...props} />,
                          code: ({node, ...props}) => <code className="bg-[#F5F4EF] text-slate-900 px-1 py-0.5 rounded-none font-mono text-xs border border-slate-200" {...props} />
                        }}
                      >
                        {msg.content}
                      </Markdown>
                    </div>

                    {/* Render Google Search Grounding Reference Sources if the AI returned metadata */}
                    {(msg as any).groundingMetadata && (
                      <GroundingSources metadata={(msg as any).groundingMetadata} />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* AI response generation loading state */}
        {isGenerating && (
          <div className="w-full max-w-4xl mx-auto grid grid-cols-12 gap-3 md:gap-6 border-b border-[#E5E5E1] pb-8 mb-2">
            <div className="col-span-1 flex justify-start items-start">
              <span className="text-3xl italic font-black text-[#D93B2B] font-serif animate-pulse">A.</span>
            </div>
            <div className="col-span-11 space-y-4">
              <span className="block text-[11px] font-sans font-bold text-[#D93B2B] uppercase tracking-widest animate-pulse">Running Grounded Search...</span>
              <div className="p-4 bg-[#F5F4EF] border-l-4 border-[#1A1A1A] font-sans text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center space-x-3.5">
                <div className="w-2.5 h-2.5 bg-[#D93B2B] animate-ping rounded-full flex-shrink-0"></div>
                <span>국가법령 정보 최신 조항 및 대법원 판례 실시간 대조 교차 탐색 중...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Message Form bar */}
      <div className="p-6 md:p-8 bg-[#FDFCF8] border-t border-[#1A1A1A]">
        <form 
          onSubmit={handleSend}
          className="max-w-4xl mx-auto flex items-end justify-between space-x-6 w-full"
        >
          <div className="flex-1">
            <label className="block text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C8C8C] mb-2">Enter Citation or Inquiry</label>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="알고 싶으신 법률 질문을 입력하세요 (예: 주택 전입신고 대항력 요건은?, 근로자 연차 발생 기준은?)..."
              className="w-full bg-transparent border-b-2 border-[#1A1A1A] py-2 text-base md:text-lg font-serif text-[#1A1A1A] focus:outline-none placeholder:italic placeholder:opacity-35 resize-none h-11 focus:border-[#D93B2B] transition-colors"
              rows={1}
              disabled={isGenerating}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isGenerating}
            className={`h-12 w-12 md:h-14 md:w-14 flex items-center justify-center transition-all cursor-pointer ${
              inputValue.trim() && !isGenerating
                ? "bg-[#1A1A1A] text-[#FDFCF8] hover:bg-[#D93B2B]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        
        <p className="text-center text-[10px] font-sans text-slate-400 uppercase tracking-widest mt-4">
          Shift + Enter로 줄바꿈. 정확한 판례번호 혹은 법적 조문을 입력하시면 최신 국가법령정보의 실시간 탐색 정밀도가 극대화됩니다.
        </p>
      </div>
    </div>
  );
}
