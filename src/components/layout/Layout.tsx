import React from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <Navigation />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
