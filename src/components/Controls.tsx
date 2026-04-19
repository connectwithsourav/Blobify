import React from 'react';
import { GlobalConfig, Layer } from '../types';

import { ColorPicker } from './ColorPicker';

interface ControlsProps {
  config: GlobalConfig;
  setConfig: React.Dispatch<React.SetStateAction<GlobalConfig>>;
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  onExport: () => void;
}

export function Controls({
  config, setConfig,
  layers, setLayers,
  activeLayerId, setActiveLayerId,
  onExport
}: ControlsProps) {
  
  const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];
  const activeLayerIndex = layers.findIndex(l => l.id === activeLayerId);

  const updateLayer = (updates: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === activeLayer.id ? { ...l, ...updates } : l));
  };

  const addLayer = () => {
    if (layers.length >= 3) return;
    const newId = `layer-${Date.now()}`;
    setLayers(prev => [...prev, {
      id: newId,
      data: Array.from({ length: 6 }, () => 50),
      staticColors: ['#FF0080', '#00DFD8'],
      autoAnimateColors: false,
      autoColors: ['#FF0080', '#00DFD8', '#F5E100'],
      colorSpeed: 1.0,
      opacity: 0.8,
      blur: 20,
    }]);
    setActiveLayerId(newId);
  };

  const deleteLayer = () => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== activeLayer.id));
    setActiveLayerId(layers[0].id === activeLayer.id ? layers[1].id : layers[0].id);
  };

  const randomizeData = () => {
    updateLayer({ data: activeLayer.data.map(() => Math.floor(Math.random() * 100)) });
  };

  const setPointValue = (index: number, val: number) => {
    const newData = [...activeLayer.data];
    newData[index] = val;
    updateLayer({ data: newData });
  };

  const addDataPoint = () => {
    if (activeLayer.data.length >= 15) return;
    const val = activeLayer.data[activeLayer.data.length - 1];
    updateLayer({ data: [...activeLayer.data, val] });
  };

  const removeDataPoint = () => {
    if (activeLayer.data.length <= 3) return;
    updateLayer({ data: activeLayer.data.slice(0, -1) });
  };

  return (
    <div className="flex flex-col h-full w-full text-white bg-pane overflow-hidden">
      {/* Header - Fixed Height */}
      <div className="flex-none p-6 border-b border-border bg-pane">
        <div>
          <h1 className="text-[18px] font-black text-accent uppercase tracking-[4px]">BLOBIFY</h1>
          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">V.2.5</p>
        </div>
      </div>

      {/* Main Scrollable Config Area */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar relative">
        {/* Global Controls */}
        <div className="p-5 border-b border-border">
          <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[2px] mb-4 flex justify-between">
            Global Controls <span className="text-[#444]">Core</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] text-[#AAA] mb-2 uppercase tracking-wider">
                <span>Animation Speed</span>
                <span>{config.speed.toFixed(1)}s</span>
              </div>
              <input type="range" min="0.1" max="3.0" step="0.1" value={config.speed}
                onChange={e => setConfig({ ...config, speed: parseFloat(e.target.value) })}
                className="w-full" />
            </div>

            <div>
               <div className="flex justify-between text-[11px] text-[#AAA] mb-2 uppercase tracking-wider">
                <span>Curve Tension</span>
                <span>{config.tension.toFixed(2)}</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={config.tension}
                onChange={e => setConfig({ ...config, tension: parseFloat(e.target.value) })}
                className="w-full" />
            </div>

            <div className="flex items-center justify-between pt-2 mt-4">
              <span className="text-[11px] text-[#AAA] uppercase tracking-wider">Show Vertices</span>
              <button 
                type="button"
                onClick={() => setConfig({ ...config, showPoints: !config.showPoints })}
                className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer outline-none border-none ${config.showPoints ? 'bg-border' : 'bg-[#222222]'}`}
              >
                <div className={`absolute top-[2px] w-3 h-3 rounded-full transition-all ${config.showPoints ? 'right-[2px] bg-accent' : 'left-[2px] bg-[#666]'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Layers Section */}
        <div className="p-5 pb-8">
          <div className="flex border-b border-[#222] mb-6">
            {layers.map((layer, idx) => (
              <button
                key={layer.id}
                onClick={() => setActiveLayerId(layer.id)}
                className={`flex-1 relative pb-3 text-center text-[10px] font-bold tracking-[2px] uppercase transition-colors outline-none cursor-pointer ${
                  activeLayerId === layer.id 
                  ? 'text-accent' 
                  : 'text-[#666] hover:text-[#aaa]'
                }`}
              >
                Layer {idx + 1}
                {activeLayerId === layer.id && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent shadow-[0_0_8px_rgba(0,255,148,0.5)] z-10" />
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-between mb-4">
            {layers.length < 3 && (
              <button onClick={addLayer} className="text-[9px] uppercase tracking-[1px] text-white/50 bg-[#333] py-2 px-3 hover:text-white transition-colors cursor-pointer">
                + Add Layer
              </button>
            )}
            {layers.length > 1 && (
               <button onClick={deleteLayer} className="text-[9px] uppercase tracking-[1px] text-red-500/70 bg-[#333] py-2 px-3 hover:text-red-500 transition-colors ml-auto cursor-pointer">
                Trash Layer
               </button>
            )}
          </div>

          {/* Active Layer Controls */}
          {activeLayer && (
            <div className="animate-in fade-in duration-200">
              {/* Data Points */}
              <div>
                <div className="flex justify-between text-[11px] text-[#AAA] mb-2 uppercase tracking-wider">
                  <span>Data Points</span>
                  <span>({activeLayer.data.length} Vertices)</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2 mt-3">
                  {activeLayer.data.map((val, idx) => (
                    <div key={idx} className="h-10 bg-[#222222] border border-[#333333] flex items-center px-4 gap-3">
                      <span className="text-[10px] text-accent font-mono w-4">{(idx + 1).toString().padStart(2, '0')}</span>
                      <input type="range" min="0" max="100" value={val} 
                        onChange={(e) => setPointValue(idx, parseInt(e.target.value))}
                        className="flex-1" />
                      <span className="text-[10px] text-accent font-mono w-6 text-right">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <button onClick={addDataPoint} disabled={activeLayer.data.length >= 15} className="cursor-pointer flex-1 bg-[#333] text-[9px] py-2 text-center uppercase tracking-[1px] text-white/70 hover:text-white disabled:opacity-50">
                    + Add Point
                  </button>
                  <button onClick={removeDataPoint} disabled={activeLayer.data.length <= 3} className="cursor-pointer flex-1 bg-[#333] text-[9px] py-2 text-center uppercase tracking-[1px] text-white/70 hover:text-white disabled:opacity-50">
                    - Remove
                  </button>
                  <button onClick={randomizeData} className="cursor-pointer flex-1 bg-[#333] text-[9px] py-2 text-center uppercase tracking-[1px] text-accent hover:bg-[#444] transition-colors">
                    Random
                  </button>
                </div>
              </div>

              {/* Layer Style Properties */}
              <div className="space-y-6 mt-6 pt-6 border-t border-[#333]">
                <div>
                  <div className="flex justify-between text-[11px] text-[#AAA] mb-2 uppercase tracking-wider">
                    <span>Layer Opacity</span>
                    <span>{Math.round(activeLayer.opacity * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={activeLayer.opacity}
                    onChange={e => updateLayer({ opacity: parseFloat(e.target.value) })}
                    className="w-full" />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#AAA] mb-2 uppercase tracking-wider">
                    <span>Gaussian Blur</span>
                    <span>{activeLayer.blur}px</span>
                  </div>
                  <input type="range" min="0" max="20" step="1" value={activeLayer.blur}
                    onChange={e => updateLayer({ blur: parseInt(e.target.value) })}
                    className="w-full" />
                </div>

                {/* Colors */}
                <div className="pt-4 border-t border-[#333]">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[11px] text-[#AAA] uppercase tracking-wider">Auto-Color Cycle</span>
                    <button 
                      type="button"
                      onClick={() => updateLayer({ autoAnimateColors: !activeLayer.autoAnimateColors })}
                      className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer outline-none border-none ${activeLayer.autoAnimateColors ? 'bg-border' : 'bg-[#222222]'}`}
                    >
                      <div className={`absolute top-[2px] w-3 h-3 rounded-full transition-all ${activeLayer.autoAnimateColors ? 'right-[2px] bg-accent' : 'left-[2px] bg-[#666]'}`} />
                    </button>
                  </div>

                  {!activeLayer.autoAnimateColors ? (
                    <div className="grid grid-cols-2 gap-2">
                      <ColorPicker 
                        color={activeLayer.staticColors[0]}
                        onChange={(hex) => updateLayer({ staticColors: [hex, activeLayer.staticColors[1]] })}
                      />
                      <ColorPicker 
                        color={activeLayer.staticColors[1]}
                        onChange={(hex) => updateLayer({ staticColors: [activeLayer.staticColors[0], hex] })}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {[0, 1, 2].map((idx) => (
                          <ColorPicker
                            key={idx}
                            color={activeLayer.autoColors[idx]}
                            onChange={(hex) => {
                              const newColors = [...activeLayer.autoColors] as [string, string, string];
                              newColors[idx] = hex;
                              updateLayer({ autoColors: newColors });
                            }}
                          />
                        ))}
                      </div>
                      <div className="mt-4 pt-2">
                        <div className="flex justify-between text-[11px] text-[#AAA] mb-2 uppercase tracking-wider">
                          <span>Color Shift Speed</span>
                          <span>{activeLayer.colorSpeed.toFixed(1)}x</span>
                        </div>
                        <input type="range" min="0.1" max="3.0" step="0.1" value={activeLayer.colorSpeed}
                          onChange={e => updateLayer({ colorSpeed: parseFloat(e.target.value) })}
                          className="w-full" />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Layout Footer Button */}
      <button
        onClick={onExport}
        className="flex-none w-full p-6 bg-accent text-[#000] font-bold text-center uppercase tracking-[2px] cursor-pointer text-[13px] hover:bg-[#00e685] transition-colors border-none outline-none"
      >
        Export Source Code
      </button>

    </div>
  );
}
