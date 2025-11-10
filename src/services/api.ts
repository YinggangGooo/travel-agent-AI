import axios from 'axios';
import { WeatherData, Destination } from '../contexts/ChatContext';

// Weather API Service (Open-Meteo - Free, no API key required)
export class WeatherService {
  private static baseUrl = 'https://api.open-meteo.com/v1/forecast';

  static async getCurrentWeather(city: string): Promise<WeatherData | null> {
    try {
      // First, get coordinates for the city
      const geocodeResponse = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`
      );
      
      if (!geocodeResponse.data.results || geocodeResponse.data.results.length === 0) {
        return null;
      }

      const { latitude, longitude, name, country, timezone } = geocodeResponse.data.results[0];

      // Get current weather
      const weatherResponse = await axios.get(`${this.baseUrl}`, {
        params: {
          latitude,
          longitude,
          current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min',
          timezone: timezone || 'auto',
          forecast_days: 7
        }
      });

      const current = weatherResponse.data.current;
      const daily = weatherResponse.data.daily;

      // Convert weather code to human readable format
      const weatherCondition = this.getWeatherCondition(current.weather_code);
      const currentIcon = this.getWeatherIcon(current.weather_code);

      // Get 7-day forecast
      const forecast = daily.time.slice(0, 7).map((date: string, index: number) => ({
        day: index === 0 ? '今天' : 
             index === 1 ? '明天' : 
             new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' }),
        high: Math.round(daily.temperature_2m_max[index]),
        low: Math.round(daily.temperature_2m_min[index]),
        condition: this.getWeatherCondition(daily.weather_code[index]),
        icon: this.getWeatherIcon(daily.weather_code[index])
      }));

      return {
        location: `${name}, ${country}`,
        temperature: Math.round(current.temperature_2m),
        condition: weatherCondition,
        humidity: Math.round(current.relative_humidity_2m),
        windSpeed: Math.round(current.wind_speed_10m),
        icon: currentIcon,
        forecast
      };
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      return null;
    }
  }

  private static getWeatherCondition(code: number): string {
    const weatherMap: { [key: number]: string } = {
      0: '晴朗',
      1: '多云',
      2: '多云',
      3: '多云',
      45: '雾',
      48: '霜雾',
      51: '小雨',
      53: '中雨',
      55: '大雨',
      56: '冻雨',
      57: '大冻雨',
      61: '小雨',
      63: '中雨',
      65: '大雨',
      66: '冻雨',
      67: '大冻雨',
      71: '小雪',
      73: '中雪',
      75: '大雪',
      77: '雪粒',
      80: '阵雨',
      81: '中阵雨',
      82: '大阵雨',
      85: '阵雪',
      86: '大雪',
      95: '雷暴',
      96: '雷暴伴有冰雹',
      99: '强雷暴伴有冰雹'
    };
    
    return weatherMap[code] || '未知';
  }

  private static getWeatherIcon(code: number): string {
    const iconMap: { [key: number]: string } = {
      0: '☀️',
      1: '⛅',
      2: '⛅',
      3: '☁️',
      45: '🌫️',
      48: '🌫️',
      51: '🌦️',
      53: '🌧️',
      55: '🌧️',
      61: '🌦️',
      63: '🌧️',
      65: '🌧️',
      71: '🌨️',
      73: '❄️',
      75: '❄️',
      80: '🌦️',
      81: '🌧️',
      82: '⛈️',
      85: '🌨️',
      86: '❄️',
      95: '⛈️',
      96: '⛈️',
      99: '⛈️'
    };
    
    return iconMap[code] || '☁️';
  }
}

// Currency API Service (Frankfurter - Free)
export class CurrencyService {
  private static baseUrl = 'https://api.frankfurter.app/latest';

  static async getExchangeRate(from: string = 'USD', to: string = 'CNY'): Promise<number | null> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: { from, to }
      });

      if (response.data && response.data.rates) {
        return response.data.rates[to];
      }
      
      return null;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      return null;
    }
  }

  static async convertCurrency(amount: number, from: string, to: string): Promise<number | null> {
    try {
      const rate = await this.getExchangeRate(from, to);
      if (rate) {
        return amount * rate;
      }
      return null;
    } catch (error) {
      console.error('Failed to convert currency:', error);
      return null;
    }
  }
}

// Timezone Service
export class TimezoneService {
  static getCurrentTime(city: string, timezone: string = 'Asia/Shanghai'): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long'
    };
    
    return new Intl.DateTimeFormat('zh-CN', options).format(now);
  }

  static getCurrentTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}

// Travel Destinations API (Using mock data with real places for now)
export class DestinationsService {
  private static destinations: Destination[] = [
    {
      id: 'beijing',
      name: '北京',
      description: '中华人民共和国的首都，历史文化名城，拥有紫禁城、长城等世界文化遗产。',
      rating: 4.8,
      images: ['/images/destinations_6.jpg'],
      location: { lat: 39.9042, lng: 116.4074 }
    },
    {
      id: 'shanghai',
      name: '上海',
      description: '中国最大的经济中心城市，现代化国际都市，拥有外滩、东方明珠等著名景点。',
      rating: 4.7,
      images: ['/images/destinations_5.png'],
      location: { lat: 31.2304, lng: 121.4737 }
    },
    {
      id: 'hangzhou',
      name: '杭州',
      description: '浙江省省会，以西湖美景闻名于世，被誉为"人间天堂"。',
      rating: 4.8,
      images: ['/images/destinations_1.png'],
      location: { lat: 30.2741, lng: 120.1551 }
    },
    {
      id: 'guilin',
      name: '桂林',
      description: '中国著名风景游览城市，以奇峰异石和漓江山水著称于世。',
      rating: 4.7,
      images: ['/images/destinations_5.png'],
      location: { lat: 25.2736, lng: 110.2991 }
    },
    {
      id: 'xian',
      name: '西安',
      description: '中国四大古都之一，拥有兵马俑、大雁塔等历史文化古迹。',
      rating: 4.6,
      images: ['/images/destinations_6.jpg'],
      location: { lat: 34.3416, lng: 108.9398 }
    }
  ];

  static async searchDestinations(query: string): Promise<Destination[]> {
    if (!query.trim()) {
      return this.destinations;
    }

    return this.destinations.filter(dest =>
      dest.name.includes(query) || dest.description.includes(query)
    );
  }

  static getDestinationById(id: string): Destination | undefined {
    return this.destinations.find(dest => dest.id === id);
  }
}

// AI Chat Service - Real API integration via Supabase Edge Function
export class AIService {
  private static edgeFunctionUrl = 'https://xklepslyvzkqwujherre.supabase.co/functions/v1/travel-chat';
  private static supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbGVwc2x5dnprcXd1amhlcnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NDM0MDcsImV4cCI6MjA3ODIxOTQwN30.LCRcIalEOBjH22-Umn0QQxrDtwyCgcbZiC5ta31GY0o';

  /**
   * Generate AI response using Supabase Edge Function
   * @param userMessage - User's input message
   * @param context - Optional context (not used yet)
   * @param stream - Whether to use streaming response (default: false)
   * @param onChunk - Callback for streaming chunks (required if stream=true)
   */
  static async generateResponse(
    userMessage: string, 
    context?: any,
    stream: boolean = false,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      if (stream && onChunk) {
        // Streaming response using Server-Sent Events
        return await this.generateStreamingResponse(userMessage, onChunk);
      } else {
        // Non-streaming response
        const response = await fetch(this.edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
          },
          body: JSON.stringify({
            message: userMessage,
            stream: false
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.content || '抱歉,我现在无法生成回复。';
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Fallback response for errors
      if (error instanceof Error && error.message.includes('DEEPSEEK_API_KEY')) {
        return '抱歉,AI服务暂时不可用。请联系管理员配置API密钥。';
      }
      
      return '抱歉,我现在遇到了一些技术问题。请稍后再试,或重新描述您的问题。';
    }
  }

  /**
   * Generate streaming AI response
   * @param userMessage - User's input message
   * @param onChunk - Callback for each chunk of content
   */
  private static async generateStreamingResponse(
    userMessage: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          message: userMessage,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get stream reader');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let toolsInfo = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'tools') {
                // Tools information (weather, exchange rate, etc.)
                toolsInfo = `🔧 ${parsed.content}\n\n`;
                onChunk(toolsInfo);
              } else if (parsed.type === 'content') {
                // AI response content
                fullContent += parsed.content;
                onChunk(parsed.content);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      return toolsInfo + fullContent;
    } catch (error) {
      console.error('Streaming Error:', error);
      throw error;
    }
  }
}
