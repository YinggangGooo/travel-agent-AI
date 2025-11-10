import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, History, Settings, Star } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/chat', icon: MessageSquare, label: '对话' },
    { path: '/history', icon: History, label: '历史' },
    { path: '/favorites', icon: Star, label: '收藏' },
    { path: '/settings', icon: Settings, label: '设置' },
  ];

  const isActive = (path: string) => {
    if (path === '/chat') {
      return location.pathname === '/' || location.pathname === '/chat';
    }
    return location.pathname === path;
  };

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-30 glass-card border-t border-white/15 safe-bottom"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-lg transition-colors min-w-[44px] ${
              isActive(item.path)
                ? 'text-primary bg-primary/10'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
