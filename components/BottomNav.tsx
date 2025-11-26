import React from 'react';
import { Home, Heart, PlusCircle, MessageCircle } from 'lucide-react';
import { View } from '../types';

interface BottomNavProps {
  currentView: View;
  setView: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: View.HOME, label: 'Home', icon: Home },
    { view: View.FEELINGS, label: 'Feelings', icon: Heart },
    { view: View.CREATE, label: 'Create', icon: PlusCircle },
    { view: View.BUDDY, label: 'Buddy', icon: MessageCircle },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.view;
        return (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive ? 'text-teal-600 transform scale-105' : 'text-gray-400'
            }`}
          >
            <Icon
              size={isActive ? 28 : 24}
              strokeWidth={isActive ? 2.5 : 2}
              fill={isActive && item.view === View.FEELINGS ? 'currentColor' : 'none'}
            />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
