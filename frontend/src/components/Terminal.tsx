import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  className?: string;
  onReady?: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ className = '', onReady }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const xterm = new XTerm({
      theme: {
        background: '#2B2D31',
        foreground: '#DCDDDE',
        cursor: '#FFFFFF',
        selection: '#5865F2',
        black: '#23272A',
        red: '#F04747',
        green: '#43B581',
        yellow: '#FAA61A',
        blue: '#5865F2',
        magenta: '#B68BD9',
        cyan: '#1ABC9C',
        white: '#DCDDDE',
        brightBlack: '#36393F',
        brightRed: '#F04747',
        brightGreen: '#43B581',
        brightYellow: '#FAA61A',
        brightBlue: '#5865F2',
        brightMagenta: '#B68BD9',
        brightCyan: '#1ABC9C',
        brightWhite: '#FFFFFF'
      },
      fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", "Monaco", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      tabStopWidth: 4
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);
    
    // Open terminal
    xterm.open(terminalRef.current);
    fitAddon.fit();
    
    // Store references
    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Connect to WebSocket
    const connectWebSocket = () => {
      const wsUrl = `ws://localhost:3002/terminal?session=${sessionId}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[terminal] Connected to terminal WebSocket');
        setIsConnected(true);
        onReady?.();
      };
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'terminal:data':
              xterm.write(msg.data);
              break;
            case 'terminal:ready':
              console.log(`[terminal] Terminal ready with session ${msg.sessionId}`);
              break;
            case 'terminal:exit':
              xterm.write('\r\n\x1b[31m[Process exited]\x1b[0m\r\n');
              setIsConnected(false);
              break;
          }
        } catch (e) {
          console.error('[terminal] Invalid message:', e);
        }
      };
      
      ws.onclose = () => {
        console.log('[terminal] WebSocket connection closed');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('[terminal] WebSocket error:', error);
        setIsConnected(false);
      };
      
      wsRef.current = ws;
    };

    // Handle terminal input
    xterm.onData((data) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'terminal:input', data }));
      }
    });

    // Handle terminal resize
    const handleResize = () => {
      if (fitAddon && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        fitAddon.fit();
        wsRef.current.send(JSON.stringify({
          type: 'terminal:resize',
          cols: xterm.cols,
          rows: xterm.rows
        }));
      }
    };

    // Set up resize observer
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(terminalRef.current);

    // Initial connection
    connectWebSocket();

    // Focus terminal
    xterm.focus();

    return () => {
      // Cleanup
      resizeObserver.disconnect();
      if (wsRef.current) {
        wsRef.current.close();
      }
      xterm.dispose();
    };
  }, [sessionId, onReady]);

  return (
    <div className={`relative ${className}`}>
      {!isConnected && (
        <div className="absolute inset-0 bg-[#2B2D31] bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-center text-neutral-400">
            <div className="animate-spin w-5 h-5 border-2 border-neutral-600 border-t-neutral-300 rounded-full mb-2 mx-auto"></div>
            <div className="text-sm">Connecting to terminal...</div>
          </div>
        </div>
      )}
      <div 
        ref={terminalRef} 
        className="h-full w-full"
        style={{ 
          // Ensure terminal takes full space
          minHeight: '200px'
        }}
      />
    </div>
  );
};