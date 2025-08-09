import React, { useEffect, useMemo, useState } from "react";
import type { FileNode } from "../lib/fsApi";

function flatten(node: FileNode): string[] {
  if (node.type === "file") return [node.path];
  return node.children.flatMap(flatten);
}

function score(q: string, text: string) { // tiny fuzzy score
  q = q.toLowerCase(); text = text.toLowerCase();
  let i = 0, s = 0; for (const c of text) { if (i<q.length && c===q[i]) { i++; s+=2; } else s-=0.1; }
  return i===q.length ? s : -Infinity;
}

type Props = { open: boolean; onClose: ()=>void; root: FileNode; onPick: (path:string)=>void };

export const QuickOpen: React.FC<Props> = ({ open, onClose, root, onPick }) => {
  const files = useMemo(()=> flatten(root), [root]);
  const [q, setQ] = useState("");
  const results = useMemo(()=> files
    .map(p=>({ p, s: score(q, p.replace(/^\//, "")) }))
    .filter(r=>r.s>-Infinity)
    .sort((a,b)=>b.s-a.s)
    .slice(0, 30)
  , [q, files]);

  useEffect(()=>{
    function onKey(e: KeyboardEvent){ if(e.key==='Escape') onClose(); }
    if(open) window.addEventListener('keydown', onKey); else setQ('');
    return ()=> window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if(!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-24">
      <div className="w-[640px] bg-neutral-900 border border-neutral-800 rounded-md overflow-hidden shadow-xl">
        <input
          autoFocus
          className="w-full p-3 bg-neutral-800 border-b border-neutral-700 outline-none"
          placeholder="Quick open… (type to filter)"
          value={q}
          onChange={e=>setQ(e.target.value)}
        />
        <div className="max-h-96 overflow-auto">
          {results.map(r=> (
            <div key={r.p} className="px-3 py-2 text-sm hover:bg-neutral-800 cursor-pointer" onClick={()=>{ onPick(r.p); onClose(); }}>
              {r.p}
            </div>
          ))}
          {!results.length && <div className="px-3 py-6 text-neutral-500 text-sm">No matches</div>}
        </div>
      </div>
    </div>
  );
};
