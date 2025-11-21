import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Search, MoreVertical } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';

interface TopNavProps {
  onMenuClick: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const { currentChat } = useChat();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/chat':
        return currentChat?.title || '新对话';
      case '/history':
        return '历史记录';
      case '/settings':
        return '设置';
      default:
        return '旅行助手';
    }
  };

  return (
    <motion.header 
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      // 修改点：添加 'lg:hidden'
      // 这意味着在 lg (大屏幕/桌面端) 尺寸下，顶部导航栏会被完全隐藏
      // 只在移动端或平板（屏幕较小）时显示，解决了侧边栏折叠导致的桌面端对齐问题
      className="sticky top-0 z-30 glass-card border-b border-white/15 safe-top lg:hidden"
    >
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            // 修改点：移除了 lg:hidden，因为父容器已经隐藏了，这里的按钮只需要处理点击事件
            className="p-2 rounded-lg glass-light border border-white/20 hover:bg-white/20 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg glass-light border border-white/20 hover:bg-white/20 transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg glass-light border border-white/20 hover:bg-white/20 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default TopNav;
