import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  History,
  Settings,
  Plus,
  Star,
  Moon,
  Sun,
  Plane,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../contexts/ChatContext';

interface SidebarProps {
  onClose?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onClose,
  isOpen = true,
  onToggle
}) => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  // Add renameChat to destructuring
  const { chats, currentChat, selectChat, createNewChat, toggleFavorite, deleteChat, renameChat } = useChat();

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Cleaned up nav items (Removed 'New Chat' and 'Settings' as they are handled elsewhere)
  const navItems = [
    { path: '/history', icon: History, label: '历史记录' },
  ];

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChatId]);

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const startEditing = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };

  const saveTitle = (chatId: string) => {
    if (editTitle.trim()) {
      renameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditTitle('');
  };

  return (
    <motion.div
      animate={{ x: isOpen ? 0 : -320 }}
      initial={false}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 left-0 z-40 w-80 glass-card border-r border-white/15 flex flex-col"
    >
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

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-300 truncate">
            旅行助手
          </h1>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl glass-light border border-white/20 hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
        >
          {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4 shrink-0">
        <button
          onClick={() => {
            createNewChat();
            if (!isOpen && onToggle) onToggle();
            handleLinkClick();
          }}
          className="w-full btn-primary flex items-center justify-center space-x-2 py-3.5 shadow-lg shadow-primary/20 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
          <span className="font-medium">开始新对话</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-thin pb-4">
        {/* Navigation Items */}
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path)
                ? 'bg-white/10 text-primary font-medium border border-primary/20'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}

        <div className="pt-4 pb-2">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-2 mb-2">
            近期对话
          </h3>
          <div className="space-y-1">
            {chats.slice(0, 15).map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  selectChat(chat.id);
                  if (!isOpen && onToggle) onToggle();
                  handleLinkClick();
                }}
                className={`group relative flex items-center p-3 rounded-xl cursor-pointer transition-all border border-transparent ${currentChat?.id === chat.id
                    ? 'bg-primary/5 border-primary/10 shadow-sm'
                    : 'hover:bg-white/5 hover:border-white/10'
                  }`}
              >
                <MessageSquare className={`w-4 h-4 mr-3 shrink-0 ${currentChat?.id === chat.id ? 'text-primary' : 'text-neutral-400'
                  }`} />

                <div className="flex-1 min-w-0 mr-2">
                  {editingChatId === chat.id ? (
                    <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle(chat.id);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        onBlur={() => saveTitle(chat.id)}
                        className="w-full bg-white/10 border border-primary/30 rounded px-1 py-0.5 text-sm text-neutral-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  ) : (
                    <p
                      className={`text-sm truncate ${currentChat?.id === chat.id ? 'text-neutral-900 dark:text-white font-medium' : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      onDoubleClick={(e) => startEditing(chat.id, chat.title, e)}
                      title="双击重命名"
                    >
                      {chat.title}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-lg px-1">
                  {!editingChatId && (
                    <button
                      onClick={(e) => startEditing(chat.id, chat.title, e)}
                      className="p-1 hover:text-primary transition-colors text-neutral-400"
                      title="重命名"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(chat.id);
                    }}
                    className={`p-1 transition-colors ${chat.isFavorite ? 'text-yellow-400' : 'text-neutral-400 hover:text-yellow-400'
                      }`}
                    title={chat.isFavorite ? "取消收藏" : "收藏"}
                  >
                    <Star className="w-3 h-3" fill={chat.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="p-1 hover:text-red-500 transition-colors text-neutral-400"
                    title="删除"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Settings */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <Link
          to="/settings"
          onClick={handleLinkClick}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-all group"
        >
          <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-primary/10 transition-colors">
            <Settings className="w-5 h-5 group-hover:text-primary transition-colors" />
          </div>
          <span className="font-medium">全局设置</span>
        </Link>
      </div>
    </motion.div>
  );
};

export default Sidebar;