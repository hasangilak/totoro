import React, { useState } from "react";
import type { FileNode, GitChange } from "../lib/fsApi";
import { GitChanges } from "./GitChanges";

type Props = {
  root: FileNode;
  currentPath?: string;
  onOpen: (path: string) => void;
  changes?: Record<string, string>;
  gitChanges?: GitChange[];
  onOpenDiff?: (path: string) => void;
  onStage?: (path: string) => void;
  onUnstage?: (path: string) => void;
  onDiscard?: (path: string) => void;
};

export const FileTree: React.FC<Props> = ({ 
  root, 
  currentPath, 
  onOpen, 
  changes, 
  gitChanges = [],
  onOpenDiff = () => {},
  onStage = () => {},
  onUnstage = () => {},
  onDiscard = () => {}
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([root.path]));
  const [activeTab, setActiveTab] = useState<'files' | 'changes'>('files');
  
  const status = (p: string) => changes?.[p];

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getFileIcon = (name: string) => {
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

  const render = (node: FileNode, level: number = 0) => {
    if (node.type === "file") {
      const active = currentPath === node.path;
      return (
        <div
          key={node.path}
          className={`cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-[#35373B] rounded-sm mx-1 ${
            active ? "bg-[#404249] text-white" : "text-neutral-300"
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => onOpen(node.path)}
          title={node.path}
        >
          <span className="mr-2 text-xs">{getFileIcon(node.name)}</span>
          <span className="truncate">{node.name}</span>
          {status(node.path) && (
            <span className="ml-auto text-xs text-orange-400 font-bold">
              {status(node.path)}
            </span>
          )}
        </div>
      );
    }

    const isExpanded = expandedFolders.has(node.path);
    const isRootFolder = level === 0;
    
    return (
      <div key={node.path}>
        <div
          className={`cursor-pointer flex items-center px-2 py-1.5 text-sm text-neutral-200 hover:bg-[#35373B] rounded-sm mx-1 ${
            isRootFolder ? 'font-semibold' : ''
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => toggleFolder(node.path)}
        >
          <svg
            className={`w-3 h-3 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="mr-2 text-xs">
            {isRootFolder ? '🏠' : (isExpanded ? '📂' : '📁')}
          </span>
          <span className="truncate">{isRootFolder ? 'Portfolio' : node.name}</span>
        </div>
        {isExpanded && (
          <div>
            {node.children.map(child => render(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col text-neutral-300 overflow-hidden">
      {/* Tab Headers */}
      <div className="flex bg-[#313338] border-b border-[#404249]">
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'files'
              ? 'text-white bg-[#2B2D31] border-b-2 border-b-[#5865F2]'
              : 'text-neutral-400 hover:text-neutral-300 hover:bg-[#35373B]'
          }`}
          onClick={() => setActiveTab('files')}
        >
          <div className="flex items-center gap-1.5 justify-center">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span>FILES</span>
          </div>
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'changes'
              ? 'text-white bg-[#2B2D31] border-b-2 border-b-[#5865F2]'
              : 'text-neutral-400 hover:text-neutral-300 hover:bg-[#35373B]'
          }`}
          onClick={() => setActiveTab('changes')}
        >
          <div className="flex items-center gap-1.5 justify-center">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>CHANGES</span>
            {gitChanges.length > 0 && (
              <span className="bg-[#5865F2] text-white text-xs px-1.5 py-0.5 rounded-full">
                {gitChanges.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'files' ? (
          <div className="p-2">
            <div className="mb-4">
              <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-neutral-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <span>EXPLORER</span>
              </div>
            </div>
            <div className="space-y-0.5">
              {render(root)}
            </div>
            
            <div className="mt-6">
              <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-neutral-200 mb-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13H14a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>OUTLINE</span>
              </div>
              
              <div className="px-2 py-1 text-sm text-neutral-400">
                No outline available
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <div className="p-2 border-b border-[#404249]">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>SOURCE CONTROL</span>
              </div>
            </div>
            <GitChanges
              changes={gitChanges}
              onOpenDiff={onOpenDiff}
              onStage={onStage}
              onUnstage={onUnstage}
              onDiscard={onDiscard}
              className="flex-1"
            />
          </div>
        )}
      </div>
    </div>
  );
};
