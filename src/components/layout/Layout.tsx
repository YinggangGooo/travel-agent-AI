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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="lg:ml-80">
        {/* Top Navigation */}
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        
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
