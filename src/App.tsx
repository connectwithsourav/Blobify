/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GlobalConfig, Layer } from './types';
import { Controls } from './components/Controls';
import { Preview } from './components/Preview';
import { ExportModal } from './components/ExportModal';
import { generateExportCode } from './lib/exportTemplate';
import { SlidersHorizontal, MonitorPlay } from 'lucide-react';

export default function App() {
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    speed: 1.0,
    tension: 0.7,
    showPoints: false,
  });

  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'layer-1',
      data: [60, 40, 80, 50, 90, 70],
      staticColors: ['#FF0080', '#7928CA'],
      autoAnimateColors: false,
      autoColors: ['#FF0080', '#00DFD8', '#7928CA'],
      colorSpeed: 1.0,
      opacity: 0.8,
      blur: 20,
    }
  ]);

  const [activeLayerId, setActiveLayerId] = useState('layer-1');
  const [activeTab, setActiveTab] = useState<'controls' | 'preview'>('preview');
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExport = () => {
    setShowExportModal(true);
  };

  return (
    <div className="flex flex-col w-full h-[100dvh] overflow-hidden bg-base text-white font-sans selection:bg-accent/30 selection:text-white relative">
      
      {/* Main Dual-Pane / Toggle Layout */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
        {/* Controls Pane */}
        <div className={`w-full md:w-[400px] lg:w-[460px] xl:w-[500px] flex-shrink-0 h-full border-r border-border bg-pane relative z-20 flex-col transition-opacity ${activeTab === 'controls' ? 'flex' : 'hidden md:flex'}`}>
          <Controls 
            config={globalConfig}
            setConfig={setGlobalConfig}
            layers={layers}
            setLayers={setLayers}
            activeLayerId={activeLayerId}
            setActiveLayerId={setActiveLayerId}
            onExport={handleExport}
          />
        </div>
        
        {/* Preview Pane */}
        <div className={`flex-1 h-full relative bg-preview-bg overflow-hidden ${activeTab === 'preview' ? 'block' : 'hidden md:block'}`}>
          <Preview 
            config={globalConfig}
            layers={layers}
          />
        </div>
      </div>

      {/* Mobile Bottom Tabs (Appears exclusively on small screens) */}
      <div className="md:hidden flex-none flex h-[calc(60px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-pane border-t border-border z-30 w-full relative">
        <button 
          onClick={() => setActiveTab('controls')}
          className={`flex-1 flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider font-medium transition-colors ${activeTab === 'controls' ? 'text-accent bg-[#1a1a1a] shadow-[inset_0_2px_0_var(--color-accent)]' : 'text-[#666]'}`}
        >
          <SlidersHorizontal size={16} /> Controls
        </button>
        <button 
          onClick={() => setActiveTab('preview')}
          className={`flex-1 flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider font-medium transition-colors ${activeTab === 'preview' ? 'text-accent bg-[#1a1a1a] shadow-[inset_0_2px_0_var(--color-accent)]' : 'text-[#666]'}`}
        >
          <MonitorPlay size={16} /> Preview
        </button>
      </div>

      {showExportModal && (
        <ExportModal 
          code={generateExportCode(globalConfig, layers)} 
          onClose={() => setShowExportModal(false)} 
        />
      )}
      
    </div>
  );
}
