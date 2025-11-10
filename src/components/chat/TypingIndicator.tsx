import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="max-w-[70%]">
        {/* AI Avatar */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <img 
              src="/images/ai_avatar_3.jpg" 
              alt="AI助手" 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            旅行助手
          </span>
        </div>

        {/* Typing Animation */}
        <div className="message-ai text-neutral-900 dark:text-white p-4 rounded-2xl rounded-bl-sm">
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
              正在思考...
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
