import { GlobalConfig, Layer } from "../types";

export const generateExportCode = (config: GlobalConfig, layers: Layer[]) => {
  return `<!-- BlobGen Embed Snippet Start -->
<script src="https://d3js.org/d3.v7.min.js"></script>
<div id="blobgen-container" style="width: 100%; max-width: 800px; aspect-ratio: 1/1; display: flex; justify-content: center; align-items: center; position: relative;"></div>

<script>
(function() {
    const config = ${JSON.stringify(config, null, 2).replace(/</g, '\\u003c')};
    const layers = ${JSON.stringify(layers, null, 2).replace(/</g, '\\u003c')};

    const container = document.getElementById('blobgen-container');
    
    let svgContent = '<defs>';
    layers.forEach(layer => {
        svgContent += \`
            <linearGradient id="grad-\${layer.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" id="stop-0-\${layer.id}" stop-color="\${layer.staticColors[0]}"></stop>
                <stop offset="100%" id="stop-1-\${layer.id}" stop-color="\${layer.staticColors[1]}"></stop>
            </linearGradient>
        \`;
    });
    svgContent += '</defs><g>';
    
    layers.forEach(layer => {
        const filterStr = layer.blur > 0 ? \`filter: blur(\${layer.blur}px);\` : '';
        svgContent += \`<path id="blob-path-\${layer.id}" fill="url(#grad-\${layer.id})" style="mix-blend-mode: screen; opacity: \${layer.opacity}; \${filterStr}"></path>\`;
        
        if (config.showPoints) {
            svgContent += \`<g id="points-\${layer.id}">\`;
            layer.data.forEach((_, i) => {
                svgContent += \`<g id="point-group-\${layer.id}-\${i}">
                    <line stroke="rgba(255,255,255,0.25)" stroke-dasharray="4 4" x1="0" y1="0" x2="0" y2="0"></line>
                    <circle r="4" fill="#ffffff" cx="0" cy="0"></circle>
                </g>\`;
            });
            svgContent += \`</g>\`;
        }
    });
    svgContent += '</g>';
    
    container.innerHTML = '<svg viewBox="-350 -350 700 700" style="width: 100%; height: 100%; overflow: visible;">' + svgContent + '</svg>';

    function render(time) {
        layers.forEach(layer => {
            const pathNode = document.getElementById(\`blob-path-\${layer.id}\`);
            if (pathNode) {
                const radialLine = d3.lineRadial()
                    .angle((d, i) => i * (Math.PI * 2) / layer.data.length)
                    .radius((d, i) => {
                        const baseRadius = 100 + d * 1.6;
                        const wobbleFactor = d * 0.45;
                        const timeFactor = time * 0.001 * config.speed;
                        return baseRadius + Math.sin(timeFactor + i * 2.1) * wobbleFactor;
                    })
                    .curve(d3.curveCardinalClosed.tension(1 - config.tension));

                pathNode.setAttribute('d', radialLine(layer.data) || '');
            }

            if (layer.autoAnimateColors) {
                const timeScaled = time * 0.001 * layer.colorSpeed;
                const phase = timeScaled % 1;
                const c1 = d3.interpolateRgbBasis([layer.autoColors[0], layer.autoColors[1], layer.autoColors[2], layer.autoColors[0]])(phase);
                const c2 = d3.interpolateRgbBasis([layer.autoColors[1], layer.autoColors[2], layer.autoColors[0], layer.autoColors[1]])(phase);

                const stop1 = document.getElementById(\`stop-0-\${layer.id}\`);
                const stop2 = document.getElementById(\`stop-1-\${layer.id}\`);
                if (stop1) stop1.setAttribute('stop-color', c1);
                if (stop2) stop2.setAttribute('stop-color', c2);
            }

            if (config.showPoints) {
                layer.data.forEach((d, i) => {
                    const gPoint = document.getElementById(\`point-group-\${layer.id}-\${i}\`);
                    if (gPoint) {
                        const baseRadius = 100 + d * 1.6;
                        const wobbleFactor = d * 0.45;
                        const timeFactor = time * 0.001 * config.speed;
                        const r = baseRadius + Math.sin(timeFactor + i * 2.1) * wobbleFactor;
                        const angle = i * (Math.PI * 2) / layer.data.length;

                        const px = r * Math.sin(angle);
                        const py = -r * Math.cos(angle);

                        const line = gPoint.querySelector('line');
                        const circle = gPoint.querySelector('circle');
                        if (line) {
                            line.setAttribute('x2', px);
                            line.setAttribute('y2', py);
                        }
                        if (circle) {
                            circle.setAttribute('cx', px);
                            circle.setAttribute('cy', py);
                        }
                    }
                });
            }
        });
        requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
})();
</script>
<!-- BlobGen Embed Snippet End -->`;
};
