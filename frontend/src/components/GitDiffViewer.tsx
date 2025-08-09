import React, { useState, useEffect } from "react";
import { gitDiff, gitStageHunk, gitDiscardHunk, type DiffHunk } from "../lib/fsApi";

type Props = {
  path: string;
  onClose: () => void;
  onStage: () => void;
  onDiscard: () => void;
};

export const GitDiffViewer: React.FC<Props> = ({ path, onClose, onStage, onDiscard }) => {
  const [diff, setDiff] = useState<{path: string; target: string; hunks: DiffHunk[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<'working' | 'staged'>('working');

  useEffect(() => {
    loadDiff();
  }, [path, target]);

  const loadDiff = async () => {
    try {
      setLoading(true);
      const result = await gitDiff(path, target);
      setDiff(result);
    } catch (error) {
      console.error('Failed to load diff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageHunk = async (hunkIndex: number) => {
    try {
      await gitStageHunk(path, hunkIndex);
      onStage();
      loadDiff(); // Reload to show updated state
    } catch (error) {
      console.error('Failed to stage hunk:', error);
    }
  };

  const handleDiscardHunk = async (hunkIndex: number) => {
    if (confirm('Discard these changes? This cannot be undone.')) {
      try {
        await gitDiscardHunk(path, hunkIndex);
        onDiscard();
        loadDiff(); // Reload to show updated state
      } catch (error) {
        console.error('Failed to discard hunk:', error);
      }
    }
  };

  const getFileName = (path: string) => path.split('/').pop() || path;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#313338] text-neutral-400">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-neutral-600 border-t-neutral-300 rounded-full mb-2 mx-auto"></div>
          <div className="text-sm">Loading diff...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#313338] text-neutral-100">
      {/* Header */}
      <div className="h-12 bg-[#2B2D31] border-b border-[#1E1F22] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#404249] rounded text-neutral-400 hover:text-neutral-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <h3 className="font-medium text-sm">{getFileName(path)}</h3>
            <p className="text-xs text-neutral-400">{path}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Target Toggle */}
          <div className="flex bg-[#404249] rounded-lg p-1 text-xs">
            <button
              className={`px-2 py-1 rounded ${target === 'working' ? 'bg-[#5865F2] text-white' : 'text-neutral-400 hover:text-white'}`}
              onClick={() => setTarget('working')}
            >
              Working
            </button>
            <button
              className={`px-2 py-1 rounded ${target === 'staged' ? 'bg-[#5865F2] text-white' : 'text-neutral-400 hover:text-white'}`}
              onClick={() => setTarget('staged')}
            >
              Staged
            </button>
          </div>
          
          {/* Action Buttons */}
          <button
            onClick={onStage}
            className="px-3 py-1.5 text-xs bg-green-700 hover:bg-green-600 rounded text-white"
          >
            Stage All
          </button>
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 text-xs bg-red-700 hover:bg-red-600 rounded text-white"
          >
            Discard All
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto font-mono text-sm">
        {!diff?.hunks.length ? (
          <div className="h-full flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <div className="text-4xl mb-2">✓</div>
              <div>No changes to display</div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {diff.hunks.map((hunk, hunkIndex) => (
              <div key={hunkIndex} className="border border-[#404249] rounded-lg overflow-hidden">
                {/* Hunk Header */}
                <div className="bg-[#2B2D31] px-4 py-2 border-b border-[#404249] flex items-center justify-between">
                  <div className="text-xs text-blue-400">{hunk.header}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStageHunk(hunkIndex)}
                      className="px-2 py-1 text-xs bg-green-700 hover:bg-green-600 rounded text-white"
                      title="Stage this hunk"
                    >
                      ✓ Stage
                    </button>
                    <button
                      onClick={() => handleDiscardHunk(hunkIndex)}
                      className="px-2 py-1 text-xs bg-red-700 hover:bg-red-600 rounded text-white"
                      title="Discard this hunk"
                    >
                      ✕ Discard
                    </button>
                  </div>
                </div>
                
                {/* Hunk Changes */}
                <div className="bg-[#313338]">
                  {hunk.changes.map((change, changeIndex) => {
                    let bgColor = '';
                    let textColor = 'text-neutral-300';
                    let prefix = ' ';
                    let lineNumber = '';
                    
                    if (change.type === 'add') {
                      bgColor = 'bg-green-900/30';
                      textColor = 'text-green-300';
                      prefix = '+';
                      lineNumber = change.newLine?.toString() || '';
                    } else if (change.type === 'remove') {
                      bgColor = 'bg-red-900/30';
                      textColor = 'text-red-300';
                      prefix = '-';
                      lineNumber = change.oldLine?.toString() || '';
                    } else {
                      lineNumber = `${change.oldLine || ''} ${change.newLine || ''}`.trim();
                    }
                    
                    return (
                      <div
                        key={changeIndex}
                        className={`flex ${bgColor} hover:bg-opacity-50`}
                      >
                        <div className="w-16 px-2 py-1 text-xs text-neutral-500 text-right bg-[#2B2D31] border-r border-[#404249] select-none">
                          {lineNumber}
                        </div>
                        <div className="w-6 px-1 py-1 text-center text-xs text-neutral-400 bg-[#2B2D31] border-r border-[#404249] select-none">
                          {prefix}
                        </div>
                        <div className={`flex-1 px-3 py-1 ${textColor} whitespace-pre-wrap break-all`}>
                          {change.line || ' '}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};