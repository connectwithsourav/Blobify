import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// --- Color Math Utilities ---
const hsvToRgb = (h: number, s: number, v: number) => {
  let f = (n: number, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return {
    r: Math.round(f(5) * 255),
    g: Math.round(f(3) * 255),
    b: Math.round(f(1) * 255)
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const hexToRgb = (hex: string) => {
  let r = 0, g = 0, b = 0;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return { r, g, b };
};

const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, v = max;
  let d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, v };
};

interface ColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const initialRgb = hexToRgb(color);
  const initialHsv = rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b);
  
  const [hsv, setHsv] = useState(initialHsv);
  const [isOpen, setIsOpen] = useState(false);
  
  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

  const svAreaRef = useRef<HTMLDivElement>(null);
  const hueAreaRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  
  const [dragging, setDragging] = useState<'sv' | 'hue' | null>(null);
  const [hexInput, setHexInput] = useState(color.replace('#', ''));

  // Keep ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync from prop when not dragging
  useEffect(() => {
    if (!dragging) {
      const hRgb = hexToRgb(color);
      setHsv(rgbToHsv(hRgb.r, hRgb.g, hRgb.b));
      setHexInput(color.replace('#', ''));
    }
  }, [color, dragging]);

  // Sync to prop when dragging changes internal color
  useEffect(() => {
    if (dragging) {
      onChangeRef.current(`#${hex}`);
      setHexInput(hex);
    }
  }, [hex, dragging]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace('#', '').toUpperCase();
    setHexInput(val);
    if (/^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
      const newRgb = hexToRgb(val);
      const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
      setHsv(newHsv);
      onChange(`#${val}`);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, type: 'sv' | 'hue') => {
    setDragging(type);
    updateColor(e as any, type);
    e.preventDefault();
  };

  const updateColor = useCallback((e: PointerEvent | React.PointerEvent, type: 'sv' | 'hue') => {
    if (type === 'sv' && svAreaRef.current) {
      const rect = svAreaRef.current.getBoundingClientRect();
      let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      setHsv(prev => ({ 
        ...prev, 
        s: x / rect.width, 
        v: 1 - (y / rect.height) 
      }));
    } else if (type === 'hue' && hueAreaRef.current) {
      const rect = hueAreaRef.current.getBoundingClientRect();
      let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setHsv(prev => ({ 
        ...prev, 
        h: (x / rect.width) * 360 
      }));
    }
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (dragging) updateColor(e, dragging);
    };
    const handlePointerUp = () => {
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragging, updateColor]);
  
  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOutside = 
        (!popoverRef.current || !popoverRef.current.contains(target)) &&
        (!containerRef.current || !containerRef.current.contains(target));
        
      if (isOutside) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const updatePosition = useCallback(() => {
    if (containerRef.current && popoverRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      
      let left = rect.left + rect.width / 2 - popoverRect.width / 2;
      let top = rect.bottom + 8;
      
      if (left < 10) left = 10;
      if (left + popoverRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popoverRect.width - 10;
      }
      if (top + popoverRect.height > window.innerHeight - 10) {
        top = rect.top - popoverRect.height - 8;
      }
      
      popoverRef.current.style.top = `${top}px`;
      popoverRef.current.style.left = `${left}px`;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => updatePosition());
      
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, updatePosition]);

  const pointerLeftSv = `${hsv.s * 100}%`;
  const pointerTopSv = `${(1 - hsv.v) * 100}%`;
  const pointerLeftHue = `${(hsv.h / 360) * 100}%`;

  return (
    <div className="relative flex flex-col items-center w-full" ref={containerRef}>
      <div className="flex flex-col w-full relative group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 border border-[#444] rounded-t-md cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-inner"
          style={{ backgroundColor: color }}
        />
        <div className="flex w-full items-center bg-[#1a1a1a] border border-t-0 border-[#444] rounded-b-md px-2 py-1.5 focus-within:border-accent focus-within:bg-[#222] transition-colors">
            <span className="text-[10px] text-accent font-mono mr-1 font-bold">#</span>
            <input type="text" value={hexInput}
               onChange={handleHexChange}
               maxLength={6}
               spellCheck="false"
               className="w-full bg-transparent text-left text-[11px] text-white/90 font-mono uppercase focus:outline-none transition-colors" />
        </div>
      </div>

      {isOpen && createPortal(
        <div 
          ref={popoverRef}
          className="fixed z-[9999] bg-[#111] rounded shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-border p-4 w-[240px]"
          style={{ top: -9999, left: -9999 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-[10px] font-mono space-x-2 text-white/50 bg-[#050505] border border-border px-2 py-1 rounded-sm">
              <span>HEX</span>
              <span className="font-bold text-white">#{hexInput || hex}</span>
            </div>
            <div className="flex items-center text-[10px] font-mono space-x-2 text-white/50 bg-[#050505] border border-border px-2 py-1 rounded-sm">
              <span>RGB</span> 
              <span className="font-bold text-white">{rgb.r}, {rgb.g}, {rgb.b}</span>
            </div>
          </div>

          <div className="border border-[#222] rounded-sm p-2 bg-[#050505]">
            <div
              ref={svAreaRef}
              onPointerDown={(e) => handlePointerDown(e, 'sv')}
              className="relative w-full h-32 rounded-sm overflow-hidden cursor-crosshair touch-none border border-[#222]"
              style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              
              <div
                className="absolute w-[12px] h-[12px] -ml-[6px] -mt-[6px] border-[2px] border-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.8)] pointer-events-none transition-transform duration-75"
                style={{ left: pointerLeftSv, top: pointerTopSv }}
              />
            </div>

            <div
              ref={hueAreaRef}
              onPointerDown={(e) => handlePointerDown(e, 'hue')}
              className="relative w-full h-2.5 mt-3 rounded-full cursor-pointer touch-none shadow-inner border border-[#222]"
              style={{ 
                background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' 
              }}
            >
              <div
                className="absolute w-[14px] h-[14px] -ml-[7px] -mt-[3px] border-[2px] border-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none"
                style={{ 
                  left: pointerLeftHue, 
                  backgroundColor: `hsl(${hsv.h}, 100%, 50%)` 
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
