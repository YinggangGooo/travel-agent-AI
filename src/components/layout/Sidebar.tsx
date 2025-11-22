import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  History, 
  Settings, 
  Plus, 
  Star,
  Moon,
  Sun,
  Plane,
  ChevronLeft,  // 新增图标
  ChevronRight  // 新增图标
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../contexts/ChatContext';

interface SidebarProps {
  onClose?: () => void;
  // 新增：接收外部传入的状态和控制函数
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onClose, 
  // 默认为 true，保证移动端调用时不会出错（移动端没有 toggle 逻辑，默认就是打开展示）
  isOpen = true, 
  onToggle 
}) => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { chats, currentChat, selectChat, createNewChat, toggleFavorite, deleteChat } = useChat();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/chat', icon: MessageSquare, label: '新对话' },
    { path: '/history', icon: History, label: '历史记录' },
    { path: '/settings', icon: Settings, label: '设置' },
  ];

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <motion.div 
      // 修改：根据 isOpen 属性决定 X 轴位置
      // 宽度是 w-80 (320px)，所以隐藏时移动 -320
      animate={{ x: isOpen ? 0 : -320 }}
      initial={false} // 防止刷新页面时出现不必要的初始动画
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 left-0 z-40 w-80 glass-card border-r border-white/15"
    >
      {/* 新增：侧边栏切换按钮 (仅当提供了 onToggle 时显示，通常是在桌面端) */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-16 flex items-center justify-center 
                     bg-white/10 backdrop-blur-md border-y border-r border-white/20 
                     rounded-r-xl cursor-pointer hover:bg-white/20 transition-colors text-neutral-600 dark:text-white outline-none"
          title={isOpen ? "收起侧边栏" : "展开侧边栏"}
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      )}

      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
              旅行助手
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg glass-light border border-white/20 hover:bg-white/20 transition-colors flex-shrink-0"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              createNewChat();
              // 如果当前是折叠状态，点击新建时自动展开
              if (!isOpen && onToggle) onToggle();
              handleLinkClick();
            }}
            className="w-full btn-secondary flex items-center justify-center space-x-2 py-3"
          >
            <Plus className="w-4 h-4" />
            <span>新建对话</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-white/10'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Chat History */}
        <div className="flex-1 px-4 pt-6 overflow-hidden">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3 truncate">
            对话历史
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {chats.slice(0, 10).map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  currentChat?.id === chat.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-white/10'
                }`}
                onClick={() => {
                  selectChat(chat.id);
                  // 点击历史记录自动展开侧边栏
                  if (!isOpen && onToggle) onToggle();
                  handleLinkClick();
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{chat.title}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(chat.id);
                    }}
                    className={`p-1 rounded ${
                      chat.isFavorite ? 'text-yellow-500' : 'text-neutral-400'
                    }`}
                  >
                    <Star className="w-3 h-3" fill={chat.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="p-1 rounded text-neutral-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings at Bottom */}
        <div className="p-4 border-t border-white/10">
          <Link
            to="/settings"
            onClick={handleLinkClick}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium truncate">设置</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;