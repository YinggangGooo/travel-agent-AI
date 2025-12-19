import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Image as ImageIcon, MapPin, Cloud, Download } from 'lucide-react';
import { useChat, Message } from '../contexts/ChatContext';
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import WeatherCard from '../components/weather/WeatherCard';
import DestinationCard from '../components/destinations/DestinationCard';
import ImageUploader from '../components/features/ImageUploader';
import ExportModal from '../components/export/ExportModal';
import { conversationStarters } from '../data/mockData';

const ChatPage: React.FC = () => {
  const { currentChat, sendMessage, isTyping, createNewChat } = useChat();
  const [input, setInput] = useState('');
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages, isTyping]);

  useEffect(() => {
    // Create new chat if none exists
    if (!currentChat) {
      createNewChat();
    }
  }, [currentChat, createNewChat]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
      <div className="flex items-center justify-center h-screen">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">加载中...</p>
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
                欢迎使用旅行助手
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                我可以帮您规划旅行、查询天气、推荐景点。开始对话吧！
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
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/15">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-end space-x-3">
            {/* Text Input */}
            <div className="flex-1 relative bg-white/5 rounded-2xl border border-white/10 focus-within:border-primary/50 focus-within:bg-white/10 transition-all duration-200">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的旅行问题..."
                className="w-full px-4 py-3 bg-transparent resize-none rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none max-h-[200px] overflow-y-auto scrollbar-hide"
                rows={1}
                style={{ minHeight: '48px' }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 ${input.trim()
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'
                  : 'bg-white/10 text-neutral-400 cursor-not-allowed hidden'
                }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>


          {/* Image Uploader */}
          {showImageUploader && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <ImageUploader onImageSelect={(imageUrl) => {
                sendMessage('查看这张图片', [imageUrl]);
                setShowImageUploader(false);
              }} />
            </motion.div>
          )}
        </div>
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
