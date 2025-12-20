import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Palette, Globe, Type, Image as ImageIcon, Download, Trash2,
    Moon, Sun, Monitor, Upload, X, LogIn, LogOut, UserPlus, ChevronRight
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
    getUserSettings, saveUserSettings, getUserProfile,
    saveUserProfile, uploadBackgroundImage
} from '../../lib/supabase';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { theme, isDark, setTheme, toggleTheme } = useTheme();
    const { user, signIn, signUp, signOut } = useAuth();

    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'data'>('profile');

    const [fontSize, setFontSize] = useState('medium');
    const [language, setLanguage] = useState('zh-CN');
    const [showImageUploader, setShowImageUploader] = useState(false);
    const [hasCustomBackground, setHasCustomBackground] = useState(false);
    const [userProfile, setUserProfile] = useState({
        name: '旅行者',
        email: 'traveler@example.com',
        avatar: '/images/ai_avatar_3.jpg'
    });

    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function loadUserData() {
            if (user) {
                const settings = await getUserSettings(user.id);
                if (settings) {
                    if (settings.language) setLanguage(settings.language);
                    if (settings.font_size) setFontSize(settings.font_size);
                    if (settings.background_image_url) {
                        applyBackgroundImage(settings.background_image_url);
                        setHasCustomBackground(true);
                    }
                }

                const profile = await getUserProfile(user.id);
                if (profile) {
                    setUserProfile({
                        name: profile.name || '旅行者',
                        email: profile.email || user.email || '',
                        avatar: profile.avatar_url || '/images/ai_avatar_3.jpg'
                    });
                } else {
                    setUserProfile(prev => ({ ...prev, email: user.email || '' }));
                }
            } else {
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
        if (isOpen) loadUserData();
    }, [user, isOpen]);

    const applyBackgroundImage = (imageUrl: string) => {
        document.documentElement.style.setProperty('--custom-bg-image', `url(${imageUrl})`);
        document.body.style.backgroundImage = `url(${imageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
    };

    const saveSettings = async (updates: any) => {
        if (user) {
            await saveUserSettings(user.id, updates);
        } else {
            Object.keys(updates).forEach(key => {
                localStorage.setItem(key, updates[key]);
            });
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        try {
            if (authMode === 'signin') {
                const { error } = await signIn(authEmail, authPassword);
                if (error) setAuthError(error.message);
                else { setAuthEmail(''); setAuthPassword(''); }
            } else {
                const { error } = await signUp(authEmail, authPassword);
                if (error) setAuthError(error.message);
                else {
                    setAuthEmail(''); setAuthPassword('');
                    alert('注册成功！请检查您的邮箱以验证账户。');
                }
            }
        } catch (error) { setAuthError('认证失败，请重试'); }
    };

    const handleSignOut = async () => {
        if (confirm('确定要登出吗？')) {
            await signOut();
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
                setUserProfile(prev => ({ ...prev, avatar: avatarUrl }));
                if (user) await saveUserProfile(user.id, { avatar_url: avatarUrl });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            if (!user) {
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
                setUploading(true);
                try {
                    const publicUrl = await uploadBackgroundImage(file);
                    if (publicUrl) {
                        applyBackgroundImage(publicUrl);
                        setHasCustomBackground(true);
                        setShowImageUploader(false);
                    } else alert('上传失败');
                } catch (error) { console.error(error); alert('上传失败'); }
                finally { setUploading(false); }
            }
        }
    };

    const clearCustomBackground = async () => {
        document.documentElement.style.removeProperty('--custom-bg-image');
        document.body.style.backgroundImage = '';
        if (user) await saveUserSettings(user.id, { background_image_url: '' });
        else localStorage.removeItem('customBackground');
        setHasCustomBackground(false);
    };

    const handleProfileUpdate = async (field: string, value: string) => {
        setUserProfile(prev => ({ ...prev, [field]: value }));
        if (user) await saveUserProfile(user.id, { [field]: value });
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

    if (!isOpen) return null;

    const tabs = [
        { id: 'profile', label: '个人资料', icon: User },
        { id: 'appearance', label: '外观设置', icon: Palette },
        { id: 'data', label: '数据管理', icon: Globe },
    ];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white dark:bg-[#1a1a1a] w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden border border-neutral-200 dark:border-neutral-800"
            >
                {/* Sidebar */}
                <div className="w-64 bg-neutral-50 dark:bg-neutral-900/50 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
                    <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">设置</h2>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    {user && (
                        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                            <button onClick={handleSignOut} className="w-full flex items-center justify-center space-x-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                <LogOut className="w-4 h-4" />
                                <span>退出登录</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 relative scrollbar-thin">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'profile' && (
                                <div className="space-y-8">
                                    {!user && (
                                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                                            <h3 className="text-lg font-bold mb-4 flex items-center"><UserPlus className="w-5 h-5 mr-2" /> 登录 / 注册</h3>
                                            <form onSubmit={handleAuth} className="space-y-4">
                                                <input type="email" placeholder="邮箱" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                                                <input type="password" placeholder="密码" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                                                {authError && <p className="text-red-500 text-sm">{authError}</p>}
                                                <button className="w-full btn-primary py-3 rounded-xl">{authMode === 'signin' ? '登录' : '注册'}</button>
                                                <p className="text-center text-sm text-neutral-500 cursor-pointer" onClick={() => setAuthMode(m => m === 'signin' ? 'signup' : 'signin')}>
                                                    {authMode === 'signin' ? '没有账号？去注册' : '已有账号？去登录'}
                                                </p>
                                            </form>
                                        </div>
                                    )}

                                    <div className="flex items-start space-x-6">
                                        <div className="relative group">
                                            <img src={userProfile.avatar} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                                            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-md"><Upload className="w-4 h-4" /></button>
                                            <input ref={fileInputRef} type="file" hidden onChange={handleAvatarUpload} accept="image/*" />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-neutral-500">昵称</label>
                                                <input value={userProfile.name} onChange={e => handleProfileUpdate('name', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none outline-none focus:ring-2 ring-primary/50" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-neutral-500">邮箱</label>
                                                <input value={userProfile.email} disabled className="w-full mt-1 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 opacity-60 cursor-not-allowed" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="space-y-8">
                                    {/* Theme */}
                                    <div>
                                        <h3 className="font-bold mb-4 flex items-center"><Palette className="w-5 h-5 mr-2" /> 主题模式</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { id: 'light', label: '明亮', icon: Sun },
                                                { id: 'dark', label: '深色', icon: Moon },
                                                { id: 'auto', label: '自动', icon: Monitor },
                                            ].map(t => (
                                                <button key={t.id} onClick={() => setTheme(t.id as any)} className={`p-4 rounded-xl border-2 flex flex-col items-center space-y-2 ${theme === t.id ? 'border-primary bg-primary/5 text-primary' : 'border-neutral-200 dark:border-neutral-700'}`}>
                                                    <t.icon className="w-6 h-6" />
                                                    <span>{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Font Size */}
                                    <div>
                                        <h3 className="font-bold mb-4 flex items-center"><Type className="w-5 h-5 mr-2" /> 字体大小</h3>
                                        <div className="flex space-x-4">
                                            {['small', 'medium', 'large'].map(s => (
                                                <button key={s} onClick={() => { setFontSize(s); saveSettings({ font_size: s }); }} className={`px-6 py-2 rounded-lg border ${fontSize === s ? 'bg-primary text-white border-primary' : 'border-neutral-200 dark:border-neutral-700'}`}>
                                                    {s === 'small' ? '小' : s === 'medium' ? '中' : '大'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Background */}
                                    <div>
                                        <h3 className="font-bold mb-4 flex items-center"><ImageIcon className="w-5 h-5 mr-2" /> 自定义背景</h3>
                                        <div className="flex space-x-3">
                                            <button onClick={() => setShowImageUploader(true)} className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 transition-colors">上传图片</button>
                                            {hasCustomBackground && <button onClick={clearCustomBackground} className="px-4 py-2 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg">清除背景</button>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'data' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl">
                                        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">数据备份</h3>
                                        <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">下载您的所有聊天记录和设置配置。</p>
                                        <button onClick={exportData} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><Download className="w-4 h-4" /> <span>导出数据</span></button>
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl">
                                        <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">危险区域</h3>
                                        <p className="text-sm text-red-600 dark:text-red-300 mb-4">清除所有本地数据，包括聊天记录（不可恢复）。</p>
                                        <button onClick={clearAllData} className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"><Trash2 className="w-4 h-4" /> <span>清空所有数据</span></button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Image Uploader Overlay */}
                {showImageUploader && (
                    <div className="absolute inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl max-w-sm w-full text-center">
                            <h3 className="font-bold mb-4">上传背景</h3>
                            <div onClick={() => document.getElementById('bg-upload-modal')?.click()} className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 cursor-pointer hover:border-primary">
                                <ImageIcon className="w-8 h-8 mx-auto text-neutral-400" />
                                <p className="mt-2 text-sm text-neutral-500">点击选择图片</p>
                            </div>
                            <input id="bg-upload-modal" type="file" hidden accept="image/*" onChange={handleBackgroundUpload} />
                            <button onClick={() => setShowImageUploader(false)} className="mt-4 text-neutral-500 hover:text-neutral-900">取消</button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>,
        document.body
    );
};

export default SettingsModal;
