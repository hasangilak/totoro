import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileTree } from "./components/FileTree";
import { CodeEditor } from "./components/CodeEditor";
import { GitChanges } from "./components/GitChanges";
import { GitDiffViewer } from "./components/GitDiffViewer";
import { Tabs } from "./components/Tabs";
import { QuickOpen } from "./components/QuickOpen";
import { StatusBar } from "./components/StatusBar";
import type { FileNode, GitChange } from "./lib/fsApi";
import {
  fetchTree, fetchFile, saveFile,
  gitStatus, gitStage, gitUnstage, gitDiscard, gitCommit, gitFileVersions,
  gitStageAll, gitUnstageAll, gitDiscardAll, gitSummary
} from "./lib/fsApi";
import "./styles.css";

const WS = (import.meta.env.VITE_WS_BASE ?? "ws://localhost:3001") + "/ws";

export default function App() {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [openPath, setOpenPath] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [changes, setChanges] = useState<GitChange[]>([]);
  const [diffPath, setDiffPath] = useState<string>("");
  const [diffSide, setDiffSide] = useState<"working" | "index">("working");
  const [tabs, setTabs] = useState<{path:string; dirty?:boolean}[]>([]);
  const [showQuick, setShowQuick] = useState(false);
  const [autosave, setAutosave] = useState(true);
  const [summary, setSummary] = useState<{branch:string; ahead:number; behind:number} | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gitDiffPath, setGitDiffPath] = useState<string>("");
  const saveTimer = useRef<number | null>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  async function loadTree() {
    const t = await fetchTree();
    setTree(t);
    if (!openPath) {
      const first = findFirstFile(t);
      if (first) openFile(first);
    }
  }
  async function loadStatus() {
    const s = await gitStatus();
    setChanges(s.changed);
  }
  async function loadSummary(){ try { const s = await gitSummary(); setSummary({ branch:s.branch, ahead:s.ahead, behind:s.behind }); } catch {} }

  useEffect(() => { loadTree(); loadStatus(); loadSummary(); }, []);

  // WebSocket updates
  useEffect(() => {
    const ws = new WebSocket(WS);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "fs:tree") { loadTree(); }
      if (msg.type === "git") { loadStatus(); loadSummary(); }
      if (msg.type === "fs:change" && msg.path === openPath) {
        fetchFile(openPath).then(setContent).catch(console.error);
      }
    };
    return () => ws.close();
  }, [openPath]);

  // Load file when openPath changes
  useEffect(() => { if (openPath) fetchFile(openPath).then(setContent).catch(console.error); }, [openPath]);

  // Debounced autosave
  useEffect(() => {
    if (!openPath || !autosave) return;
    setSaving("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try { await saveFile(openPath, content); setSaving("saved"); setTimeout(() => setSaving("idle"), 800); }
      catch { setSaving("idle"); }
    }, 500);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [content, openPath, autosave]);

  // Tabs dirty indicator tracks save state
  useEffect(()=>{ setTabs(ts => ts.map(t => t.path===openPath ? { ...t, dirty: saving==='saving' } : t)); }, [saving, openPath]);

  function openFile(p:string){ 
    setOpenPath(p); 
    setDiffPath(""); 
    setTabs(ts => ts.find(t=>t.path===p)?ts:[...ts, { path:p }]);
    // Close sidebar on mobile when file is opened
    if (isMobile) setSidebarOpen(false);
  }

  // Keyboard shortcuts
  useEffect(()=>{
    function onKey(e: KeyboardEvent){
      const isMac = navigator.platform.includes('Mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      
      // File operations
      if(mod && e.key.toLowerCase()==='p'){ e.preventDefault(); setShowQuick(true); }
      if(mod && e.key.toLowerCase()==='k'){ e.preventDefault(); commandPalette(); }
      if(mod && e.key.toLowerCase()==='s'){ e.preventDefault(); if(!autosave && openPath) saveFile(openPath, content); }
      
      // Git operations
      if(mod && e.key==='Enter'){ e.preventDefault(); const msg = prompt('Commit message:'); if(msg) gitCommit(msg).then(()=>{ loadStatus(); loadSummary(); }); }
      if(mod && e.shiftKey && e.key.toLowerCase()==='s'){ e.preventDefault(); if(openPath) gitStage(openPath).then(loadStatus); }
      if(mod && e.key==="Backspace"){ e.preventDefault(); if(openPath && confirm('Discard local changes for current file?')) gitDiscard(openPath).then(()=>{ loadStatus(); if (openPath) fetchFile(openPath).then(setContent); }); }
      if(mod && e.key.toLowerCase()==='d'){ e.preventDefault(); if(openPath) setGitDiffPath(openPath); } // Show diff for current file
      if(mod && e.shiftKey && e.key.toLowerCase()==='a'){ e.preventDefault(); gitStageAll().then(loadStatus); } // Stage all
      if(mod && e.shiftKey && e.key.toLowerCase()==='u'){ e.preventDefault(); gitUnstageAll().then(loadStatus); } // Unstage all
      
      // UI navigation
      if(e.key==="Escape"){ 
        e.preventDefault(); 
        if(gitDiffPath) setGitDiffPath(""); // Close diff viewer
        else if(isMobile && sidebarOpen) setSidebarOpen(false); // Close mobile sidebar
      }
    }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [openPath, content, autosave, isMobile, sidebarOpen, gitDiffPath]);

  function commandPalette(){
    const choice = window.prompt('Command: stage-all | unstage-all | discard-all | toggle-autosave');
    if(!choice) return;
    if(choice==='stage-all') gitStageAll().then(()=>{ loadStatus(); });
    else if(choice==='unstage-all') gitUnstageAll().then(()=>{ loadStatus(); });
    else if(choice==='discard-all' && confirm('Discard ALL local changes?')) gitDiscardAll().then(()=>{ loadStatus(); });
    else if(choice==='toggle-autosave') setAutosave(a=>!a);
  }

  const changesMap = useMemo(()=> Object.fromEntries(changes.map(c => [c.path, (c.working_dir||c.index)||''])) , [changes]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#2B2D31] text-neutral-100">
      {/* Mobile-First Header Bar */}
      <header className="h-12 bg-[#313338] border-b border-[#1E1F22] flex items-center justify-between px-2 md:px-4 relative z-50">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#404249] rounded-md md:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <span className="font-semibold hidden sm:block">EDD</span>
          </div>
          
          {/* Code/Preview Toggle - Hidden on small mobile */}
          <div className="hidden sm:flex bg-[#2B2D31] rounded-lg p-1">
            <button className="px-2 md:px-3 py-1 text-xs md:text-sm rounded-md bg-[#5865F2] text-white">
              code
            </button>
            <button className="px-2 md:px-3 py-1 text-xs md:text-sm rounded-md text-neutral-400 hover:text-white">
              PREVIEW
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-3">
          {/* Status - Condensed on mobile */}
          <span className="text-xs md:text-sm text-neutral-400 hidden sm:block">
            {saving === "saving" ? "Saving..." : saving === "saved" ? "Saved" : "Ready"}
          </span>
          
          {/* Mobile Console Toggle */}
          {isMobile && (
            <button
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="p-1.5 hover:bg-[#404249] rounded md:hidden"
              title="Toggle Console"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button className="p-1.5 hover:bg-[#404249] rounded">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="p-1.5 hover:bg-[#404249] rounded">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="p-1.5 hover:bg-[#404249] rounded">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        {tree ? (
          <>
            {/* Mobile Sidebar Overlay */}
            {isMobile && sidebarOpen && (
              <div
                className="absolute inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <aside className={`
              bg-[#2B2D31] border-r border-[#1E1F22] flex flex-col z-40 transition-transform duration-300 ease-in-out
              ${isMobile 
                ? `absolute left-0 top-0 bottom-0 w-80 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` 
                : 'w-64 relative'
              }
            `}>
              <FileTree 
                root={tree} 
                currentPath={openPath} 
                onOpen={openFile} 
                changes={changesMap} 
                gitChanges={changes}
                onOpenDiff={(path) => setGitDiffPath(path)}
                onStage={async (path) => { await gitStage(path); loadStatus(); }}
                onUnstage={async (path) => { await gitUnstage(path); loadStatus(); }}
                onDiscard={async (path) => { 
                  if (confirm('Discard changes for ' + path.split('/').pop() + '?')) {
                    await gitDiscard(path); 
                    loadStatus(); 
                    if (path === openPath) fetchFile(openPath).then(setContent);
                  }
                }}
              />
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-[#313338] min-w-0">
              {/* Tabs */}
              <div className="border-b border-[#1E1F22] overflow-hidden">
                <Tabs tabs={tabs} active={openPath||null} onSelect={openFile} onClose={(p)=> setTabs(ts=> ts.filter(t=>t.path!==p))} />
              </div>

              {/* Editor Area */}
              <section className="flex-1 bg-[#313338] flex flex-col min-h-0">
                <div className="flex-1 min-h-0">
                  {gitDiffPath ? (
                    <GitDiffViewer 
                      path={gitDiffPath} 
                      onClose={() => setGitDiffPath("")}
                      onStage={async () => { await gitStage(gitDiffPath); loadStatus(); setGitDiffPath(""); }}
                      onDiscard={async () => { 
                        if (confirm('Discard all changes for ' + gitDiffPath.split('/').pop() + '?')) {
                          await gitDiscard(gitDiffPath); 
                          loadStatus(); 
                          if (gitDiffPath === openPath) fetchFile(openPath).then(setContent);
                          setGitDiffPath("");
                        }
                      }}
                    />
                  ) : diffPath ? (
                    <DiffView path={diffPath} side={diffSide} onAcceptRight={async (p)=>{ await gitStage(p); setDiffSide("index"); loadStatus(); }} />
                  ) : openPath ? (
                    <CodeEditor path={openPath} value={content} onChange={setContent} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400">
                      <div className="text-center p-4">
                        <div className="text-4xl md:text-6xl mb-4">📁</div>
                        <div className="text-sm md:text-base">
                          {isMobile ? "Tap the menu to select a file" : "Select a file to start editing"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Console/Bottom Panel - Responsive */}
                <div className={`
                  bg-[#2B2D31] border-t border-[#1E1F22] flex flex-col transition-all duration-300
                  ${isMobile 
                    ? (consoleOpen ? 'h-48' : 'h-0 overflow-hidden')
                    : 'h-32'
                  }
                `}>
                  <div className="h-8 bg-[#313338] border-b border-[#1E1F22] flex items-center px-3 text-sm flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Console</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs text-neutral-400 hidden sm:inline">No Issues ✓</span>
                      <span className="text-xs text-neutral-400 hidden md:inline">Files: 0</span>
                      <span className="text-xs text-neutral-400 hidden md:inline">Project: 0</span>
                      <span className="text-xs text-neutral-400 hidden lg:inline">UTF-8</span>
                      <button 
                        className="p-1 hover:bg-[#404249] rounded"
                        onClick={() => isMobile ? setConsoleOpen(false) : undefined}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-2 md:p-3 text-xs md:text-sm font-mono text-neutral-300 overflow-y-auto">
                    <div className="text-neutral-500">[12:04:25] Starting 'sass'...</div>
                    <div className="text-neutral-500">[12:04:25] Starting 'browser-sync'...</div>
                    <div className="text-neutral-500">[12:04:25] Finished 'browser-sync' after 24 ms</div>
                    <div className="text-blue-400">[BS] Access URLs:</div>
                  </div>
                </div>
              </section>
            </main>

            <QuickOpen open={showQuick} onClose={()=>setShowQuick(false)} root={tree} onPick={openFile} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400">
            <div className="text-center p-4">
              <div className="animate-spin w-6 md:w-8 h-6 md:h-8 border-2 border-neutral-600 border-t-neutral-300 rounded-full mb-4 mx-auto"></div>
              <div className="text-sm md:text-base">Loading project tree...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function findFirstFile(node: FileNode): string | null {
  if (node.type === "file") return node.path;
  for (const c of node.children) { const p = findFirstFile(c); if (p) return p; }
  return null;
}

function DiffView({ path, side, onAcceptRight }: { path: string; side: "working" | "index"; onAcceptRight: (p: string)=>void }) {
  return (
    <div className="h-full">
      <LazyDiff path={path} side={side} onAcceptRight={onAcceptRight} />
    </div>
  );
}

function LazyDiff({ path, side, onAcceptRight }: { path: string; side: "working" | "index"; onAcceptRight: (p: string)=>void }) {
  const [key, setKey] = useState(0);
  useEffect(()=>{ setKey(k=>k+1); }, [path, side]);
  const fetchVersions = (p: string) => gitFileVersions(p);
  const DiffPanel = React.lazy(() => import("./components/DiffPanel").then(m => ({ default: m.DiffPanel })));
  return (
    <React.Suspense fallback={<div className="p-4 text-neutral-400">Loading diff…</div>}>
      <DiffPanel key={key} path={path} side={side} fetchVersions={fetchVersions} onAcceptRight={onAcceptRight} />
    </React.Suspense>
  );
}