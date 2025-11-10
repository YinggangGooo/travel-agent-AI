import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Palette, 
  Globe, 
  Type, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Moon, 
  Sun, 
  Monitor,
  Upload,
  X,
  LogIn,
  LogOut,
  UserPlus
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserSettings, 
  saveUserSettings, 
  getUserProfile, 
  saveUserProfile,
  uploadBackgroundImage 
} from '../lib/supabase';

const SettingsPage: React.FC = () => {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const { user, signIn, signUp, signOut } = useAuth();
  
  const [fontSize, setFontSize] = useState('medium');
  const [language, setLanguage] = useState('zh-CN');
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [hasCustomBackground, setHasCustomBackground] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: '旅行者',
    email: 'traveler@example.com',
    avatar: '/images/ai_avatar_3.jpg'
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载用户设置和资料
  useEffect(() => {
    async function loadUserData() {
      if (user) {
        // 加载云端设置
        const settings = await getUserSettings(user.id);
        if (settings) {
          if (settings.language) setLanguage(settings.language);
          if (settings.font_size) setFontSize(settings.font_size);
          if (settings.background_image_url) {
            applyBackgroundImage(settings.background_image_url);
            setHasCustomBackground(true);
          }
        }

        // 加载用户资料
        const profile = await getUserProfile(user.id);
        if (profile) {
          setUserProfile({
            name: profile.name || '旅行者',
            email: profile.email || user.email || '',
            avatar: profile.avatar_url || '/images/ai_avatar_3.jpg'
          });
        } else {
          // 如果没有资料，使用用户的邮箱
          setUserProfile(prev => ({
            ...prev,
            email: user.email || ''
          }));
        }
      } else {
        // 未登录用户：从本地存储加载
        const localFontSize = localStorage.getItem('fontSize');
        const localLanguage = localStorage.getItem('language');
        const customBackground = localStorage.getItem('customBackground');
        
        if (localFontSize) setFontSize(localFontSize);
        if (localLanguage) setLanguage(localLanguage);
        if (customBackground) {
          applyBackgroundImage(customBackground);
          setHasCustomBackground(true);
        }
      }
    }
    loadUserData();
  }, [user]);

  // 应用背景图片
  const applyBackgroundImage = (imageUrl: string) => {
    document.documentElement.style.setProperty('--custom-bg-image', `url(${imageUrl})`);
    document.body.style.backgroundImage = `url(${imageUrl})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
  };

  // 保存设置到云端或本地
  const saveSettings = async (updates: any) => {
    if (user) {
      await saveUserSettings(user.id, updates);
    } else {
      // 未登录用户保存到本地
      Object.keys(updates).forEach(key => {
        localStorage.setItem(key, updates[key]);
      });
    }
  };

  // 处理认证
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (authMode === 'signin') {
        const { error } = await signIn(authEmail, authPassword);
        if (error) {
          setAuthError(error.message);
        } else {
          setShowAuthModal(false);
          setAuthEmail('');
          setAuthPassword('');
        }
      } else {
        const { error } = await signUp(authEmail, authPassword);
        if (error) {
          setAuthError(error.message);
        } else {
          setShowAuthModal(false);
          setAuthEmail('');
          setAuthPassword('');
          alert('注册成功！请检查您的邮箱以验证账户。');
        }
      }
    } catch (error) {
      setAuthError('认证失败，请重试');
    }
  };

  const handleSignOut = async () => {
    if (confirm('确定要登出吗？')) {
      await signOut();
      // 重置为默认状态
      setUserProfile({
        name: '旅行者',
        email: 'traveler@example.com',
        avatar: '/images/ai_avatar_3.jpg'
      });
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const avatarUrl = e.target?.result as string;
        setUserProfile(prev => ({
          ...prev,
          avatar: avatarUrl
        }));
        
        // 保存到云端或本地
        if (user) {
          await saveUserProfile(user.id, { avatar_url: avatarUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (!user) {
        // 未登录用户：使用本地方式
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          applyBackgroundImage(imageUrl);
          localStorage.setItem('customBackground', imageUrl);
          setHasCustomBackground(true);
          setShowImageUploader(false);
        };
        reader.readAsDataURL(file);
      } else {
        // 已登录用户：上传到云端
        setUploading(true);
        try {
          const publicUrl = await uploadBackgroundImage(file);
          if (publicUrl) {
            applyBackgroundImage(publicUrl);
            setHasCustomBackground(true);
            setShowImageUploader(false);
          } else {
            alert('上传失败，请重试');
          }
        } catch (error) {
          console.error('Upload error:', error);
          alert('上传失败，请重试');
        } finally {
          setUploading(false);
        }
      }
    }
  };

  const clearCustomBackground = async () => {
    document.documentElement.style.removeProperty('--custom-bg-image');
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
    
    if (user) {
      await saveUserSettings(user.id, { background_image_url: '' });
    } else {
      localStorage.removeItem('customBackground');
    }
    
    setHasCustomBackground(false);
  };

  const handleProfileUpdate = async (field: string, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
    
    if (user) {
      await saveUserProfile(user.id, { [field]: value });
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    saveSettings({ language: newLanguage });
  };

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize);
    saveSettings({ font_size: newSize });
  };

  const exportData = () => {
    const userData = {
      profile: userProfile,
      settings: { theme, fontSize, language },
      chats: JSON.parse(localStorage.getItem('travelAgent_chats') || '[]'),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `travel-agent-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (confirm('确定要清除所有数据吗？这个操作不可恢复。')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            设置
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            个性化您的旅行助手体验
          </p>
        </div>

        {/* 认证状态 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">已登录</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{user.email}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-neutral-300 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">未登录</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">登录以同步设置到云端</p>
                  </div>
                </>
              )}
            </div>
            {user ? (
              <button
                onClick={handleSignOut}
                className="btn-secondary flex items-center space-x-2 px-4 py-2"
              >
                <LogOut className="w-4 h-4" />
                <span>登出</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-primary flex items-center space-x-2 px-4 py-2"
              >
                <LogIn className="w-4 h-4" />
                <span>登录/注册</span>
              </button>
            )}
          </div>
        </motion.section>

        {/* User Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              用户资料
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={userProfile.avatar}
                alt="用户头像"
                className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  姓名
                </label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => handleProfileUpdate('name', e.target.value)}
                  className="w-full px-4 py-2 glass-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => handleProfileUpdate('email', e.target.value)}
                  disabled={!!user}
                  className="w-full px-4 py-2 glass-input rounded-lg disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Theme Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Palette className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              主题设置
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                外观模式
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: '明亮', icon: Sun },
                  { id: 'dark', label: '深色', icon: Moon },
                  { id: 'auto', label: '自动', icon: Monitor },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id as any)}
                    className={`flex flex-col items-center space-y-2 p-3 rounded-lg border-2 transition-colors ${
                      theme === id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/20 hover:border-white/30'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Theme Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">快速切换</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">在明亮和深色模式间切换</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 btn-secondary px-4 py-2"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>切换</span>
              </button>
            </div>
          </div>
        </motion.section>

        {/* Language Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              语言设置
            </h2>
          </div>

          <div className="max-w-xs">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              选择语言
            </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-4 py-2 glass-input rounded-lg"
            >
              <option value="zh-CN">中文（简体）</option>
              <option value="zh-TW">中文（繁体）</option>
              <option value="en-US">English (US)</option>
              <option value="ja-JP">日本語</option>
              <option value="ko-KR">한국어</option>
            </select>
          </div>
        </motion.section>

        {/* Font Size Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Type className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              字体大小
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              界面字体大小
            </label>
            <div className="space-y-3">
              {[
                { id: 'small', label: '小', value: '14px' },
                { id: 'medium', label: '中', value: '16px' },
                { id: 'large', label: '大', value: '18px' },
              ].map(({ id, label, value }) => (
                <label key={id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="fontSize"
                    value={id}
                    checked={fontSize === id}
                    onChange={(e) => handleFontSizeChange(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
                    <span className="text-xs text-neutral-500">{value}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Background Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <ImageIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              背景设置
            </h2>
          </div>

          <div className="space-y-4">
            {hasCustomBackground && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-200 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>已设置自定义背景图片{user ? '（云端同步）' : '（本地存储）'}</span>
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowImageUploader(true)}
                disabled={uploading}
                className="flex-1 btn-secondary flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? '上传中...' : (hasCustomBackground ? '更换背景' : '上传背景图片')}</span>
              </button>
              {hasCustomBackground && (
                <button
                  onClick={clearCustomBackground}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>清除背景</span>
                </button>
              )}
            </div>
            
            <div className="p-4 bg-white/10 rounded-lg">
              <h3 className="font-medium text-neutral-900 dark:text-white mb-2">提示</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {user 
                  ? '您已登录，背景图片将上传到云端并在所有设备间同步。' 
                  : '登录后可将背景图片保存到云端，实现跨设备同步。'}
              </p>
            </div>
          </div>

          {/* Image Uploader Modal */}
          {showImageUploader && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowImageUploader(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative glass-card-strong p-6 rounded-2xl max-w-md w-full mx-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    上传背景图片
                  </h3>
                  <button
                    onClick={() => setShowImageUploader(false)}
                    className="p-2 rounded-lg glass-light border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div
                  onClick={() => document.getElementById('bg-upload')?.click()}
                  className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <ImageIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    点击选择图片或拖拽到此处
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    支持 JPG、PNG、WEBP 格式
                  </p>
                  {uploading && (
                    <p className="text-xs text-primary mt-2">上传中，请稍候...</p>
                  )}
                </div>

                <input
                  id="bg-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </motion.div>
            </div>
          )}
        </motion.section>

        {/* Data Management */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Download className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              数据管理
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">数据备份</h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                导出您的所有聊天记录和个人设置
              </p>
              <button
                onClick={exportData}
                className="btn-primary text-sm px-4 py-2"
              >
                导出数据
              </button>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">危险操作</h3>
              <p className="text-sm text-red-700 dark:text-red-200 mb-3">
                清除所有数据将不可恢复，包括聊天记录和设置
              </p>
              <button
                onClick={clearAllData}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>清除所有数据</span>
              </button>
            </div>
          </div>
        </motion.section>
      </div>

      {/* 认证模态框 */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative glass-card-strong p-6 rounded-2xl max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                {authMode === 'signin' ? '登录' : '注册'}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-2 rounded-lg glass-light border border-white/20 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 glass-input rounded-lg"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 glass-input rounded-lg"
                  placeholder="至少6位字符"
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-200">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
              >
                {authMode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>登录</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>注册</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    setAuthError('');
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  {authMode === 'signin' ? '还没有账户？注册' : '已有账户？登录'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

