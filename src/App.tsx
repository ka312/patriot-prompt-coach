import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatWindow from "./components/ChatWindow";
import GoogleLogin from "./components/GoogleLogin";

interface ChatHistory {
  id: string;
  title: string;
  messages: Array<{ role: "user" | "assistant"; text: string }>;
  createdAt: number;
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Patriot Student");
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("patriot_chats");
    const savedLogin = localStorage.getItem("patriot_logged_in");
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (parsedChats.length > 0) {
        setCurrentChatId(parsedChats[0].id);
      }
    }
    if (savedLogin === "true") {
      setLoggedIn(true);
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("patriot_chats", JSON.stringify(chats));
    }
  }, [chats]);

  const createNewChat = () => {
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (id: string) => {
    const filtered = chats.filter((c) => c.id !== id);
    setChats(filtered);
    
    // Update localStorage immediately
    if (filtered.length === 0) {
      localStorage.removeItem("patriot_chats");
    } else {
      localStorage.setItem("patriot_chats", JSON.stringify(filtered));
    }
    
    if (currentChatId === id) {
      setCurrentChatId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const updateChatMessages = (id: string, messages: ChatHistory["messages"]) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === id) {
          // Auto-generate title from first user message
          const title =
            messages.find((m) => m.role === "user")?.text.slice(0, 50) ||
            "New Chat";
          return { ...chat, messages, title };
        }
        return chat;
      })
    );
  };

  const handleLogin = (name: string) => {
    setUserName(name);
    setLoggedIn(true);
    localStorage.setItem("patriot_logged_in", "true");
    // Create first chat on login
    const firstChat: ChatHistory = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
    };
    setChats([firstChat]);
    setCurrentChatId(firstChat.id);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.removeItem("patriot_logged_in");
  };

  const currentChat = chats.find((c) => c.id === currentChatId);

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-gradient-to-br from-green-900 via-green-700 to-yellow-600">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-patriotGold/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-40 w-96 h-96 bg-green-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 left-1/3 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            x: [0, 30, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content Wrapper with Glass Effect */}
      <div className="relative z-10 w-full flex flex-col items-center min-h-screen">
        {/* Top Navigation Bar */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full"
        >
          <div className="w-full max-w-6xl mx-auto px-6 py-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {loggedIn && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    >
                      <span className="text-white text-xl">☰</span>
                    </motion.button>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-white/30 rounded-xl blur-lg"></div>
                    <img
                      src="/gmu-logo.png"
                      alt="GMU"
                      className="relative w-12 h-12 rounded-xl shadow-lg"
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
                      Patriot Prompt Coach
                    </h1>
                    <p className="text-white/80 text-xs md:text-sm font-medium">
                      Powered by AI • Built for Patriots
                    </p>
                  </div>
                </div>
                {loggedIn && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
                  >
                    Logout
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mt-8 px-4"
        >
          <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-xl">
            <p className="text-white/90 text-lg font-medium">
              🎓 Master the art of prompting — Learn smarter, not harder
            </p>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <main className="w-full flex-1 flex px-6 py-8 gap-6 max-w-7xl">
          <AnimatePresence mode="wait">
            {!loggedIn ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="mt-16 w-full"
              >
                <GoogleLogin onLogin={handleLogin} />
              </motion.div>
            ) : (
              <>
                {/* Chat History Sidebar */}
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.div
                      key="sidebar"
                      initial={{ x: -300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -300, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-80 flex-shrink-0"
                    >
                      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-4 h-full overflow-hidden flex flex-col">
                        {/* New Chat Button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={createNewChat}
                          className="w-full bg-gradient-to-r from-patriotGold to-yellow-500 text-patriotGreen font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all mb-4 flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">+</span>
                          <span>New Chat</span>
                        </motion.button>

                        {/* Chat List */}
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {chats.length === 0 ? (
                            <p className="text-white/50 text-sm text-center py-4">
                              No chats yet
                            </p>
                          ) : (
                            chats.map((chat) => (
                              <motion.div
                                key={chat.id}
                                whileHover={{ scale: 1.02 }}
                                className={`p-3 rounded-xl cursor-pointer transition-all group ${
                                  currentChatId === chat.id
                                    ? "bg-white/20 border border-white/30"
                                    : "bg-white/5 hover:bg-white/10 border border-transparent"
                                }`}
                                onClick={() => setCurrentChatId(chat.id)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm truncate">
                                      {chat.title}
                                    </p>
                                    <p className="text-white/50 text-xs mt-1">
                                      {new Date(chat.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteChat(chat.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                                  >
                                    🗑️
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat Window */}
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex-1"
                >
                  {currentChat && currentChatId ? (
                    <ChatWindow
                      key={currentChatId}
                      userName={userName}
                      chatId={currentChatId}
                      initialMessages={currentChat.messages}
                      onMessagesChange={(messages) =>
                        updateChatMessages(currentChatId, messages)
                      }
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white/60">
                        <p className="text-xl mb-4">No chat selected</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={createNewChat}
                          className="bg-patriotGold text-patriotGreen px-6 py-3 rounded-xl font-semibold"
                        >
                          Start a New Chat
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="w-full text-center py-8 mt-auto"
        >
          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl inline-block border border-white/20 shadow-xl">
            <p className="text-white/90 text-sm font-medium">
              Built with 💚 for{" "}
              <span className="text-patriotGold font-bold">
                George Mason University
              </span>{" "}
              — Practice. Learn. Prompt.
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
