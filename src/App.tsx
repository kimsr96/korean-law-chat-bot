import React, { useState, useRef, useEffect } from "react";
import { Message } from "./types";
import { Scale, ArrowUp, Loader2, Search, BookOpen, LogOut, LogIn } from "lucide-react";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { collection, doc, addDoc, updateDoc, query, where, orderBy, onSnapshot, serverTimestamp, limit, getDocs } from "firebase/firestore";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setSessionId(null);
        setMessages([]);
        setAuthChecking(false);
      } else {
        try {
          const q = query(collection(db, "sessions"), where("userId", "==", currentUser.uid), orderBy("updatedAt", "desc"), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setSessionId(snap.docs[0].id);
          } else {
            // Wait for user to send first message to create a session
            setSessionId(null);
            setMessages([]);
          }
        } catch (error) {
          console.error("Failed to fetch sessions", error);
        } finally {
          setAuthChecking(false);
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const messagesRef = collection(db, "sessions", sessionId, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role,
          content: data.content,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as Message[];
      setMessages(msgs);
    }, (error) => {
      console.error("Firestore loading messages failed:", error);
    });

    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Google sign in failed:", e);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  };

  const handleSendMessage = async (rawText: string) => {
    if (!rawText.trim() || isGenerating) return;

    const userText = rawText.trim();
    let currentSessionId = sessionId;

    setInputValue("");
    setIsGenerating(true);

    // Optimistic UI update
    const tempUserMsg: Message = { role: "user", content: userText, createdAt: new Date() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      if (user) {
        if (!currentSessionId) {
          // Create session
          const sessionPayload = {
            title: "법률 상담",
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          const docRef = await addDoc(collection(db, "sessions"), sessionPayload);
          currentSessionId = docRef.id;
          setSessionId(currentSessionId);
        }
        
        // Save user message to Firebase
        await addDoc(collection(db, "sessions", currentSessionId, "messages"), {
          role: "user",
          content: userText,
          createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, "sessions", currentSessionId), {
          updatedAt: serverTimestamp()
        });
      }

      // Fetch AI response
      const dialogueHistory = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userText }
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: dialogueHistory })
      });

      if (!response.ok) {
        throw new Error("서버 응답 오류가 발생했습니다.");
      }

      const replyData = await response.json();
      const aiContent = replyData.content;

      if (user && currentSessionId) {
        // Save AI message
        await addDoc(collection(db, "sessions", currentSessionId, "messages"), {
          role: "model",
          content: aiContent,
          createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, "sessions", currentSessionId), {
          updatedAt: serverTimestamp()
        });
      } else {
        // Just update local state if not logged in
        setMessages(prev => [...prev, { role: "model", content: aiContent, createdAt: new Date() }]);
      }
    } catch (e: any) {
      console.error("Failed to generate law response:", e);
      const errorMsgContent = `⚠️ 오류가 발생했습니다: ${e?.message || "지연"}`;
      
      if (user && currentSessionId) {
        await addDoc(collection(db, "sessions", currentSessionId, "messages"), {
          role: "model",
          content: errorMsgContent,
          createdAt: serverTimestamp()
        });
      } else {
        setMessages(prev => [...prev, { role: "model", content: errorMsgContent, createdAt: new Date() }]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (authChecking) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#FDFCF8] text-[#1A1A1A] font-serif">
        <Loader2 className="w-8 h-8 animate-spin text-[#D93B2B]" />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#FDFCF8] text-[#1A1A1A] font-serif overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] bg-white">
        <div className="flex items-center space-x-3 text-[#1A1A1A]">
          <div className="p-1.5 bg-[#1A1A1A] text-[#FDFCF8]">
            <Scale className="w-5 h-5 text-[#D93B2B]" />
          </div>
          <div>
            <h1 className="font-extrabold italic text-lg tracking-tight uppercase leading-none">국가법령 Q&A</h1>
            <p className="text-[10px] font-sans text-[#8C8C8C] tracking-widest uppercase mt-1">open.law.go.kr API 연동</p>
          </div>
        </div>
        <div>
          {user ? (
            <button onClick={handleSignOut} className="flex items-center space-x-2 text-sm font-sans text-[#8C8C8C] hover:text-[#1A1A1A] transition-colors">
              <span>{user.displayName}</span>
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSignIn} className="flex items-center space-x-2 text-sm font-sans font-medium text-[#1A1A1A] bg-[#F5F4EF] px-3 py-1.5 rounded-sm hover:bg-[#EBE3C5] transition-colors">
              <LogIn className="w-4 h-4 text-[#D93B2B]" />
              <span>로그인하여 저장하기</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-4xl mx-auto w-full pb-32">
          {messages.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-[#F5F4EF] rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-[#D93B2B]" />
              </div>
              <h2 className="text-2xl mb-3 font-medium">어떤 법률/판례가 궁금하신가요?</h2>
              <p className="text-[#666666] max-w-md font-sans text-sm leading-relaxed">
                국가법령정보센터(open.law.go.kr)에 등록된 공식 법령, 판례, 행정규칙 기반으로 답변해 드립니다.
              </p>
              {!user && (
                 <p className="text-[#D93B2B] text-xs font-sans mt-4 font-bold bg-[#FDFBF2] px-3 py-2 border border-[#EBE3C5]">
                   진행 상황을 저장하려면 우측 상단의 로그인을 진행해주세요.
                 </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id || index} 
                  className={`py-8 px-6 sm:px-12 border-b border-[#E5E5E5] ${
                    msg.role === "user" ? "bg-white" : "bg-[#FDFBF2]"
                  }`}
                >
                  <div className="max-w-3xl mx-auto flex space-x-4 sm:space-x-6">
                    {/* Role Avatar */}
                    <div className="flex-shrink-0 pt-1">
                      {msg.role === "user" ? (
                        <div className="w-8 h-8 bg-[#1A1A1A] rounded-sm flex items-center justify-center text-white font-sans text-xs font-bold uppercase">
                          나
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-[#D93B2B] rounded-sm flex items-center justify-center text-white">
                          <Scale className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="font-sans text-xs font-bold text-[#8C8C8C] mb-2 uppercase tracking-wider flex items-center justify-between">
                        <span>{msg.role === "user" ? "질문" : "국가법령 연동 답변"}</span>
                      </div>
                      <div className="prose prose-sm max-w-none text-[#1A1A1A] font-sans leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="py-8 px-6 sm:px-12 bg-[#FDFBF2] border-b border-[#E5E5E5]">
                  <div className="max-w-3xl mx-auto flex space-x-4 sm:space-x-6">
                    <div className="flex-shrink-0 pt-1">
                      <div className="w-8 h-8 bg-[#D93B2B] rounded-sm flex items-center justify-center text-white">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-2">
                      <p className="text-[#666666] font-sans text-sm animate-pulse flex items-center">
                        국가법령 및 관련 판례를 검색하고 분석 중입니다...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto relative">
          <div className="relative flex items-end shadow-xl border border-[#D1D1D1] bg-white transition-all focus-within:border-[#1A1A1A]">
            <textarea
              className="flex-1 bg-transparent border-0 resize-none max-h-48 min-h-[56px] py-4 pl-5 pr-14 focus:ring-0 text-sm font-sans placeholder:text-[#999999]"
              placeholder="궁금한 법률 내용을 입력하세요 (예: 전세금 반환을 받지 못하고 있는데 어떻게 해야 하나요?)"
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                  e.currentTarget.style.height = 'auto';
                }
              }}
            />
            <div className="absolute right-3 bottom-3 flex space-x-2">
              <button
                onClick={() => {
                  handleSendMessage(inputValue);
                  const textarea = document.querySelector('textarea');
                  if (textarea) textarea.style.height = 'auto';
                }}
                disabled={!inputValue.trim() || isGenerating}
                className="w-8 h-8 flex items-center justify-center bg-[#1A1A1A] text-white disabled:bg-[#CCCCCC] disabled:text-[#888888] disabled:cursor-not-allowed transition-colors"
                title="메시지 전송"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="text-center mt-3 text-xs text-[#888888] font-sans">
            AI의 답변은 open.law.go.kr 데이터를 기반으로 하며, 법적 책임의 근거로 사용될 수 없습니다.
          </div>
        </div>
      </div>
    </div>
  );
}

