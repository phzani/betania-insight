import React from "react";
import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
}

interface ChatMessageProps {
  message: Message;
  className?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, className }) => {
  const isUser = message.type === 'user';
  
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row", className)}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser 
          ? "bg-gradient-to-br from-slate-600 to-slate-800" 
          : "bg-gradient-to-br from-pink-500 via-purple-600 to-blue-500"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Bubble */}
      <div className={cn(
        "max-w-[70%] rounded-2xl p-4",
        isUser 
          ? "bg-blue-500/20 text-blue-100 ml-auto" 
          : "betania-glass"
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        
        <div className={cn(
          "text-xs mt-2 opacity-60",
          isUser ? "text-right" : "text-left"
        )}>
          {message.timestamp.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};