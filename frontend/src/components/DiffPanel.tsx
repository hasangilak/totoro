import React, { useEffect, useState } from "react";
import { MergeView } from "@codemirror/merge";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";

type Versions = { head: string; index: string; working: string };

function langFor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return javascript({ jsx: true, typescript: true });
    case "js":
    case "jsx":
      return javascript({ jsx: true });
    case "html":
      return html();
    case "css":
      return css();
    case "json":
      return json();
    case "md":
    case "markdown":
      return markdown();
    default:
      return [];
  }
}

type Props = {
  path: string;
  side: "working" | "index";
  fetchVersions: (path: string) => Promise<Versions>;
  onAcceptRight?: (path: string) => void;
};

export const DiffPanel: React.FC<Props> = ({ path, side, fetchVersions, onAcceptRight }: Props) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [versions, setVersions] = useState<Versions | null>(null);

  useEffect(() => { fetchVersions(path).then(setVersions); }, [path, side]);

  useEffect(() => {
    if (!container || !versions) return;
    const left = versions.head;
    const right = side === "working" ? versions.working : versions.index;

    const mv = new MergeView({
      parent: container,
      orientation: "a-b",
      gutter: true,
      highlightChanges: true,
      revertControls: "a-to-b",
      a: { doc: left, extensions: [langFor(path), EditorView.editable.of(false)] },
      b: { doc: right, extensions: [langFor(path)] },
    });
    return () => mv.destroy();
  }, [container, versions, side, path]);

  return (
    <div className="h-full flex flex-col">
      <div className="h-10 px-3 border-b border-neutral-800 flex items-center gap-3 text-xs">
        <span className="opacity-70">Diff:</span>
        <span className="font-mono">{path}</span>
        <span className="opacity-60">HEAD → {side}</span>
        <div className="flex-1" />
        {onAcceptRight && (
          <button className="px-2 py-1 rounded bg-green-700 hover:bg-green-600" onClick={() => onAcceptRight(path)}>
            Approve (take right)
          </button>
        )}
      </div>
      <div className="flex-1" ref={setContainer} />
    </div>
  );
};
