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
  const retryCountRef = useRef(0);
  const maxRetries = 5;

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
    
    // Store references
    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;
    
    // Wait for DOM to be ready before fitting
    setTimeout(() => {
      try {
        if (terminalRef.current && fitAddon) {
          fitAddon.fit();
        }
      } catch (e) {
        console.warn('[terminal] Initial fit failed:', e);
      }
    }, 100);

    // Connect to WebSocket
    const connectWebSocket = () => {
      const wsUrl = `ws://localhost:3002/terminal?session=${sessionId}`;
      console.log('[terminal] Attempting to connect to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[terminal] Connected to terminal WebSocket');
        setIsConnected(true);
        retryCountRef.current = 0; // Reset retry counter on successful connection
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
      
      ws.onclose = (event) => {
        console.log('[terminal] WebSocket connection closed', event.code, event.reason);
        setIsConnected(false);
        // Only reconnect if it's not a clean close and we haven't exceeded retries
        if (event.code !== 1000 && !event.wasClean && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`[terminal] Reconnecting... (attempt ${retryCountRef.current}/${maxRetries})`);
          setTimeout(connectWebSocket, Math.min(3000 * retryCountRef.current, 10000)); // Exponential backoff
        } else if (retryCountRef.current >= maxRetries) {
          console.error('[terminal] Max reconnection attempts reached');
        }
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
      try {
        if (fitAddon && terminalRef.current) {
          // Check if element has dimensions
          const rect = terminalRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            fitAddon.fit();
            
            // Send resize to backend if connected
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'terminal:resize',
                cols: xterm.cols,
                rows: xterm.rows
              }));
            }
          }
        }
      } catch (e) {
        console.warn('[terminal] Resize failed:', e);
      }
    };

    // Set up resize observer
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(terminalRef.current);

    // Initial connection with delay to ensure server is ready
    setTimeout(connectWebSocket, 200);

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