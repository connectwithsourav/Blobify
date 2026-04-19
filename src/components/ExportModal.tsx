import { useState } from 'react';

interface ExportModalProps {
  code: string;
  onClose: () => void;
}

export function ExportModal({ code, onClose }: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111111] border border-border w-full max-w-4xl flex flex-col h-[85vh] shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-[13px] font-bold text-accent uppercase tracking-[2px]">Export Source Code</h2>
          <button onClick={onClose} className="text-[#666] hover:text-[#FFF] text-[11px] uppercase tracking-wider cursor-pointer">
            [ CLOSE ]
          </button>
        </div>
        
        <div className="p-6 bg-[#050505] flex-1 overflow-auto">
          <p className="text-[11px] text-[#AAA] mb-4 uppercase tracking-[1px] leading-relaxed">
            // This is an isolated embed snippet.<br/>
            // Paste exactly where you want the blob to appear on your website.
          </p>
          <pre className="text-[10px] font-mono bg-[#111111] text-accent p-4 overflow-x-auto whitespace-pre-wrap border border-border shadow-inner">
            <code>{code}</code>
          </pre>
        </div>
        
        <div className="p-6 border-t border-border flex justify-end bg-pane">
          <button onClick={handleCopy} className="bg-accent text-[#000] px-8 py-3 text-[11px] font-bold uppercase tracking-[2px] hover:bg-[#00e685] transition-colors cursor-pointer border-none outline-none">
            {copied ? 'Copied to Clipboard' : 'Copy Snippet'}
          </button>
        </div>
      </div>
    </div>
  );
}
