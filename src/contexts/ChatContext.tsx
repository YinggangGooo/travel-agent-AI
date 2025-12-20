import React, { createContext, useContext, useState, useEffect } from 'react';
import { WeatherService, CurrencyService, TimezoneService, DestinationsService, AIService } from '../services/api';
import { useAuth } from './AuthContext';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  images?: string[];
  weather?: WeatherData;
  destinations?: Destination[];
  status?: 'sending' | 'sent' | 'read';
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
  }>;
}

export interface Destination {
  id: string;
  name: string;
  description: string;
  rating: number;
  images: string[];
  location: {
    lat: number;
    lng: number;
  };
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  tags: string[];
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  isTyping: boolean;
  createNewChat: () => string;
  selectChat: (chatId: string) => void;
  sendMessage: (content: string, images?: string[]) => void;
  toggleFavorite: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void; // Added renameChat
  stopGeneration: () => void;
  searchChats: (query: string) => Chat[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Helper to safely update a specific chat by ID
  const updateChatById = (chatId: string, updater: (chat: Chat) => Chat) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId ? updater(chat) : chat
      )
    );
    // Also update currentChat if it matches
    setCurrentChat(prev => (prev?.id === chatId ? updater(prev) : prev));
  };

  const createNewChat = (): string => {
    const newChat: Chat = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isFavorite: false,
      tags: [],
    };

    setChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    return newChat.id;
  };

  const selectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      // Reset typing state if switching chats
      setIsTyping(false);
      abortControllerRef.current?.abort();
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsTyping(false);
    }
  };

  const sendMessage = async (content: string, images?: string[]) => {
    // 1. Ensure we have a chat
    let targetChatId = currentChat?.id;
    if (!targetChatId) {
      targetChatId = createNewChat();
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content,
      timestamp: new Date(),
      images,
      status: 'sending',
    };

    // 2. Add User Message
    updateChatById(targetChatId!, chat => ({
      ...chat,
      messages: [...chat.messages, userMessage],
      updatedAt: new Date(),
    }));

    setIsTyping(true);

    // Initialize AbortController
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // 3. Create Placeholder AI Message
      const aiMessageId = `ai-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const placeholderMessage: Message = {
        id: aiMessageId,
        type: 'ai',
        content: '', // Start empty
        timestamp: new Date(),
        status: 'sending', // generating state
      };

      updateChatById(targetChatId!, chat => ({
        ...chat,
        messages: [...chat.messages, placeholderMessage],
        updatedAt: new Date(),
      }));

      // 4. Prepare Context
      const activeChat = chats.find(c => c.id === targetChatId) || currentChat;
      const conversationHistory = activeChat?.messages.slice(-10).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })) || [];

      const context = {
        userId: user?.id,
        history: conversationHistory
      };

      let streamedContent = '';

      // 5. Call AI (Streaming) - Targeting specific ChatID
      await AIService.generateResponse(
        content,
        context,
        true,
        (chunk: string) => {
          streamedContent += chunk;

          updateChatById(targetChatId!, chat => {
            // Only update title for the first few chunks of the FIRST message
            const shouldUpdateTitle = chat.messages.length <= 2 && streamedContent.length > 5 && streamedContent.length < 50;

            return {
              ...chat,
              messages: chat.messages.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: streamedContent, status: 'sending' as const }
                  : msg
              ),
              // Auto-title update (simple version)
              title: shouldUpdateTitle ? (content.substring(0, 15) + (content.length > 15 ? '...' : '')) : chat.title
            };
          });
        },
        abortControllerRef.current.signal
      );

      // 6. Check for Special Queries (Weather, etc) WITHOUT calling LLM again
      // Only check simple regex tools that don't need another API call
      const specialData = await checkLocalTools(content); // Renamed helper

      updateChatById(targetChatId!, chat => ({
        ...chat,
        messages: chat.messages.map(msg =>
          msg.id === aiMessageId
            ? {
              ...msg,
              content: streamedContent, // Ensure final content is set
              status: 'sent',
              weather: specialData?.weather,
              destinations: specialData?.destinations
            }
            : msg
        )
      }));

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Handle abort gracefully
        updateChatById(targetChatId!, chat => ({
          ...chat,
          messages: chat.messages.map(msg =>
            msg.type === 'ai' && msg.content === ''
              ? { ...msg, content: '已停止生成。', status: 'sent' } // Or separate 'interrupted' status
              : msg
          )
        }));
        return;
      }

      console.error('Error generating AI response:', error);
      // Add error message to specific chat
      const fallbackMessage: Message = {
        id: `err-${Date.now()}`,
        type: 'ai',
        content: '抱歉，遇到了一些连接问题。请稍后再试。',
        timestamp: new Date(),
        status: 'sent',
      };
      updateChatById(targetChatId!, chat => ({
        ...chat,
        messages: [...chat.messages, fallbackMessage]
      }));
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const toggleFavorite = (chatId: string) => {
    updateChatById(chatId, chat => ({ ...chat, isFavorite: !chat.isFavorite }));
  };

  const deleteChat = (chatId: string) => {
    // Stop any active generation if deleting current chat
    if (currentChat?.id === chatId) {
      stopGeneration();
    }

    const newChats = chats.filter(chat => chat.id !== chatId);
    setChats(newChats);

    // If we deleted the current chat, decide what to select next
    if (currentChat?.id === chatId) {
      // Don't auto-create here. Just set to null.
      // ChatPage will handle the empty state.
      setCurrentChat(null);
    }
  };

  const renameChat = (chatId: string, newTitle: string) => {
    updateChatById(chatId, chat => ({ ...chat, title: newTitle }));
  };

  const searchChats = (query: string): Chat[] => {
    if (!query.trim()) return chats;
    return chats.filter(chat =>
      chat.title.toLowerCase().includes(query.toLowerCase()) ||
      chat.messages.some(msg => msg.content.toLowerCase().includes(query.toLowerCase()))
    );
  };

  // Persistence logic (Keep existing useEffects)
  useEffect(() => {
    try {
      const savedChats = localStorage.getItem('travelAgent_chats');
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChats(parsedChats);
      }
    } catch (error) { console.error(error); }
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('travelAgent_chats', JSON.stringify(chats));
    }
  }, [chats]);

  return (
    <ChatContext.Provider value={{
      chats,
      currentChat,
      isTyping,
      createNewChat,
      selectChat,
      sendMessage,
      toggleFavorite,
      deleteChat,
      renameChat,
      stopGeneration,
      searchChats: (query) => chats.filter(c => c.title.includes(query) || c.messages.some(m => m.content.includes(query)))
    }}>
      {children}
    </ChatContext.Provider>
  );
};

// Simplified local tools checker (No extra LLM call)
const checkLocalTools = async (userMessage: string) => {
  const message = userMessage.toLowerCase();

  // Weather
  const weatherMatch = message.match(/(.*城市.*天气|.*天气.*查询|.*下雨.*|.*晴天.*|.*今天.*天气|明天.*天气)/);
  if (weatherMatch) {
    const cityMatch = userMessage.match(/(?:北京|上海|广州|深圳|杭州|南京|武汉|成都|西安|重庆|天津|青岛|大连|厦门|昆明|贵阳|拉萨|银川|西宁|乌鲁木齐|呼和浩特|南宁|海口|福州|合肥|南昌|郑州|太原|长春|沈阳|哈尔滨|石家庄|济南|兰州|合肥)/) || userMessage.match(/for (\w+)/);
    if (cityMatch) {
      const city = cityMatch[0].replace('for ', '');
      const weather = await WeatherService.getCurrentWeather(city);
      if (weather) return { weather };
    }
  }

  // Destinations
  const travelMatch = message.match(/(推荐.*地方|旅行.*建议|去.*旅行|旅游.*推荐|热门.*目的地|周末.*游|短途.*游)/);
  if (travelMatch) {
    const destinations = await DestinationsService.searchDestinations('');
    if (destinations) return { destinations: destinations.slice(0, 3) };
  }

  return null;
};


// Legacy function for backwards compatibility
const generateAIResponse = (userMessage: string): string => {
  const responses = [
    "我来帮您规划这次旅行！根据您的需求，我推荐几个不错的目的地。",
    "这是一个很棒的想法！让我为您搜索最新的旅行信息和天气情况。",
    "我理解您的需求。这里有一些相关的旅行建议和实用信息。",
    "根据您的偏好，我为您准备了详细的行程规划。",
    "让我为您推荐一些适合的目的地和活动安排。",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};
