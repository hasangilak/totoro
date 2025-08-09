import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from './Terminal';

export interface TerminalInstance {
  id: string;
  name: string;
  active: boolean;
}

interface TerminalManagerProps {
  className?: string;
}

export interface TerminalManagerRef {
  addTerminal: () => void;
}

const TerminalManagerComponent: React.ForwardRefRenderFunction<TerminalManagerRef, TerminalManagerProps> = ({ className = '' }, ref) => {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([
    { id: '1', name: 'Terminal 1', active: true }
  ]);
  const [activeTerminal, setActiveTerminal] = useState<string>('1');

  const addTerminal = useCallback(() => {
    const newId = (Date.now()).toString();
    const newTerminal: TerminalInstance = {
      id: newId,
      name: `Terminal ${terminals.length + 1}`,
      active: false
    };
    
    setTerminals(prev => prev.map(t => ({ ...t, active: false })).concat({ ...newTerminal, active: true }));
    setActiveTerminal(newId);
  }, [terminals.length]);

  const closeTerminal = useCallback((id: string) => {
    if (terminals.length <= 1) return; // Keep at least one terminal
    
    const terminalIndex = terminals.findIndex(t => t.id === id);
    const newTerminals = terminals.filter(t => t.id !== id);
    
    // If closing active terminal, activate another one
    if (id === activeTerminal && newTerminals.length > 0) {
      const newActiveIndex = Math.min(terminalIndex, newTerminals.length - 1);
      const newActiveId = newTerminals[newActiveIndex].id;
      setActiveTerminal(newActiveId);
      setTerminals(newTerminals.map(t => ({ ...t, active: t.id === newActiveId })));
    } else {
      setTerminals(newTerminals);
    }
  }, [terminals, activeTerminal]);

  const switchTerminal = useCallback((id: string) => {
    setActiveTerminal(id);
    setTerminals(prev => prev.map(t => ({ ...t, active: t.id === id })));
  }, []);

  const renameTerminal = useCallback((id: string, newName: string) => {
    setTerminals(prev => prev.map(t => 
      t.id === id ? { ...t, name: newName } : t
    ));
  }, []);

  useImperativeHandle(ref, () => ({
    addTerminal
  }), [addTerminal]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Terminal Tabs */}
      <div className="h-8 bg-[#313338] border-b border-[#1E1F22] flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-600">
        {terminals.map(terminal => (
          <div
            key={terminal.id}
            className={`h-full px-3 flex items-center gap-2 cursor-pointer whitespace-nowrap border-r border-[#1E1F22] flex-shrink-0 text-xs ${
              activeTerminal === terminal.id
                ? "bg-[#2B2D31] text-white border-t-2 border-t-[#5865F2]"
                : "bg-[#313338] text-neutral-400 hover:text-neutral-300 hover:bg-[#35373B]"
            }`}
            onClick={() => switchTerminal(terminal.id)}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span 
              className="truncate max-w-[80px]"
              onDoubleClick={(e) => {
                e.stopPropagation();
                const newName = prompt('Terminal name:', terminal.name);
                if (newName && newName.trim()) {
                  renameTerminal(terminal.id, newName.trim());
                }
              }}
            >
              {terminal.name}
            </span>
            {terminals.length > 1 && (
              <button
                className="p-0.5 rounded hover:bg-[#404249] text-neutral-500 hover:text-neutral-300 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(terminal.id);
                }}
                title="Close terminal"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
        
        {/* Add Terminal Button */}
        <button
          onClick={addTerminal}
          className="h-full px-2 flex items-center gap-1 text-neutral-400 hover:text-neutral-300 hover:bg-[#35373B] flex-shrink-0"
          title="New terminal"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative">
        {terminals.map(terminal => (
          <div
            key={terminal.id}
            className={`absolute inset-0 ${activeTerminal === terminal.id ? 'block' : 'hidden'}`}
          >
            <Terminal className="h-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const TerminalManager = forwardRef<TerminalManagerRef, TerminalManagerProps>(TerminalManagerComponent);
TerminalManager.displayName = 'TerminalManager';