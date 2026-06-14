import React from "react";
import { Search, Link as LinkIcon, ExternalLink } from "lucide-react";

interface GroundingMetadataProps {
  metadata: {
    searchEntryPoint?: {
      renderedContent?: string;
    };
    groundingChunks?: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
  };
}

export default function GroundingSources({ metadata }: GroundingMetadataProps) {
  if (!metadata || !metadata.groundingChunks || metadata.groundingChunks.length === 0) {
    return null;
  }

  // Filter chunks to keep unique URLs
  const uniqueSources = Array.from(
    new Map(
      metadata.groundingChunks
        .filter(chunk => chunk.web && chunk.web.uri && chunk.web.title)
        .map(chunk => [chunk.web!.uri, chunk.web!])
    ).values()
  );

  if (uniqueSources.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-5 bg-[#F5F4EF] border-2 border-[#1A1A1A] font-sans text-xs">
      <div className="flex items-center space-x-2 text-[#1A1A1A] font-bold mb-2.5">
        <span className="p-1.5 bg-[#1A1A1A] text-[#FDFCF8]">
          <Search className="w-3.5 h-3.5 text-[#D93B2B]" />
        </span>
        <span className="uppercase tracking-wider text-[11px] font-sans">Cited Statutory Sources ({uniqueSources.length})</span>
      </div>
      
      <p className="text-[11px] text-[#8C8C8C] mb-3 leading-relaxed font-serif">
        질문에 대한 가장 최신 법령 규정과 대법 판례를 Google Search Grounding 기술로 실시간 교차 검증한 공신력 있는 참조 원문 목록입니다.
      </p>

      <div className="flex flex-wrap gap-2">
        {uniqueSources.map((source, index) => (
          <a
            key={index}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 py-1.5 px-3 bg-[#FDFCF8] border border-[#1A1A1A] hover:bg-[#D93B2B] hover:text-[#FDFCF8] hover:border-[#D93B2B] text-[#1A1A1A] transition-all text-[11px] font-mono cursor-pointer"
          >
            <LinkIcon className="w-3 h-3 text-[#8C8C8C]" />
            <span className="max-w-[220px] truncate font-medium">{source.title}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
