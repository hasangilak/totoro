import React from "react";
import type { GitChange } from "../lib/fsApi";

type Props = {
  changes: GitChange[];
  onOpenDiff: (path: string) => void;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
  onDiscard: (path: string) => void;
  className?: string;
};

const badge = (c: string) => {
  const map: Record<string, string> = { 
    M: "bg-yellow-600 text-yellow-100", 
    A: "bg-green-600 text-green-100", 
    D: "bg-red-700 text-red-100", 
    R: "bg-blue-600 text-blue-100", 
    "?": "bg-gray-600 text-gray-100" 
  };
  const label = c || "•";
  return <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${map[label] || "bg-gray-700 text-gray-100"}`}>{label}</span>;
};

const getFileIcon = (path: string) => {
  const name = path.split('/').pop() || '';
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

const getFileName = (path: string) => path.split('/').pop() || path;

export const GitChanges: React.FC<Props> = ({ changes, onOpenDiff, onStage, onUnstage, onDiscard, className = "" }) => {
  const sorted = [...changes].sort((a, b) => a.path.localeCompare(b.path));
  
  if (!changes.length) {
    return (
      <div className={`text-neutral-400 ${className}`}>
        <div className="p-4 text-center">
          <div className="text-2xl mb-2">✓</div>
          <div className="text-sm">No changes</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`text-neutral-300 overflow-auto ${className}`}>
      {sorted.map((ch) => (
        <div key={ch.path} className="px-2 py-2 border-b border-[#404249] hover:bg-[#35373B] group">
          <div className="flex items-center gap-2 mb-2">
            {badge(ch.working_dir || ch.index)}
            <span className="text-xs mr-1">{getFileIcon(ch.path)}</span>
            <button 
              className="text-left flex-1 truncate hover:text-white text-sm font-medium" 
              onClick={() => onOpenDiff(ch.path)}
              title={ch.path}
            >
              {getFileName(ch.path)}
            </button>
          </div>
          
          {/* Action buttons - show on hover or always on mobile */}
          <div className="flex gap-1.5 text-xs opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
            {ch.working_dir && (
              <button 
                className="px-2 py-1 rounded bg-green-700 hover:bg-green-600 text-green-100 font-medium" 
                onClick={() => onStage(ch.path)}
                title="Stage changes"
              >
                Stage
              </button>
            )}
            {ch.index && (
              <button 
                className="px-2 py-1 rounded bg-yellow-700 hover:bg-yellow-600 text-yellow-100 font-medium" 
                onClick={() => onUnstage(ch.path)}
                title="Unstage changes"
              >
                Unstage
              </button>
            )}
            {(ch.working_dir || ch.index) && (
              <button 
                className="px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-red-100 font-medium" 
                onClick={() => onDiscard(ch.path)}
                title="Discard changes"
              >
                Discard
              </button>
            )}
            <button
              className="px-2 py-1 rounded bg-[#404249] hover:bg-[#4A4D52] text-neutral-300 font-medium"
              onClick={() => onOpenDiff(ch.path)}
              title="View diff"
            >
              Diff
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
