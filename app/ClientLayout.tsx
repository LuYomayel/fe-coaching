'use client';
import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../src/components/Sidebar';
import OfflineIndicator from '../src/components/OfflineIndicator';
import { UserContext } from '../src/utils/UserContext';
import { UserContextType } from '../src/types/shared-types';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const userContext = useContext(UserContext) as UserContextType;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex">
      <OfflineIndicator />
      <Sidebar onExpandChange={setSidebarExpanded} />
      <div
        className="flex-grow-1"
        style={{
          marginLeft: isMobile ? '0' : sidebarExpanded ? '250px' : '70px',
          transition: 'margin-left 0.3s ease',
          height: '100vh',
          overflow: 'auto'
        }}
      >
        {children}
      </div>
    </div>
  );
}
