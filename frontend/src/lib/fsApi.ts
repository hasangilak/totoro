export type FileNode =
  | { type: "file"; name: string; path: string }
  | { type: "dir"; name: string; path: string; children: FileNode[] };

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

export async function fetchTree(): Promise<FileNode> {
  const res = await fetch(`${BASE}/api/fs/tree`);
  if (!res.ok) throw new Error("Failed to load tree");
  return res.json();
}

export async function fetchFile(path: string): Promise<string> {
  const url = new URL(`${BASE}/api/fs/file`);
  url.searchParams.set("path", path);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load file");
  return res.text();
}

export async function saveFile(path: string, content: string): Promise<void> {
  const res = await fetch(`${BASE}/api/fs/file`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content }),
  });
  if (!res.ok) throw new Error("Failed to save file");
}

export type GitChange = { path: string; index: string; working_dir: string };

export async function gitStatus(): Promise<{ changed: GitChange[]; branch: string; ahead: number; behind: number; }>{ 
  const res = await fetch(`${BASE}/api/git/status`); 
  if (!res.ok) throw new Error("Failed to get git status"); 
  return res.json(); 
}

export async function gitStage(path: string) { 
  await fetch(`${BASE}/api/git/stage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }); 
}
export async function gitUnstage(path: string) { 
  await fetch(`${BASE}/api/git/unstage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }); 
}
export async function gitDiscard(path: string) { 
  await fetch(`${BASE}/api/git/discard`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }); 
}
export async function gitCommit(message: string) { 
  await fetch(`${BASE}/api/git/commit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) }); 
}

export async function gitFileVersions(path: string): Promise<{ head: string; index: string; working: string }>{ 
  const url = new URL(`${BASE}/api/git/file-versions`); 
  url.searchParams.set("path", path); 
  const res = await fetch(url.toString()); 
  if (!res.ok) throw new Error("Failed to get versions"); 
  return res.json(); 
}

export async function gitStageAll(){ await fetch(`${BASE}/api/git/stage-all`, { method:'POST' }); }
export async function gitUnstageAll(){ await fetch(`${BASE}/api/git/unstage-all`, { method:'POST' }); }
export async function gitDiscardAll(){ await fetch(`${BASE}/api/git/discard-all`, { method:'POST' }); }
export async function gitSummary(){ const r = await fetch(`${BASE}/api/git/summary`); if(!r.ok) throw new Error('summary'); return r.json(); }
export async function searchRepo(q:string, globs?:string){
  const url = new URL(`${BASE}/api/search`); url.searchParams.set('q', q); if(globs) url.searchParams.set('globs', globs);
  const r = await fetch(url.toString()); if(!r.ok) throw new Error('search'); return r.json();
}
