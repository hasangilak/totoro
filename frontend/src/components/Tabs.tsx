import React from "react";

type Tab = { path: string; dirty?: boolean };

type Props = {
  tabs: Tab[];
  active: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
};

export const Tabs: React.FC<Props> = ({ tabs, active, onSelect, onClose }) => {
  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  const getFileIcon = (path: string) => {
    const name = getFileName(path);
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return '📄';
      case 'ts':
      case 'tsx':
        return '🔷';
      case 'css':
      case 'scss':
        return '🎨';
      case 'html':
        return '🌐';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      default:
        return '📄';
    }
  };

  return (
    <div className="h-10 flex items-center bg-[#313338] overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-600">
      {tabs.map(t => (
        <div
          key={t.path}
          className={`h-full px-2 sm:px-4 flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap border-r border-[#1E1F22] flex-shrink-0 ${
            active === t.path 
              ? "bg-[#313338] text-white border-t-2 border-t-[#5865F2]" 
              : "bg-[#2B2D31] text-neutral-400 hover:text-neutral-300 hover:bg-[#35373B]"
          }`}
          onClick={() => onSelect(t.path)}
          title={t.path}
        >
          <span className="text-xs">{getFileIcon(t.path)}</span>
          <span className="text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[180px]">{getFileName(t.path)}</span>
          {t.dirty && <span className="text-orange-400 text-xs">●</span>}
          <button 
            className="p-0.5 rounded hover:bg-[#404249] text-neutral-500 hover:text-neutral-300 flex-shrink-0" 
            onClick={(e) => {
              e.stopPropagation(); 
              onClose(t.path);
            }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
      
      {/* Add New Tab Button - Hidden on mobile */}
      <button className="h-full px-2 sm:px-3 items-center text-neutral-400 hover:text-neutral-300 hover:bg-[#35373B] border-r border-[#1E1F22] hidden sm:flex flex-shrink-0">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span className="ml-1 text-xs hidden md:inline">New</span>
      </button>
    </div>
  );
};
