import { motion } from "framer-motion";

// Format message text with better typography
function formatMessageText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Check for different formatting patterns
    const isBullet = /^[•\-\*]\s/.test(line);
    const isNumbered = /^\d+\.\s/.test(line);
    const isHeading = /^(Rewritten:|Why:|Question:|Answer:|Example:|Scenario:|Common Tags & Functions:)/i.test(line);
    const isCode = line.includes('`');
    
    // Helper function to format inline content (bold, italic, code)
    const formatInlineContent = (content: string) => {
      const parts: React.ReactNode[] = [];
      let remaining = content;
      let partKey = 0;
      
      while (remaining.length > 0) {
        // Check for **bold**
        const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
        if (boldMatch && boldMatch.index !== undefined) {
          // Add text before bold
          if (boldMatch.index > 0) {
            parts.push(remaining.substring(0, boldMatch.index));
          }
          // Add bold text
          parts.push(
            <strong key={`bold-${partKey++}`} className="font-extrabold text-patriotGold">
              {boldMatch[1]}
            </strong>
          );
          remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
          continue;
        }
        
        // Check for *italic*
        const italicMatch = remaining.match(/\*([^*]+)\*/);
        if (italicMatch && italicMatch.index !== undefined) {
          // Add text before italic
          if (italicMatch.index > 0) {
            parts.push(remaining.substring(0, italicMatch.index));
          }
          // Add italic text
          parts.push(
            <em key={`italic-${partKey++}`} className="italic text-green-200">
              {italicMatch[1]}
            </em>
          );
          remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
          continue;
        }
        
        // Check for `code`
        const codeMatch = remaining.match(/`([^`]+)`/);
        if (codeMatch && codeMatch.index !== undefined) {
          // Add text before code
          if (codeMatch.index > 0) {
            parts.push(remaining.substring(0, codeMatch.index));
          }
          // Add code text
          parts.push(
            <code key={`code-${partKey++}`} className="bg-black/40 px-2 py-1 rounded text-patriotGold font-mono text-sm border border-patriotGold/30">
              {codeMatch[1]}
            </code>
          );
          remaining = remaining.substring(codeMatch.index + codeMatch[0].length);
          continue;
        }
        
        // No more special formatting, add remaining text
        parts.push(remaining);
        break;
      }
      
      return parts.length > 0 ? parts : content;
    };
    
    if (isBullet || isNumbered) {
      const content = line.replace(/^[•\-\*]\s/, '').replace(/^\d+\.\s/, '');
      return (
        <div key={i} className="ml-4 my-2 flex gap-3">
          <span className="text-patriotGold font-bold text-lg">•</span>
          <div className="flex-1 leading-relaxed">{formatInlineContent(content)}</div>
        </div>
      );
    }
    
    if (isHeading) {
      const colonIndex = line.indexOf(':');
      const headingPart = line.substring(0, colonIndex);
      const contentPart = line.substring(colonIndex + 1);
      return (
        <div key={i} className="my-4">
          <span className="font-black text-patriotGold text-xl">{headingPart}:</span>
          {contentPart && <span className="ml-2">{formatInlineContent(contentPart)}</span>}
        </div>
      );
    }
    
    // Regular line with potential inline formatting
    if (line.trim()) {
      return <div key={i} className="my-2 leading-relaxed">{formatInlineContent(line)}</div>;
    }
    
    // Empty line
    return <div key={i} className="h-2" />;
  });
}

export default function MessageBubble({
    role,
    text,
  }: {
    role: "user" | "assistant";
    text: string;
  }) {
    const isUser = role === "user";
    const formattedText = formatMessageText(text);
    
    return (
      <motion.div
        initial={{ opacity: 0, x: isUser ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-6 rounded-2xl max-w-[90%] leading-relaxed shadow-xl backdrop-blur-sm border-2 ${
          isUser
            ? "bg-gradient-to-br from-patriotGold/40 to-yellow-500/30 text-white border-patriotGold/40 ml-auto"
            : "bg-gradient-to-br from-white/20 to-white/10 text-white border-white/30 self-start"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-white/30">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <span className="font-bold text-lg text-white">Patriot Coach</span>
              <div className="text-xs text-white/60">AI Teaching Assistant</div>
            </div>
          </div>
        )}
        {isUser && (
          <div className="flex items-center justify-end gap-3 mb-4 pb-3 border-b-2 border-patriotGold/40">
            <div>
              <span className="font-bold text-lg text-white">You</span>
              <div className="text-xs text-white/60 text-right">Student</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-patriotGold rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">👤</span>
            </div>
          </div>
        )}
        <div className={`text-base md:text-lg font-normal ${isUser ? 'text-white' : 'text-white/95'}`}>
          {formattedText}
        </div>
      </motion.div>
    );
  }
  