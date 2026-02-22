import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import KeyboardShortcutsModal from '../KeyboardShortcutsModal';
import AnimatedPage from '../AnimatedPage';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onToggleHelp: () => setIsShortcutsModalOpen((prev) => !prev),
    enabled: true,
  });

  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-950">
      <Header
        onMobileMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
        onShowShortcuts={() => setIsShortcutsModalOpen(true)}
      />
      <div className="flex">
        <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
        <main className="flex-1 p-4 lg:p-6 lg:ml-64 mt-16">
          <div className="max-w-7xl mx-auto">
            <AnimatedPage key={location.pathname}>
              <Outlet />
            </AnimatedPage>
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};

export default Layout;
