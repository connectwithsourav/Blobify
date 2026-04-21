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
      <div className="flex-none p-6 pb-6 border-b border-border bg-pane flex flex-col gap-6">
        <div>
          <h1 className="text-[18px] font-black text-accent uppercase tracking-[4px]">BLOBIFY</h1>
          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">V.2.5</p>
        </div>

        {/* Enhanced Fixed Render Engine Tabs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-[#888] font-bold uppercase tracking-[2px]">Render Engine</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,255,148,0.6)] ${config.dimension === '3d' ? 'bg-accent animate-pulse' : 'bg-[#fff]'}`} />
              <span className="text-[9px] font-mono text-[#555] uppercase">{config.dimension === '3d' ? 'GPU Live' : 'DOM SVG'}</span>
            </div>
          </div>
          
          <div className="flex bg-[#111] p-1 rounded-lg border border-[#2a2a2a] relative shadow-inner">
            <div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#2a2a2a] rounded-md shadow-md transition-all duration-300 ease-out border border-[#444]"
              style={{ left: config.dimension === '2d' ? '4px' : 'calc(50% + 0px)' }}
            />
            <button 
              onClick={() => setConfig({ ...config, dimension: '2d' })}
              className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 text-[11px] uppercase font-bold tracking-widest rounded-md transition-colors border-none cursor-pointer ${config.dimension === '2d' ? 'text-white drop-shadow-md' : 'bg-transparent text-[#666] hover:text-[#aaa]'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9"></path></svg>
              2D SVG
            </button>
            <button 
              onClick={() => setConfig({ ...config, dimension: '3d' })}
              className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 text-[11px] uppercase font-bold tracking-widest rounded-md transition-colors border-none cursor-pointer ${config.dimension === '3d' ? 'text-white drop-shadow-md' : 'bg-transparent text-[#666] hover:text-[#aaa]'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-9 5-9-5V8l9-5 9 5v8z"></path><path d="m3.27 6.96 8.73 4.88 8.73-4.88"></path><path d="M12 22V12"></path></svg>
              3D GLSL
            </button>
          </div>
        </div>
      </div>

      {/* Main Scrollable Config Area */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar relative">
        {config.dimension === '2d' ? (
          <>
            {/* Global Controls Core (2D) */}
            <div className="p-5 border-b border-border text-white animate-in fade-in">
              <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[2px] mb-4">Physics & Space</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] text-[#AAA] mb-2 uppercase tracking-wider">
                    <span>Animation Speed</span>
                    <span>{(config.speed ?? 1.0).toFixed(1)}s</span>
                  </div>
                  <input type="range" min="0.0" max="3.0" step="0.1" value={config.speed ?? 1.0}
                    onChange={e => setConfig({ ...config, speed: parseFloat(e.target.value) })}
                    className="w-full" />
                </div>
                <div>
                   <div className="flex justify-between text-[11px] text-[#AAA] mb-2 uppercase tracking-wider">
                    <span>Curve Tension</span>
                    <span>{(config.tension ?? 0.7).toFixed(2)}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={config.tension ?? 0.7}
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
            <div className="p-5 pb-8 animate-in fade-in">
              <div className="flex border-b border-[#222] mb-6">
                {layers.map((layer, idx) => (
                  <button
                    key={layer.id}
                    onClick={() => setActiveLayerId(layer.id)}
                    className={`flex-1 relative pb-3 text-center text-[10px] font-bold tracking-[2px] uppercase transition-colors outline-none cursor-pointer border-none bg-transparent ${
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
                  <button onClick={addLayer} className="text-[9px] uppercase tracking-[1px] text-white/50 bg-[#333] py-2 px-3 hover:text-white transition-colors cursor-pointer border-none outline-none">
                    + Add Layer
                  </button>
                )}
                {layers.length > 1 && (
                   <button onClick={deleteLayer} className="text-[9px] uppercase tracking-[1px] text-red-500/70 bg-[#333] py-2 px-3 hover:text-red-500 transition-colors ml-auto cursor-pointer border-none outline-none">
                    Trash Layer
                   </button>
                )}
              </div>

              {/* Active Layer Controls */}
              {activeLayer && (
                <div className="animate-in fade-in duration-200 text-white">
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

                    <div className="flex gap-2 mt-3 relative z-10">
                      <button onClick={addDataPoint} disabled={activeLayer.data.length >= 15} className="cursor-pointer flex-1 bg-[#333] border-none text-[9px] py-2 text-center uppercase tracking-[1px] text-white/70 hover:text-white disabled:opacity-50">
                        + Add Point
                      </button>
                      <button onClick={removeDataPoint} disabled={activeLayer.data.length <= 3} className="cursor-pointer flex-1 bg-[#333] border-none text-[9px] py-2 text-center uppercase tracking-[1px] text-white/70 hover:text-white disabled:opacity-50">
                        - Remove
                      </button>
                      <button onClick={randomizeData} className="cursor-pointer flex-1 bg-[#333] border-none text-[9px] py-2 text-center uppercase tracking-[1px] text-accent hover:bg-[#444] transition-colors">
                        Random
                      </button>
                    </div>
                  </div>

                  {/* Layer Style Properties */}
                  <div className="space-y-6 mt-6 pt-6 border-t border-[#333]">
                    <div>
                      <div className="flex justify-between text-[11px] text-[#AAA] mb-2 uppercase tracking-wider">
                        <span>Layer Opacity</span>
                        <span>{Math.round((activeLayer.opacity ?? 0.8) * 100)}%</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05" value={activeLayer.opacity ?? 0.8}
                        onChange={e => updateLayer({ opacity: parseFloat(e.target.value) })}
                        className="w-full" />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-[#AAA] mb-2 uppercase tracking-wider">
                        <span>Gaussian Blur</span>
                        <span>{activeLayer.blur ?? 20}px</span>
                      </div>
                      <input type="range" min="0" max="20" step="1" value={activeLayer.blur ?? 20}
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
                          <div className="grid grid-cols-2 gap-2">
                            {activeLayer.autoColors.map((color, idx) => (
                              <div key={idx} className="relative group/color">
                                <ColorPicker
                                  color={color}
                                  onChange={(hex) => {
                                    const newColors = [...activeLayer.autoColors];
                                    newColors[idx] = hex;
                                    updateLayer({ autoColors: newColors });
                                  }}
                                />
                                {activeLayer.autoColors.length > 2 && (
                                  <button 
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover/color:opacity-100 cursor-pointer border-none z-10 hover:bg-red-400 pb-px"
                                    onClick={() => {
                                      updateLayer({ autoColors: activeLayer.autoColors.filter((_, i) => i !== idx) });
                                    }}
                                  >✕</button>
                                )}
                              </div>
                            ))}
                            {activeLayer.autoColors.length < 5 && (
                              <button 
                                onClick={() => updateLayer({ autoColors: [...activeLayer.autoColors, '#FFFFFF'] })}
                                className="h-10 border border-[#333] border-dashed rounded-sm text-[#666] hover:text-[#aaa] hover:border-[#555] flex items-center justify-center text-[18px] cursor-pointer bg-transparent transition-colors"
                              >
                                +
                              </button>
                            )}
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
          </>
        ) : (
          /* 3D Config Section */
          <div className="p-5 pb-8 animate-in fade-in duration-200">
            <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[2px] mb-6">
              Organic Blob Physics
            </h3>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-[#AAA] uppercase tracking-wider w-28 flex-shrink-0">Animation Speed</span>
                <input type="range" min="0.0" max="3.0" step="0.1" value={config.config3D?.animationSpeed ?? 1.0}
                  onChange={e => setConfig({ ...config, config3D: { ...config.config3D!, animationSpeed: parseFloat(e.target.value) }})}
                  className="flex-1 min-w-0" />
                <div className="h-8 border border-[#333] rounded-md px-3 flex items-center bg-[#111] text-[11px] font-mono text-white min-w-[50px] justify-center flex-shrink-0">
                  {(config.config3D?.animationSpeed ?? 1.0).toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[11px] text-[#AAA] uppercase tracking-wider w-28 flex-shrink-0">Wobble Intensity</span>
                <input type="range" min="0.0" max="1.5" step="0.05" value={config.config3D?.wobbleIntensity ?? 0.5}
                  onChange={e => setConfig({ ...config, config3D: { ...config.config3D!, wobbleIntensity: parseFloat(e.target.value) }})}
                  className="flex-1 min-w-0" />
                <div className="h-8 border border-[#333] rounded-md px-3 flex items-center bg-[#111] text-[11px] font-mono text-white min-w-[50px] justify-center flex-shrink-0">
                  {(config.config3D?.wobbleIntensity ?? 0.5).toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[11px] text-[#AAA] uppercase tracking-wider w-28 flex-shrink-0">Complexity</span>
                <input type="range" min="0.25" max="4.0" step="0.05" value={config.config3D?.complexity ?? 1.2}
                  onChange={e => setConfig({ ...config, config3D: { ...config.config3D!, complexity: parseFloat(e.target.value) }})}
                  className="flex-1 min-w-0" />
                <div className="h-8 border border-[#333] rounded-md px-3 flex items-center bg-[#111] text-[11px] font-mono text-white min-w-[50px] justify-center flex-shrink-0">
                  {(config.config3D?.complexity ?? 1.2).toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[11px] text-[#AAA] uppercase tracking-wider w-28 flex-shrink-0">Shine Strength</span>
                <input type="range" min="0" max="300" step="5" value={config.config3D?.shininess ?? 100}
                  onChange={e => setConfig({ ...config, config3D: { ...config.config3D!, shininess: parseFloat(e.target.value) }})}
                  className="flex-1 min-w-0" />
                <div className="h-8 border border-[#333] rounded-md px-3 flex items-center bg-[#111] text-[11px] font-mono text-white min-w-[50px] justify-center flex-shrink-0">
                  {(config.config3D?.shininess ?? 100).toFixed(0)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[11px] text-[#AAA] uppercase tracking-wider w-28 flex-shrink-0">Quality (Detail)</span>
                <input type="range" min="1" max="4" step="1" value={config.config3D?.quality ?? 3}
                  onChange={e => setConfig({ ...config, config3D: { ...config.config3D!, quality: parseFloat(e.target.value) }})}
                  className="flex-1 min-w-0" />
                <div className="h-8 border border-[#333] rounded-md px-3 flex items-center bg-[#111] text-[11px] font-mono text-white min-w-[50px] justify-center flex-shrink-0">
                  {['Low', 'Med', 'High', 'Ultra'][(config.config3D?.quality ?? 3) - 1]}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#AAA] uppercase tracking-wider">Show Wireframe</span>
                <button 
                  type="button"
                  onClick={() => setConfig({ ...config, config3D: { ...config.config3D!, wireframe: !config.config3D?.wireframe }})}
                  className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer outline-none border-none ${config.config3D?.wireframe ? 'bg-[#555]' : 'bg-[#222222]'}`}
                >
                   <div className={`absolute top-[2px] w-4 h-4 rounded-full transition-all ${config.config3D?.wireframe ? 'right-[2px] bg-[#fff]' : 'left-[2px] bg-[#666]'}`} />
                </button>
              </div>

              <div className="pt-6 border-t border-[#333]">
                <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[2px] mb-4">
                  Material Color
                </h3>

                <div className="flex bg-[#222] p-1 rounded-sm gap-1 mb-5">
                  <button 
                    onClick={() => setConfig({ ...config, config3D: { ...config.config3D!, colorMode: 'solid' }})}
                    className={`flex-1 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-sm transition-colors border-none cursor-pointer ${config.config3D?.colorMode === 'solid' ? 'bg-[#555] text-white' : 'bg-transparent text-[#888] hover:text-[#bbb]'}`}
                  >
                    Solid
                  </button>
                  <button 
                    onClick={() => setConfig({ ...config, config3D: { ...config.config3D!, colorMode: 'gradient' }})}
                    className={`flex-1 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-sm transition-colors border-none cursor-pointer ${config.config3D?.colorMode === 'gradient' ? 'bg-[#555] text-white' : 'bg-transparent text-[#888] hover:text-[#bbb]'}`}
                  >
                    Gradient
                  </button>
                </div>

                <div className="flex items-center justify-between mb-5 pt-2 border-t border-[#222]">
                  <span className="text-[11px] text-[#AAA] uppercase tracking-wider">Auto-Color Cycle</span>
                  <button 
                    type="button"
                    onClick={() => setConfig({ ...config, config3D: { ...config.config3D!, autoAnimateColors: !config.config3D?.autoAnimateColors }})}
                    className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer outline-none border-none ${config.config3D?.autoAnimateColors ? 'bg-[#555]' : 'bg-[#222222]'}`}
                  >
                    <div className={`absolute top-[2px] w-3 h-3 rounded-full transition-all ${config.config3D?.autoAnimateColors ? 'right-[2px] bg-white' : 'left-[2px] bg-[#666]'}`} />
                  </button>
                </div>

                {!config.config3D?.autoAnimateColors ? (
                  <div className="animate-in slide-in-from-top-1">
                    {config.config3D?.colorMode === 'solid' ? (
                      <ColorPicker 
                        color={config.config3D?.color || '#8b5cf6'}
                        onChange={(hex) => setConfig({ ...config, config3D: { ...config.config3D!, color: hex }})}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <ColorPicker 
                          color={config.config3D?.customColors?.[0] || '#FF0080'}
                          onChange={(hex) => setConfig({ ...config, config3D: { ...config.config3D!, customColors: [hex, config.config3D!.customColors[1]] }})}
                        />
                        <ColorPicker 
                          color={config.config3D?.customColors?.[1] || '#00DFD8'}
                          onChange={(hex) => setConfig({ ...config, config3D: { ...config.config3D!, customColors: [config.config3D!.customColors[0], hex] }})}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-top-1 pt-2 border-t border-[#222]">
                    <div className="grid grid-cols-2 gap-2">
                      {(config.config3D?.autoColors || ['#FF00A0', '#00DFD8']).map((color, idx) => (
                        <div key={idx} className="relative group/color">
                          <ColorPicker
                            color={color}
                            onChange={(hex) => {
                              const newColors = [...(config.config3D?.autoColors || [])];
                              newColors[idx] = hex;
                              setConfig({ ...config, config3D: { ...config.config3D!, autoColors: newColors }});
                            }}
                          />
                          {(config.config3D?.autoColors?.length || 0) > 2 && (
                            <button 
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover/color:opacity-100 cursor-pointer border-none z-10 hover:bg-red-400 pb-px"
                              onClick={() => {
                                const newColors = config.config3D!.autoColors.filter((_, i) => i !== idx);
                                setConfig({ ...config, config3D: { ...config.config3D!, autoColors: newColors }});
                              }}
                            >✕</button>
                          )}
                        </div>
                      ))}
                      {(config.config3D?.autoColors?.length || 0) < 5 && (
                        <button 
                          onClick={() => {
                             const newColors = [...(config.config3D?.autoColors || []), '#FFFFFF'];
                             setConfig({ ...config, config3D: { ...config.config3D!, autoColors: newColors }});
                          }}
                          className="h-10 border border-[#333] border-dashed rounded-sm text-[#666] hover:text-[#aaa] hover:border-[#555] flex items-center justify-center text-[18px] cursor-pointer bg-transparent transition-colors"
                        >
                          +
                        </button>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#222]">
                      <div className="flex justify-between text-[11px] text-[#AAA] mb-2 uppercase tracking-wider">
                        <span>Color Shift Speed</span>
                        <span>{(config.config3D?.colorSpeed ?? 1.0).toFixed(1)}x</span>
                      </div>
                      <input type="range" min="0.1" max="3.0" step="0.1" value={config.config3D?.colorSpeed ?? 1.0}
                        onChange={e => setConfig({ ...config, config3D: { ...config.config3D!, colorSpeed: parseFloat(e.target.value) }})}
                        className="w-full" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
