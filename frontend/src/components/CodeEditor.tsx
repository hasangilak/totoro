import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";

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
  value: string;
  onChange: (next: string) => void;
};

export const CodeEditor: React.FC<Props> = ({ path, value, onChange }: Props) => {
  return (
    <div className="h-full bg-[#313338] text-neutral-100">
      <CodeMirror
        height="100%"
        value={value}
        extensions={[langFor(path)]}
        basicSetup={{ 
          lineNumbers: true, 
          foldGutter: true, 
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          searchKeymap: true,
          closeBrackets: true,
          autocompletion: true,
        }}
        onChange={onChange}
        theme="dark"
        style={{
          fontSize: '14px',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          backgroundColor: '#313338',
        }}
      />
    </div>
  );
};
