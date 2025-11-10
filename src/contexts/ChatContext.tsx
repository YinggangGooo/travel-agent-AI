import React, { createContext, useContext, useState, useEffect } from 'react';
import { WeatherService, CurrencyService, TimezoneService, DestinationsService, AIService } from '../services/api';

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
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const createNewChat = (): string => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
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
    }
  };

  const sendMessage = async (content: string, images?: string[]) => {
    if (!currentChat) {
      createNewChat();
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date(),
      images,
      status: 'sending',
    };

    // Update current chat
    setCurrentChat(prev => {
      if (!prev) return null;
      const updatedChat = {
        ...prev,
        messages: [...prev.messages, userMessage],
        updatedAt: new Date(),
      };
      
      // Update chats list
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === prev.id ? updatedChat : chat
        )
      );
      
      return updatedChat;
    });

    // Set typing indicator
    setIsTyping(true);

    try {
      // Create a placeholder AI message for streaming
      const aiMessageId = `ai-msg-${Date.now()}`;
      let streamedContent = '';

      const placeholderMessage: Message = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
        status: 'sending',
      };

      // Add placeholder message
      setCurrentChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, placeholderMessage],
          updatedAt: new Date(),
        };
      });

      // Generate AI response with streaming
      await AIService.generateResponse(
        content,
        undefined,
        true, // Enable streaming
        (chunk: string) => {
          // Update message content as chunks arrive
          streamedContent += chunk;
          
          setCurrentChat(prev => {
            if (!prev) return null;
            const updatedMessages = prev.messages.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, content: streamedContent, status: 'sent' as const }
                : msg
            );
            
            const updatedChat = {
              ...prev,
              messages: updatedMessages,
              updatedAt: new Date(),
              title: prev.messages.length <= 1 ? content.substring(0, 30) + (content.length > 30 ? '...' : '') : prev.title,
            };
            
            setChats(prevChats => 
              prevChats.map(chat => 
                chat.id === prev.id ? updatedChat : chat
              )
            );
            
            return updatedChat;
          });
        }
      );

      // Check if message needs weather or destination data
      const aiResponse = await generateSmartResponse(content);
      
      if (aiResponse.weather || aiResponse.destinations) {
        // Update with additional data
        setCurrentChat(prev => {
          if (!prev) return null;
          const updatedMessages = prev.messages.map(msg =>
            msg.id === aiMessageId
              ? { 
                  ...msg, 
                  weather: aiResponse.weather,
                  destinations: aiResponse.destinations,
                  status: 'sent' as const 
                }
              : msg
          );
          
          const updatedChat = {
            ...prev,
            messages: updatedMessages,
            updatedAt: new Date(),
          };
          
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === prev.id ? updatedChat : chat
            )
          );
          
          return updatedChat;
        });
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: `ai-msg-${Date.now()}`,
        type: 'ai',
        content: '抱歉，我现在遇到了一些技术问题。请稍后再试，或重新描述您的问题。',
        timestamp: new Date(),
        status: 'sent',
      };

      setCurrentChat(prev => {
        if (!prev) return null;
        const updatedChat = {
          ...prev,
          messages: [...prev.messages, fallbackMessage],
          updatedAt: new Date(),
        };
        
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === prev.id ? updatedChat : chat
          )
        );
        
        return updatedChat;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const toggleFavorite = (chatId: string) => {
    setChats(prev => 
      prev.map(chat => 
        chat.id === chatId ? { ...chat, isFavorite: !chat.isFavorite } : chat
      )
    );
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
    }
  };

  // Load saved chats from localStorage
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
    } catch (error) {
      console.error('Failed to load saved chats:', error);
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      try {
        localStorage.setItem('travelAgent_chats', JSON.stringify(chats));
      } catch (error) {
        console.error('Failed to save chats:', error);
      }
    }
  }, [chats]);

  const searchChats = (query: string): Chat[] => {
    if (!query.trim()) return chats;
    
    return chats.filter(chat => 
      chat.title.toLowerCase().includes(query.toLowerCase()) ||
      chat.messages.some(msg => msg.content.toLowerCase().includes(query.toLowerCase()))
    );
  };

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
      searchChats,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

// Smart response generator with real API integration
const generateSmartResponse = async (userMessage: string) => {
  const message = userMessage.toLowerCase();
  
  // Weather queries
  const weatherMatch = message.match(/(.*城市.*天气|.*天气.*查询|.*下雨.*|.*晴天.*|.*今天.*天气|明天.*天气)/);
  if (weatherMatch) {
    const cityMatch = userMessage.match(/(?:北京|上海|广州|深圳|杭州|南京|武汉|成都|西安|重庆|天津|青岛|大连|厦门|昆明|贵阳|拉萨|银川|西宁|乌鲁木齐|呼和浩特|南宁|海口|福州|合肥|南昌|郑州|太原|长春|沈阳|哈尔滨|石家庄|济南|兰州|合肥)/) || userMessage.match(/for (\w+)/);
    
    if (cityMatch) {
      const city = cityMatch[0].replace('for ', '');
      const weather = await WeatherService.getCurrentWeather(city);
      
      if (weather) {
        return {
          content: `为您查询到${weather.location}的天气信息：当前温度 ${weather.temperature}°C，${weather.condition}，湿度 ${weather.humidity}%，风速 ${weather.windSpeed} km/h。未来几天都有不错的天气，建议您根据天气情况安排出行！`,
          weather,
          images: undefined,
          destinations: undefined
        };
      }
    }
    
    return {
      content: '请告诉我您想查询哪个城市的天气信息？例如"北京天气"或"上海今天天气如何？"',
      images: undefined,
      weather: undefined,
      destinations: undefined
    };
  }
  
  // Destination/travel queries
  const travelMatch = message.match(/(推荐.*地方|旅行.*建议|去.*旅行|旅游.*推荐|热门.*目的地|周末.*游|短途.*游)/);
  if (travelMatch) {
    const destinations = await DestinationsService.searchDestinations('');
    
    return {
      content: '我为您推荐几个热门的旅行目的地：',
      destinations: destinations.slice(0, 3),
      images: undefined,
      weather: undefined
    };
  }
  
  // Currency queries
  const currencyMatch = message.match(/(汇率|换钱|currency|换算.*|.*多少钱)/);
  if (currencyMatch) {
    return {
      content: '我可以帮您查询汇率信息。请告诉我您需要转换的货币和金额，例如"100美元等于多少人民币？"',
      images: undefined,
      weather: undefined,
      destinations: undefined
    };
  }
  
  // Default AI response
  const aiResponse = await AIService.generateResponse(userMessage);
  
  return {
    content: aiResponse,
    images: undefined,
    weather: undefined,
    destinations: undefined
  };
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
