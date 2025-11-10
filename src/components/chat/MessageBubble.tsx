import React from 'react';
import { motion } from 'framer-motion';
import { Message } from '../../contexts/ChatContext';
import WeatherCard from '../weather/WeatherCard';
import DestinationCard from '../destinations/DestinationCard';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const timeString = message.timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar for AI messages */}
        {!isUser && (
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
        )}

        {/* Message Content */}
        <div className={`rounded-2xl p-4 ${
          isUser 
            ? 'message-user text-white ml-auto' 
            : 'message-ai text-neutral-900 dark:text-white'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Images */}
          {message.images && message.images.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`用户上传的图片 ${index + 1}`}
                  className="rounded-lg max-w-full h-auto"
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

          {/* Message Status */}
          {isUser && message.status && (
            <div className="mt-2 flex justify-end">
              <span className="text-xs opacity-70">
                {timeString}
                {message.status === 'sending' && ' · 发送中...'}
                {message.status === 'sent' && ' · 已发送'}
                {message.status === 'read' && ' · 已读'}
              </span>
            </div>
          )}
        </div>

        {/* Time for AI messages */}
        {!isUser && (
          <div className="mt-1 text-center">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {timeString}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
