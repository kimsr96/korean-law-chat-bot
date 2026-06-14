import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Scale, 
  Plus, 
  MessageSquare, 
  Trash2, 
  User, 
  LogOut, 
  LogIn, 
  Edit,
  Check,
  X,
  BookOpen
} from "lucide-react";
import { Session } from "../types";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  user: any;
  onSignIn: () => void;
  onSignOut: () => void;
  loadingHistory: boolean;
  onOpenLawSearch: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  user,
  onSignIn,
  onSignOut,
  loadingHistory,
  onOpenLawSearch
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleStartRename = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setEditingId(session.id);
    setRenameValue(session.title);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (renameValue.trim()) {
      onRenameSession(id, renameValue.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <aside className="w-80 h-full border-r border-[#1A1A1A] bg-[#F5F4EF] flex flex-col flex-shrink-0 text-[#1A1A1A] font-sans">
      {/* App Branding Header */}
      <div className="p-5 bg-[#1A1A1A] text-[#FDFCF8] border-b border-[#1A1A1A] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-[#D93B2B] text-white">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold uppercase tracking-[0.2em] text-xs leading-none mb-1">K-LAW REPOSITORY</h1>
            <span className="text-[9px] font-mono opacity-80 block uppercase leading-none">Database v4.1</span>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="p-4 border-b border-[#E5E5E1] space-y-2">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#1A1A1A] hover:bg-[#D93B2B] text-[#FDFCF8] text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>NEW CONSULTATION</span>
        </button>
        <button
          onClick={onOpenLawSearch}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-white hover:bg-[#F5F4EF] text-[#D93B2B] border-2 border-[#1A1A1A] text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>국가법령 통합검색</span>
        </button>
      </div>

      {/* History List Section */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <div className="px-1 py-1.5 flex items-center justify-between border-b border-[#E5E5E1] pb-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8C8C8C]">Recent Inquiries</span>
          {user && <span className="text-[10px] bg-[#1A1A1A] text-[#FDFCF8] px-1.5 py-0.5 font-bold">{sessions.length}</span>}
        </div>

        {!user ? (
          <div className="p-5 text-center border border-[#1A1A1A] bg-[#FDFCF8] mt-2">
            <p className="text-xs text-slate-700 leading-relaxed font-serif mb-4">
              Google 계정으로 로그인하시면 나만의 법률 대화 기록을 안전하게 Firebase에 저장하고 언제든 이어할 수 있습니다.
            </p>
            <button
              onClick={onSignIn}
              className="inline-flex items-center space-x-1.5 py-2 px-3 bg-[#1A1A1A] hover:bg-[#D93B2B] text-xs font-bold text-[#FDFCF8] uppercase tracking-widest transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google 로그인</span>
            </button>
          </div>
        ) : loadingHistory ? (
          <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
            <div className="w-4 h-4 border border-[#1A1A1A] border-t-transparent animate-spin"></div>
            <span className="font-mono text-[10px] uppercase">Retrieving Archive...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-5 text-center mt-2 border border-dashed border-[#1A1A1A]/30 text-slate-400 flex flex-col items-center space-y-1">
            <BookOpen className="w-6 h-6 opacity-40 mb-1 text-[#1A1A1A]" />
            <p className="text-xs leading-normal font-serif text-[#1A1A1A]/60">보관된 상담 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto">
            <AnimatePresence initial={false}>
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isEditing = editingId === session.id;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    onClick={() => !isEditing && onSelectSession(session.id)}
                    className={`group relative flex items-center justify-between p-2.5 border-b border-[#E5E5E1] text-sm cursor-pointer transition-all ${
                      isActive 
                        ? "bg-[#1A1A1A] text-[#FDFCF8] font-semibold" 
                        : "hover:bg-[#E5E5E1]/55 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-6">
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-[#D93B2B]" : "text-slate-400"}`} />
                      
                      {isEditing ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(e as any, session.id);
                            if (e.key === "Escape") handleCancelRename(e as any);
                          }}
                          className="bg-white border border-[#1A1A1A] text-slate-900 py-0.5 px-1.5 text-xs w-full focus:outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate block font-serif text-xs leading-snug">{session.title}</span>
                      )}
                    </div>

                    {/* Desktop Hover Controls */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <>
                          <button
                            onClick={(e) => handleSaveRename(e, session.id)}
                            className="p-1 hover:bg-[#D93B2B] hover:text-white text-green-600 rounded cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 hover:bg-[#D93B2B] hover:text-white text-slate-500 rounded cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => handleStartRename(e, session)}
                            className={`p-1 transition-colors rounded cursor-pointer ${isActive ? "text-[#FDFCF8] hover:bg-[#E5E5E1]/20" : "text-slate-500 hover:bg-[#1A1A1A]/10"}`}
                            title="이름 변경"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            className={`p-1 transition-colors rounded cursor-pointer ${isActive ? "text-[#D93B2B] hover:bg-[#E5E5E1]/20" : "text-slate-400 hover:text-[#D93B2B] hover:bg-[#1A1A1A]/10"}`}
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* User Session Footer */}
      <div className="p-4 border-t border-[#1A1A1A] bg-[#F5F4EF] flex flex-col space-y-2">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-none border border-[#1A1A1A]"
                />
              ) : (
                <div className="w-8 h-8 bg-[#1A1A1A] text-[#FDFCF8] flex items-center justify-center font-bold text-xs border border-[#1A1A1A]">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1A1A1A] truncate leading-none mb-1 font-sans">
                  {user.displayName || "상담 회원"}
                </p>
                <p className="text-[9px] text-[#8C8C8C] truncate leading-none font-mono">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="p-1.5 text-slate-600 hover:text-[#D93B2B] hover:bg-[#E5E5E1] transition-colors cursor-pointer"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#1A1A1A] hover:bg-[#D93B2B] text-[#FDFCF8] text-xs font-bold uppercase tracking-wider transition-all focus:outline-none cursor-pointer"
          >
            <User className="w-4 h-4 text-[#D93B2B]" />
            <span>Google ACCOUNT LOGIN</span>
          </button>
        )}
      </div>
    </aside>
  );
}
