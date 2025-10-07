import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import MessageBubble from "./MessageBubble";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const API_BASE = "http://localhost:8787"; // our local server

interface ChatWindowProps {
  userName: string;
  chatId: string;
  initialMessages: Message[];
  onMessagesChange: (messages: Message[]) => void;
}

export default function ChatWindow({
  userName,
  chatId,
  initialMessages,
  onMessagesChange,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.length > 0
      ? initialMessages
      : [
          {
            role: "assistant",
            text: `👋 Hi ${userName}! I'll first rewrite your question to be clearer and explain why it helps.`,
          },
        ]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [recommendedQuestions, setRecommendedQuestions] = useState<string[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Sync messages with parent
  useEffect(() => {
    onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  // Reset state when chat changes
  useEffect(() => {
    const msgs: Message[] = initialMessages.length > 0
      ? initialMessages
      : [
          {
            role: "assistant" as const,
            text: `👋 Hi ${userName}! I'll first rewrite your question to be clearer and explain why it helps.`,
          },
        ];
    
    setMessages(msgs);
    setInput("");
    setLoading(false);
    setShowRecommendations(false);
    
    // Check if last message is asking for approval
    const lastMsg = msgs[msgs.length - 1];
    const isAskingApproval = lastMsg?.role === "assistant" && 
      lastMsg?.text.includes("Would you like me to generate the answer");
    
    if (isAskingApproval) {
      // Extract the rewritten question
      const reText = lastMsg.text;
      const m = /Rewritten:\s*([\s\S]*?)\n/i.exec(reText);
      const cleaned = m?.[1]?.trim() || reText.split('\n')[0];
      setAwaitingApproval(true);
      setPendingPrompt(cleaned);
    } else {
      // Ensure we reset approval state for new/normal chats
      setAwaitingApproval(false);
      setPendingPrompt("");
    }
  }, [chatId, initialMessages, userName]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Debounce recommendations
  useEffect(() => {
    if (awaitingApproval) return; // Don't show recommendations when awaiting approval
    
    const timer = setTimeout(() => {
      generateRecommendations(input);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [input, awaitingApproval]);

  // Build conversation context from last few messages
  const getConversationContext = () => {
    // Get last 6 messages (3 exchanges) for context
    const recentMessages = messages.slice(-6);
    return recentMessages.map(m => `${m.role}: ${m.text}`).join('\n');
  };

  const rewrite = async (question: string) => {
    const context = getConversationContext();
    const res = await fetch(`${API_BASE}/api/rewrite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Rewrite failed");
    return data.text as string;
  };

  const answer = async (rewritten: string) => {
    const context = getConversationContext();
    const res = await fetch(`${API_BASE}/api/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewritten, context }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Answer failed");
    return data.text as string;
  };

  const generateRecommendations = async (currentInput: string) => {
    if (!currentInput.trim() || currentInput.length < 3) {
      setRecommendedQuestions([]);
      setShowRecommendations(false);
      return;
    }

    try {
      const context = getConversationContext();
      const res = await fetch(`${API_BASE}/api/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: currentInput, context }),
      });
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setRecommendedQuestions(data.suggestions.slice(0, 3));
        setShowRecommendations(true);
      }
    } catch (e) {
      // Silently fail - recommendations are optional
      setShowRecommendations(false);
    }
  };

  const handleSend = async (question: string) => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const re = await rewrite(question);

      // Extract the "Rewritten:" line if present
      let cleaned = re.trim();
      const m = /Rewritten:\s*([\s\S]*?)\n/i.exec(re + "\n");
      if (m?.[1]) cleaned = m[1].trim();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `📝 ${re}\n\nWould you like me to generate the answer based on the rewritten question above? (yes/no)`,
        },
      ]);
      setAwaitingApproval(true);
      setPendingPrompt(cleaned);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `❌ Rewrite error: ${String(e?.message || e)}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (yes: boolean) => {
    setAwaitingApproval(false);
    setShowRecommendations(false);
    
    if (!yes) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "👍 No worries — ask another question anytime." },
      ]);
      return;
    }
    
    // Validate pending prompt exists
    if (!pendingPrompt || !pendingPrompt.trim()) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "❌ Error: No question to answer. Please ask a new question." },
      ]);
      return;
    }
    
    // Generate the answer
    setLoading(true);
    try {
      console.log("Generating answer for:", pendingPrompt);
      const ans = await answer(pendingPrompt);
      console.log("Received answer:", ans);
      
      if (!ans || ans.trim().length === 0) {
        throw new Error("Empty response from API");
      }
      
      setMessages((prev) => [...prev, { role: "assistant", text: ans }]);
      setPendingPrompt("");
    } catch (e: any) {
      console.error("Answer error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `❌ Answer error: ${String(e?.message || e)}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!input.trim()) return;
    
    // If awaiting approval, ignore typed input - only buttons work
    if (awaitingApproval) {
      return;
    }

    // Add user message and send
    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const questionText = input;
    setInput("");
    setShowRecommendations(false); // Hide recommendations when submitting
    await handleSend(questionText);
  };

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div
        ref={scrollerRef}
        className="w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 flex-1 overflow-y-auto space-y-4 transition-all"
      >
        {messages.map((msg, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <MessageBubble role={msg.role} text={msg.text} />
          </motion.div>
        ))}

        {loading && (
          <motion.div
            className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="w-3 h-3 bg-patriotGold rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="w-3 h-3 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-3 h-3 bg-white rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
            <span className="text-white/80 text-sm font-medium ml-2">
              Patriot is thinking...
            </span>
          </motion.div>
        )}
      </div>

      {/* Yes/No Approval Buttons - Outside scroll area */}
      {awaitingApproval && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, type: "spring" }}
          className="w-full flex gap-3 mt-4"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleApprove(true)}
            className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-patriotGreen to-green-600 text-white font-bold shadow-2xl hover:shadow-3xl transition-all text-lg border-2 border-green-400"
          >
            <span className="flex items-center justify-center gap-2">
              ✓ Yes — generate answer
            </span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleApprove(false)}
            className="flex-1 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold hover:bg-white/20 transition-all text-lg"
          >
            <span className="flex items-center justify-center gap-2">
              ✎ No — I'll refine it
            </span>
          </motion.button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 w-full"
      >
        <div className="flex w-full gap-3">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={awaitingApproval ? 'Use the buttons above to respond…' : "Ask your question…"}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              disabled={awaitingApproval}
              className={`w-full bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-patriotGold focus:border-transparent shadow-lg transition-all ${
                awaitingApproval ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>
          <motion.button
            whileHover={awaitingApproval ? {} : { scale: 1.05, y: -2 }}
            whileTap={awaitingApproval ? {} : { scale: 0.95 }}
            onClick={submit}
            disabled={awaitingApproval}
            className={`bg-gradient-to-r from-patriotGold to-yellow-500 hover:from-yellow-500 hover:to-patriotGold text-patriotGreen font-bold px-8 py-4 rounded-2xl shadow-xl transition-all flex items-center gap-2 ${
              awaitingApproval ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl'
            }`}
          >
            <span>Send</span>
            {!awaitingApproval && (
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ➤
              </motion.span>
            )}
          </motion.button>
        </div>

        {/* Recommended Questions */}
        {showRecommendations && recommendedQuestions.length > 0 && !awaitingApproval && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 space-y-2"
          >
            <p className="text-white/60 text-xs mb-2">💡 Suggested questions:</p>
            {recommendedQuestions.map((question, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setInput(question);
                  setShowRecommendations(false);
                }}
                className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white/90 text-sm transition-all"
              >
                <span className="mr-2">→</span>
                {question}
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
