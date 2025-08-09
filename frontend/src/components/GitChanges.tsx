import React from "react";
import type { GitChange } from "../lib/fsApi";

type Props = {
  changes: GitChange[];
  onOpenDiff: (path: string) => void;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
  onDiscard: (path: string) => void;
};

const badge = (c: string) => {
  const map: Record<string, string> = { M: "bg-yellow-600", A: "bg-green-600", D: "bg-red-700", R: "bg-blue-600", "?": "bg-gray-600" };
  const label = c || "•";
  return <span className={`px-1.5 py-0.5 text-xs rounded ${map[label] || "bg-gray-700"}`}>{label}</span>;
};

export const GitChanges: React.FC<Props> = ({ changes, onOpenDiff, onStage, onUnstage, onDiscard }) => {
  const sorted = [...changes].sort((a, b) => a.path.localeCompare(b.path));
  return (
    <aside className="w-72 bg-neutral-900 text-neutral-300 border-l border-neutral-800 overflow-auto">
      <div className="px-3 py-2 text-sm font-semibold sticky top-0 bg-neutral-900 border-b border-neutral-800">Changes</div>
      {sorted.map((ch) => (
        <div key={ch.path} className="px-3 py-2 border-b border-neutral-800 hover:bg-neutral-850">
          <div className="flex items-center gap-2">
            {badge(ch.working_dir || ch.index)}
            <button className="text-left flex-1 truncate hover:underline" onClick={() => onOpenDiff(ch.path)}>
              {ch.path}
            </button>
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            {ch.working_dir && (
              <button className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700" onClick={() => onStage(ch.path)}>
                Stage
              </button>
            )}
            {ch.index && (
              <button className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700" onClick={() => onUnstage(ch.path)}>
                Unstage
              </button>
            )}
            {(ch.working_dir || ch.index) && (
              <button className="px-2 py-1 rounded bg-red-800 hover:bg-red-700" onClick={() => onDiscard(ch.path)}>
                Discard
              </button>
            )}
          </div>
        </div>
      ))}
    </aside>
  );
};
