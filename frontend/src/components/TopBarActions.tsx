import React, { useState } from 'react';

interface TopBarActionsProps {
  onNewFile: () => void;
  onNewFolder: () => void;
  onNewTerminal: () => void;
  className?: string;
}

export const TopBarActions: React.FC<TopBarActionsProps> = ({ 
  onNewFile, 
  onNewFolder, 
  onNewTerminal, 
  className = '' 
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const actions = [
    {
      id: 'file',
      label: 'New File',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      ),
      action: onNewFile,
      shortcut: 'Ctrl+N'
    },
    {
      id: 'folder',
      label: 'New Folder',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
        </svg>
      ),
      action: onNewFolder,
      shortcut: 'Ctrl+Shift+N'
    },
    {
      id: 'terminal',
      label: 'New Terminal',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      action: onNewTerminal,
      shortcut: 'Ctrl+`'
    }
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Desktop - Individual buttons */}
      <div className="hidden md:flex items-center gap-1">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className="p-1.5 hover:bg-[#404249] rounded transition-colors text-neutral-400 hover:text-neutral-300"
            title={`${action.label} (${action.shortcut})`}
          >
            {action.icon}
          </button>
        ))}
      </div>

      {/* Mobile - Dropdown menu */}
      <div className="md:hidden">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="p-1.5 hover:bg-[#404249] rounded transition-colors text-neutral-400 hover:text-neutral-300"
          title="New..."
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>

        {dropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#313338] border border-[#404249] rounded-md shadow-lg z-20">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.action();
                    setDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-[#404249] flex items-center gap-3 first:rounded-t-md last:rounded-b-md"
                >
                  {action.icon}
                  <span className="flex-1">{action.label}</span>
                  <span className="text-xs text-neutral-500">{action.shortcut}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};