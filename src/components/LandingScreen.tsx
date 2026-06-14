import React, { useState } from "react";
import { motion } from "motion/react";
import { Scale, ArrowRight, Gavel, FileText, HeartHandshake, ShieldCheck, Landmark } from "lucide-react";
import { PREDEFINED_PROMPTS, LAW_CATEGORIES } from "../constants";

interface LandingScreenProps {
  onSelectPrompt: (promptText: string) => void;
  userName?: string;
}

export default function LandingScreen({ onSelectPrompt, userName }: LandingScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredPrompts = selectedCategory === "all" 
    ? PREDEFINED_PROMPTS 
    : PREDEFINED_PROMPTS.filter(p => p.category === selectedCategory);

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case "civil":
        return <Landmark className="w-4 h-4 text-emerald-600" />;
      case "criminal":
        return <Gavel className="w-4 h-4 text-rose-600" />;
      case "labor":
        return <HeartHandshake className="w-4 h-4 text-cyan-600" />;
      case "constitution":
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-12 md:px-12 flex flex-col items-center justify-center font-serif max-w-4xl mx-auto w-full bg-[#FDFCF8] text-[#1A1A1A]">
      {/* Intro branding card with pure typography */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4 mb-12 w-full"
      >
        <div className="mx-auto w-10 h-10 bg-[#1A1A1A] text-[#FDFCF8] flex items-center justify-center border border-[#1A1A1A]">
          <Scale className="w-5 h-5 text-[#D93B2B]" />
        </div>
        
        <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-[#1A1A1A]">
          K-LAW INTELLIGENCE
        </h2>
        
        <span className="block text-xs font-sans uppercase tracking-[0.3em] text-[#8C8C8C] mb-4">
          Statutory Retrieval & Consultation System
        </span>
        
        <p className="text-sm md:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed font-serif font-light">
          {userName ? `반갑습니다, ${userName}님. ` : ""}
          대한민국의 실제 법령 조문, 행정 법안 규제, 일상생활 법률 상식을 구글 검색 그라운딩 기술로 실시간 교차 검증하여 답변하는 인공지능 법률상담 부관입니다.
        </p>

        <div className="inline-flex items-center space-x-2 bg-[#F5F4EF] text-[#1A1A1A] px-3.5 py-1.5 text-xs font-sans font-bold border border-[#1A1A1A]">
          <span className="w-2.5 h-2.5 bg-[#D93B2B] animate-pulse"></span>
          <span>Google Search Grounding 실시간 교차 검증 활성화</span>
        </div>
      </motion.div>

      {/* Categories filter list */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="w-full space-y-4 mb-10"
      >
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
          <span className="text-xs font-sans font-bold text-[#8C8C8C] uppercase tracking-widest">Select Statutory Category</span>
          <span className="text-[10px] font-sans text-slate-400">분야별 빠른 법률 상담 제안</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {LAW_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 border transition-all cursor-pointer font-sans text-xs font-bold uppercase tracking-wider ${
                selectedCategory === cat.id
                  ? "bg-[#1A1A1A] border-[#1A1A1A] text-[#FDFCF8]"
                  : "bg-white border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F5F4EF]"
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Suggested items grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
      >
        {filteredPrompts.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group p-6 bg-white border border-[#1A1A1A] hover:border-[#D93B2B] hover:shadow-[4px_4px_0px_0px_#1A1A1A] cursor-pointer transition-all flex flex-col justify-between text-left h-full"
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-sans font-bold text-[#D93B2B] uppercase tracking-widest bg-[#F5F4EF] px-2 py-0.5 border border-[#1A1A1A]/20">
                  {LAW_CATEGORIES.find(c => c.id === item.category)?.name}
                </span>
                <span className="text-[9px] font-mono font-bold text-[#8C8C8C]">No. 0{index + 1}</span>
              </div>
              <h3 className="font-bold text-[#1A1A1A] font-serif text-base leading-snug group-hover:text-[#D93B2B] transition-colors">
                {item.label}
              </h3>
              <p className="text-xs text-slate-600 font-serif leading-relaxed line-clamp-3">
                {item.prompt}
              </p>
            </div>
            
            <div className="mt-6 pt-3 border-t border-[#E5E5E1] flex items-center justify-between text-[#8C8C8C] group-hover:text-[#1A1A1A] transition-colors">
              <span className="text-[11px] font-sans font-bold uppercase tracking-widest">Consult Prompt</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform text-[#D93B2B]" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Disclaimer details in pure fine print */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-14 text-center text-[10px] font-sans text-slate-500 max-w-lg border-t border-[#1A1A1A] pt-4 leading-relaxed"
      >
        **Disclaimer**: 본 서비스의 인공지능 답변은 신뢰할 수 있는 법률 조문을 바탕으로 작성되나, 법적 효력을 갖는 정식 대리자나 유권해석이 아닙니다. 실제 재판이나 중대한 법적 계약 이행 시에는 법무 전문가의 공식 조언을 필히 구하시기를 권장합니다.
      </motion.div>
    </div>
  );
}
