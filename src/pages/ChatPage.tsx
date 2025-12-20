import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, MapPin, Download, ArrowUp, Square, MessageSquarePlus } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import ImageUploader from '../components/features/ImageUploader';
import ExportModal from '../components/export/ExportModal';
import { conversationStarters } from '../data/mockData';

const ChatPage: React.FC = () => {
  const { currentChat, sendMessage, isTyping, createNewChat, stopGeneration } = useChat();
  const [input, setInput] = useState('');
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages, isTyping]);

  // Removed auto-creation effect to allow empty state

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  if (!currentChat) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <div className="glass-card p-10 rounded-3xl max-w-md w-full shadow-xl animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <ImageIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
            欢迎回来
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
            我是您的 AI 旅行助手。我可以帮您规划行程、查询天气、推荐景点。让我们开始一个新的旅程吧！
          </p>
          <button
            onClick={() => createNewChat()}
            className="w-full btn-primary py-4 rounded-xl flex items-center justify-center space-x-2 text-lg font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span>开始新对话</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {currentChat.messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="glass-card p-8 rounded-2xl max-w-md">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
                新对话
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                有什么我可以帮您的吗？试试问我：
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {conversationStarters.slice(0, 3).map((starter, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(starter)}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors"
                  >
                    {starter.length > 12 ? starter.substring(0, 12) + '...' : starter}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {currentChat.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/15">
        <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-800 rounded-[26px] p-2 pr-2 shadow-sm border border-neutral-200 dark:border-white/10 focus-within:shadow-md transition-all duration-300 flex items-end">

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的旅行问题..."
            className="flex-1 bg-transparent px-4 py-3 min-h-[44px] max-h-[200px] resize-none text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none scrollbar-hide"
            rows={1}
          />

          {isTyping ? (
            <button
              onClick={stopGeneration}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mb-1 mr-1 transition-all duration-200 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:scale-105 active:scale-95 shadow-md"
              title="停止生成"
            >
              <Square className="w-4 h-4 fill-current" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mb-1 mr-1 transition-all duration-200 ${input.trim()
                ? 'bg-primary text-white hover:scale-105 active:scale-95 shadow-md'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                }`}
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Caption */}
        <div className="text-center mt-3">
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
            AI 可能产生错误信息，请核对重要事实
          </p>
        </div>

        {/* Hidden Image Uploader Logic (Preserved but UI hidden as per request to simplify) */}
        {showImageUploader && (
          <div className="hidden">
            <ImageUploader onImageSelect={(imageUrl) => {
              sendMessage('查看这张图片', [imageUrl]);
              setShowImageUploader(false);
            }} />
          </div>
        )}
      </div>

      {/* Export Button - Fixed position when there are messages */}
      {currentChat.messages.length > 0 && (
        <div className="fixed bottom-20 right-6 z-40">
          <button
            onClick={() => setShowExportModal(true)}
            className="p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            title="导出对话"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        chat={currentChat}
      />
    </div>
  );
};

export default ChatPage;
