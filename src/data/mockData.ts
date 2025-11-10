// Mock data for development and testing

import { WeatherData, Destination } from '../contexts/ChatContext';

export const mockWeatherData: WeatherData = {
  location: '北京',
  temperature: 22,
  condition: '多云',
  humidity: 65,
  windSpeed: 12,
  icon: '☁️',
  forecast: [
    { day: '今天', high: 24, low: 18, condition: '多云', icon: '☁️' },
    { day: '明天', high: 26, low: 20, condition: '晴', icon: '☀️' },
    { day: '周三', high: 23, low: 17, condition: '小雨', icon: '🌦️' },
    { day: '周四', high: 25, low: 19, condition: '晴', icon: '☀️' },
    { day: '周五', high: 27, low: 21, condition: '多云', icon: '⛅' },
    { day: '周六', high: 24, low: 18, condition: '小雨', icon: '🌧️' },
    { day: '周日', high: 22, low: 16, condition: '阴', icon: '☁️' },
  ],
};

export const mockDestinations: Destination[] = [
  {
    id: 'dest-1',
    name: '故宫博物院',
    description: '明清两朝的皇家宫殿，中国古代宫廷建筑之精华，世界文化遗产。',
    rating: 4.8,
    images: ['/images/destinations_6.jpg', '/images/destinations_5.png'],
    location: { lat: 39.9163, lng: 116.3972 },
  },
  {
    id: 'dest-2',
    name: '西湖',
    description: '杭州著名景点，以秀丽的湖光山色和众多的名胜古迹闻名中外。',
    rating: 4.7,
    images: ['/images/destinations_1.png'],
    location: { lat: 30.2594, lng: 120.1274 },
  },
  {
    id: 'dest-3',
    name: '天安门广场',
    description: '世界上最大的城市中心广场，见证了中华民族的伟大复兴。',
    rating: 4.9,
    images: ['/images/destinations_5.png'],
    location: { lat: 39.9035, lng: 116.3976 },
  },
];

// Sample conversation starters
export const conversationStarters = [
  '推荐一些国内热门旅行目的地',
  '帮我查询北京今天的天气',
  '规划一个3天的杭州旅行路线',
  '有哪些适合亲子游的景点？',
  '推荐一些美食城市',
  '查询一下上海的交通信息',
  '有哪些性价比高的海岛推荐？',
  '帮我规划一个周末的短途旅行',
];
