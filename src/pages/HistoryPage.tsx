import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Star, 
  Trash2, 
  Download, 
  Calendar,
  Tag,
  MessageSquare,
  Archive,
  Plus
} from 'lucide-react';
import { useChat, Chat } from '../contexts/ChatContext';
import { Link } from 'react-router-dom';
import ExportModal from '../components/export/ExportModal';

const HistoryPage: React.FC = () => {
  const { chats, searchChats, toggleFavorite, deleteChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'messages'>('date');
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [chatToExport, setChatToExport] = useState<Chat | null>(null);

  // Filter and sort chats
  const filteredAndSortedChats = useMemo(() => {
    let filtered = chats;

    // Apply search filter
    if (searchQuery) {
      filtered = searchChats(searchQuery);
    }

    // Apply category filter
    switch (activeFilter) {
      case 'favorites':
        filtered = filtered.filter(chat => chat.isFavorite);
        break;
      case 'archived':
        // For now, we don't have archived chats, so show all
        break;
    }

    // Sort chats
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'messages':
          return b.messages.length - a.messages.length;
        case 'date':
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });
  }, [chats, searchQuery, activeFilter, sortBy, searchChats]);

  // Statistics
  const stats = useMemo(() => {
    const total = chats.length;
    const favorites = chats.filter(c => c.isFavorite).length;
    const withMessages = chats.filter(c => c.messages.length > 0).length;
    
    return { total, favorites, withMessages };
  }, [chats]);

  const handleSelectChat = (chatId: string) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedChats(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedChats.size === filteredAndSortedChats.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(filteredAndSortedChats.map(c => c.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedChats.size > 0) {
      if (confirm(`确定要删除选中的 ${selectedChats.size} 个对话吗？`)) {
        selectedChats.forEach(chatId => deleteChat(chatId));
        setSelectedChats(new Set());
      }
    }
  };

  const handleExportChat = (chat: Chat) => {
    setChatToExport(chat);
    setShowExportModal(true);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          历史记录
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          管理您的所有对话记录
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: '总对话数', value: stats.total, icon: MessageSquare, color: 'bg-blue-500' },
          { label: '收藏对话', value: stats.favorites, icon: Star, color: 'bg-yellow-500' },
          { label: '有消息', value: stats.withMessages, icon: MessageSquare, color: 'bg-green-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 rounded-xl mb-6"
      >
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="搜索对话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 glass-input rounded-lg"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
            {[
              { id: 'all', label: '全部', count: stats.total },
              { id: 'favorites', label: '收藏', count: stats.favorites },
              { id: 'archived', label: '已归档', count: 0 },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setActiveFilter(id as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === id
                    ? 'bg-primary text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 glass-input rounded-lg"
          >
            <option value="date">按时间排序</option>
            <option value="title">按标题排序</option>
            <option value="messages">按消息数排序</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedChats.size > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium text-primary">
              已选中 {selectedChats.size} 个对话
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkDelete}
                className="text-sm px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                删除选中
              </button>
              <button
                onClick={() => setSelectedChats(new Set())}
                className="text-sm px-3 py-1 glass-light rounded-lg"
              >
                取消选择
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Chat List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredAndSortedChats.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              {searchQuery ? '没有找到匹配的对话' : '还没有对话记录'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {searchQuery ? '尝试使用其他关键词搜索' : '开始与旅行助手对话，创建您的第一个记录'}
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center space-x-2 btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>开始对话</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Select All Checkbox */}
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={selectedChats.size === filteredAndSortedChats.length && filteredAndSortedChats.length > 0}
                onChange={handleSelectAll}
                className="rounded text-primary focus:ring-primary"
              />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                全选 ({filteredAndSortedChats.length} 个对话)
              </span>
            </div>

            {/* Chat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedChats.map((chat) => (
                <motion.div
                  key={chat.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-4 rounded-xl hover:shadow-card-hover transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedChats.has(chat.id)}
                        onChange={() => handleSelectChat(chat.id)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                          {chat.title}
                        </h3>
                        <p className="text-xs text-neutral-500">
                          {formatDate(chat.updatedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {chat.isFavorite && (
                        <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                      )}
                      {chat.tags.length > 0 && (
                        <Tag className="w-4 h-4 text-neutral-400" />
                      )}
                      <div className="relative">
                        <button className="p-1 rounded hover:bg-white/10 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mb-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                      {chat.messages.length > 0
                        ? chat.messages[0].content
                        : '空白对话'
                      }
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
                    <span>{chat.messages.length} 条消息</span>
                    <span>创建于 {new Date(chat.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Link
                      to="/chat"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                      onClick={() => {
                        // Select this chat logic would go here
                      }}
                    >
                      继续对话
                    </Link>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFavorite(chat.id)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title={chat.isFavorite ? '取消收藏' : '收藏'}
                      >
                        <Star 
                          className={`w-4 h-4 ${chat.isFavorite ? 'text-yellow-500' : 'text-neutral-400'}`} 
                          fill={chat.isFavorite ? 'currentColor' : 'none'} 
                        />
                      </button>
                      
                      <button
                        onClick={() => handleExportChat(chat)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title="导出"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteChat(chat.id)}
                        className="p-1 rounded hover:bg-white/10 text-red-500 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          setChatToExport(null);
        }}
        chat={chatToExport}
      />
    </div>
  );
};

export default HistoryPage;
