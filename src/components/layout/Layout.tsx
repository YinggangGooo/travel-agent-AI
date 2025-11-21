// Layout.tsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import { useTheme } from '../../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // 1. mobileSidebarOpen: 控制移动端遮罩式侧边栏
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // 2. desktopSidebarOpen: 控制桌面端推挤式侧边栏 (新增状态)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  
  const location = useLocation();
  const { isDark } = useTheme();

  const getBackgroundClass = () => {
    return isDark ? 'bg-dark-gradient' : 'bg-light-gradient';
  };

  return (
    <div className={`min-h-screen ${getBackgroundClass()} transition-all duration-500 relative`} style={{
      background: getComputedStyle(document.body).backgroundImage && getComputedStyle(document.body).backgroundImage !== 'none' 
        ? getComputedStyle(document.body).backgroundImage 
        : (isDark ? 'linear-gradient(135deg, #0F1419 0%, #1A1F2E 50%, #1F2937 100%)' : 'linear-gradient(135deg, #E8EAF0 0%, #F4F5F9 50%, #FAFBFF 100%)')
    }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          // 3. 将状态和控制函数传给 Sidebar
          isOpen={desktopSidebarOpen}
          onToggle={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {/* 移动端不需要 onToggle 和 isOpen 控制，因为它总是覆盖在上面的 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
        <Sidebar onClose={() => setMobileSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      {/* 4. 关键修改：根据 desktopSidebarOpen 动态切换 margin-left */}
      {/* 添加 transition-all duration-300 让 margin 的变化有平滑动画，与侧边栏动画同步 */}
      <div className={`transition-all duration-300 ease-in-out ${desktopSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'}`}>
        
        {/* Top Navigation */}
        <TopNav onMenuClick={() => setMobileSidebarOpen(true)} />
        
        {/* Page Content */}
        <main className="pb-8 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="block lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;