import React from "react";

type Props = {
  branch: string;
  ahead: number;
  behind: number;
  state: string; // idle | saving | saved
  autosave: boolean;
  onToggleAutosave: ()=>void;
};

export const StatusBar: React.FC<Props> = ({ branch, ahead, behind, state, autosave, onToggleAutosave }) => {
  return (
    <div className="h-8 text-xs px-3 border-t border-neutral-800 bg-neutral-900 flex items-center gap-3">
      <span className="opacity-70"></span>
      <span className="font-mono">{branch || "(no branch)"}</span>
      <span className="opacity-60">↑{ahead} ↓{behind}</span>
      <div className="flex-1" />
      <button className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700" onClick={onToggleAutosave}>
        Autosave: {autosave?"On":"Off"}
      </button>
      <span className="opacity-70">{state}</span>
    </div>
  );
};
