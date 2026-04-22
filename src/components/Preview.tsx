import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GlobalConfig, Layer } from '../types';
import { Blob3D } from './Blob3D';

interface PreviewProps {
  config: GlobalConfig;
  layers: Layer[];
}

export function Preview({ config, layers }: PreviewProps) {
  const configRef = useRef(config);
  const layersRef = useRef(layers);

  // Keep refs up to date without triggering effect reruns
  useEffect(() => {
    configRef.current = config;
    layersRef.current = layers;
  }, [config, layers]);

  useEffect(() => {
    let animationFrameId: number;

    const render = (time: number) => {
      const cfg = configRef.current;
      const lyrs = layersRef.current;

      lyrs.forEach(layer => {
        // Update shape
        const pathNode = document.getElementById(`live-blob-path-${layer.id}`);
        if (pathNode) {
          const radialLine = d3.lineRadial<number>()
            .angle((d, i) => i * (Math.PI * 2) / layer.data.length)
            .radius((d, i) => {
              const baseRadius = 100 + d * 1.6;
              const wobbleFactor = d * 0.45;
              const timeFactor = time * 0.001 * cfg.speed;
              return baseRadius + Math.sin(timeFactor + i * 2.1) * wobbleFactor;
            })
            .curve(d3.curveCardinalClosed.tension(1 - cfg.tension));

          pathNode.setAttribute('d', radialLine(layer.data) || '');
        }

        // Update colors
        if (layer.autoAnimateColors) {
          const timeScaled = time * 0.001 * layer.colorSpeed;
          const phase = timeScaled % 1;
          const paddedColors1 = [...layer.autoColors, layer.autoColors[0]];
          const paddedColors2 = [...layer.autoColors.slice(1), layer.autoColors[0], layer.autoColors[1] || layer.autoColors[0]];
          
          const c1 = d3.interpolateRgbBasis(paddedColors1)(phase);
          const c2 = d3.interpolateRgbBasis(paddedColors2)(phase);

          const stop1 = document.getElementById(`live-stop-0-${layer.id}`);
          const stop2 = document.getElementById(`live-stop-1-${layer.id}`);
          if (stop1) stop1.setAttribute('stop-color', c1);
          if (stop2) stop2.setAttribute('stop-color', c2);
        }

        // Update data point markers
        if (cfg.showPoints) {
          layer.data.forEach((d, i) => {
            const gPoint = document.getElementById(`live-point-group-${layer.id}-${i}`);
            if (gPoint) {
              const baseRadius = 100 + d * 1.6;
              const wobbleFactor = d * 0.45;
              const timeFactor = time * 0.001 * cfg.speed;
              const r = baseRadius + Math.sin(timeFactor + i * 2.1) * wobbleFactor;
              const angle = i * (Math.PI * 2) / layer.data.length;

              const px = r * Math.sin(angle);
              const py = -r * Math.cos(angle);

              const line = gPoint.querySelector('line');
              const circle = gPoint.querySelector('circle');
              if (line) {
                line.setAttribute('x2', px.toString());
                line.setAttribute('y2', py.toString());
              }
              if (circle) {
                circle.setAttribute('cx', px.toString());
                circle.setAttribute('cy', py.toString());
              }
            }
          });
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-preview-bg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#1a1a1a_1px,transparent_0)] bg-[length:40px_40px] opacity-50 pointer-events-none" />
      
      <div className="absolute top-6 right-6 hidden lg:flex gap-6 z-10 pointer-events-none">
        <div className="text-right">
          <div className="text-[10px] opacity-40 uppercase tracking-widest font-mono">Render_Mode</div>
          <div className="text-[12px] font-bold uppercase tracking-wider">WebGL_Hybrid</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] opacity-40 uppercase tracking-widest font-mono">FPS</div>
          <div className="text-[12px] font-bold text-accent tracking-wider">120.00</div>
        </div>
      </div>

      <div className="relative w-full h-full flex items-center justify-center z-0 p-4 sm:p-8 lg:p-12">
        
        {config.dimension === '3d' ? (
          <Blob3D config={config} layers={layers} />
        ) : (
          <svg className="w-full h-full max-w-[900px] max-h-[900px] drop-shadow-2xl overflow-visible relative z-10" viewBox="-350 -350 700 700">
            <defs>
              {layers.map(layer => (
                <linearGradient key={`grad-${layer.id}`} id={`live-grad-${layer.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" id={`live-stop-0-${layer.id}`} stopColor={layer.staticColors[0]} />
                  <stop offset="100%" id={`live-stop-1-${layer.id}`} stopColor={layer.staticColors[1]} />
                </linearGradient>
              ))}
            </defs>
            
            <g>
              {layers.map((layer) => (
                <g key={layer.id}>
                  {/* Layer Shape Path */}
                  <path
                    id={`live-blob-path-${layer.id}`}
                    fill={`url(#live-grad-${layer.id})`}
                    style={{
                      mixBlendMode: 'screen',
                      opacity: layer.opacity,
                      filter: layer.blur > 0 ? `blur(${layer.blur}px)` : 'none'
                    }}
                  />
                  
                  {/* Layer Data Points Visualization */}
                  {config.showPoints && (
                    <g id={`live-points-${layer.id}`}>
                      {layer.data.map((_, i) => (
                        <g key={i} id={`live-point-group-${layer.id}-${i}`}>
                          <line stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" x1={0} y1={0} />
                          <circle r={4} fill="#fff" opacity={0.5} />
                        </g>
                      ))}
                    </g>
                  )}
                </g>
              ))}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
