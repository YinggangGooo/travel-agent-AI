import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { Message } from '../../contexts/ChatContext';
import WeatherCard from '../weather/WeatherCard';
import DestinationCard from '../destinations/DestinationCard';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const isGenerating = message.status === 'sending' && !isUser;
  const timeString = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          {isUser ? (
            <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center overflow-hidden">
              {/* User Avatar Placeholder */}
              <div className="w-full h-full bg-gradient-to-br from-neutral-400 to-neutral-600" />
            </div>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-2xl px-5 py-3.5 shadow-sm ${isUser
              ? 'bg-primary text-white rounded-tr-none'
              : 'bg-white dark:bg-[#1a1a1a] border border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-tl-none'
            }`}>
            {isGenerating && !message.content ? (
              <div className="flex items-center space-x-2 h-6">
                <span className="text-sm font-medium text-primary">Generating</span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                  {message.content || ' '}
                </p>
              </div>
            )}

            {/* Images */}
            {message.images && message.images.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`用户上传的图片 ${index + 1}`}
                    className="rounded-lg max-w-full h-auto border border-white/10"
                  />
                ))}
              </div>
            )}

            {/* Weather Data */}
            {message.weather && (
              <div className="mt-3">
                <WeatherCard weather={message.weather} compact />
              </div>
            )}

            {/* Destinations */}
            {message.destinations && message.destinations.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.destinations.map((destination) => (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          {/* Time & Status */}
          <div className={`mt-1.5 flex items-center space-x-2 text-[11px] text-neutral-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span>{timeString}</span>
            {isUser && message.status && (
              <span>
                {message.status === 'sending' && '• 发送中'}
                {message.status === 'sent' && '• 已发送'}
              </span>
            )}
            {isGenerating && !isUser && (
              <span className="flex items-center text-primary">
                • thinking...
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
