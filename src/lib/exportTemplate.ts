import { GlobalConfig, Layer } from "../types";

export const generateExportCode = (config: GlobalConfig, layers: Layer[]) => {
  if (config.dimension === '3d') {
    return `<!-- BlobGen 3D Embed Snippet Start -->
<div id="blobgen-container" style="width: 100%; max-width: 800px; aspect-ratio: 1/1; position: relative;"></div>

<!-- ES Module Shims: Import maps polyfill for older browsers -->
<script async src="https://unpkg.com/es-module-shims@1.8.0/dist/es-module-shims.js"></script>

<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
    }
  }
</script>

<script type="module">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
  import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
  import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

  const config = ${JSON.stringify(config, null, 2).replace(/</g, '\\u003c')};
  const layers = ${JSON.stringify(layers, null, 2).replace(/</g, '\\u003c')};

  const container = document.getElementById('blobgen-container');
  
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 4;
  controls.maxDistance = 15;

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const ssaoPass = new SSAOPass(scene, camera, container.clientWidth, container.clientHeight);
  const isMobile = window.innerWidth <= 768;
  ssaoPass.kernelRadius = isMobile ? 8 : 16;
  ssaoPass.minDistance = 0.005;
  ssaoPass.maxDistance = 0.1;
  composer.addPass(ssaoPass);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 0.3, 0.5, 0.6);
  composer.addPass(bloomPass);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const renderConfig = config.config3D || {
    animationSpeed: 1.0,
    wobbleIntensity: 0.5,
    complexity: 1.2,
    color: '#8b5cf6',
    wireframe: false,
    baseRadius: 2,
    shininess: 100,
    quality: 3
  };

  const currentQuality = renderConfig.quality ?? 3;
  const shadowRes = currentQuality > 2 ? 1024 : 512;

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight1.position.set(5, 5, 5);
  dirLight1.castShadow = true;
  dirLight1.shadow.mapSize.width = shadowRes;
  dirLight1.shadow.mapSize.height = shadowRes;
  dirLight1.shadow.bias = -0.001;
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x00FF94, 0.8);
  dirLight2.position.set(-5, -5, -5);
  scene.add(dirLight2);

  const baseRadius = renderConfig.baseRadius || 2;
  const detail = currentQuality === 1 ? 16 : currentQuality === 2 ? 32 : currentQuality === 3 ? 64 : 128;
  const geometry = new THREE.IcosahedronGeometry(baseRadius, detail);

  const shine = renderConfig.shininess ?? 100;
  
  // Connect bloom to shine strength directly
  bloomPass.strength = (shine / 300) * 0.8;
  
  const customUniforms = {
    color1: { value: new THREE.Color() },
    color2: { value: new THREE.Color() },
    useGradient: { value: false },
    uTime: { value: 0 },
    uComplexity: { value: renderConfig.complexity || 1.2 },
    uWobble: { value: renderConfig.wobbleIntensity || 0.5 },
    uRadius: { value: baseRadius }
  };

  const material = new THREE.MeshStandardMaterial({
    color: renderConfig.color,
    roughness: Math.max(0.25, 1.0 - (shine / 300)),
    metalness: Math.min(0.5, shine / 600),
    flatShading: false
  });
  
  const applyBlobShader = (shader) => {
    shader.uniforms.color1 = customUniforms.color1;
    shader.uniforms.color2 = customUniforms.color2;
    shader.uniforms.useGradient = customUniforms.useGradient;
    shader.uniforms.uTime = customUniforms.uTime;
    shader.uniforms.uComplexity = customUniforms.uComplexity;
    shader.uniforms.uWobble = customUniforms.uWobble;
    shader.uniforms.uRadius = customUniforms.uRadius;
    
    shader.vertexShader = "\\n varying vec2 vUvBlob;\\n" +
      "uniform float uTime;\\n uniform float uComplexity;\\n uniform float uWobble;\\n uniform float uRadius;\\n" +
      "float pseudoNoise3D(vec3 p) {\\n" +
      "  float x = p.x; float y = p.y; float z = p.z;\\n" +
      "  return (sin(x) + sin(y) + sin(z) + sin(x * 2.3 + y * 1.7 + z * 0.5) + sin(y * 2.3 + z * 1.7 + x * 0.5) + sin(z * 2.3 + x * 1.7 + y * 0.5)) / 6.0;\\n" +
      "}\\n" +
      "vec3 getDisplacedPosition(vec3 p) {\\n" +
      "  float noise = pseudoNoise3D(p * uComplexity + vec3(uTime));\\n" +
      "  return normalize(p) * (uRadius + (noise * uWobble));\\n" +
      "}\\n" +
      shader.vertexShader;
    
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      "#include <uv_vertex>\\n vUvBlob = uv;\\n"
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      "#include <beginnormal_vertex>\\n" +
      "vec3 customTangent = normalize(cross(objectNormal, vec3(0.0, 1.0, 0.0)));\\n" +
      "if (length(customTangent) < 0.1) { customTangent = normalize(cross(objectNormal, vec3(1.0, 0.0, 0.0))); }\\n" +
      "vec3 customBitangent = normalize(cross(objectNormal, customTangent));\\n" +
      "float offset = 0.01;\\n" +
      "vec3 p0 = getDisplacedPosition(position);\\n" +
      "vec3 p1 = getDisplacedPosition(position + customTangent * offset);\\n" +
      "vec3 p2 = getDisplacedPosition(position + customBitangent * offset);\\n" +
      "objectNormal = normalize(cross(p1 - p0, p2 - p0));\\n"
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      "vec3 transformed = getDisplacedPosition(position);\\n"
    );
    
    shader.fragmentShader = "\\n uniform vec3 color1;\\n uniform vec3 color2;\\n uniform bool useGradient;\\n varying vec2 vUvBlob;\\n" + shader.fragmentShader;
    
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      "#include <color_fragment>\\n if (useGradient) {\\n diffuseColor.rgb = mix(color1, color2, vUvBlob.y * 1.5 - 0.25);\\n }\\n"
    );
  };
  
  material.onBeforeCompile = applyBlobShader;

  const blobMesh = new THREE.Mesh(geometry, material);
  blobMesh.castShadow = true;
  blobMesh.receiveShadow = true;
  scene.add(blobMesh);

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x00FF94,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
    visible: renderConfig.wireframe || false
  });
  wireframeMaterial.onBeforeCompile = applyBlobShader;
  
  const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
  scene.add(wireframeMesh);

  function animate(time = 0) {
    requestAnimationFrame(animate);

    const elapsedTime = time * 0.001;
    const speed = renderConfig.animationSpeed;
    const complexity = renderConfig.complexity;
    const intensity = renderConfig.wobbleIntensity;
    
    const colorMode = renderConfig.colorMode || 'solid';
    const autoAnimate = renderConfig.autoAnimateColors || false;
    const colorSpeedLocal = renderConfig.colorSpeed ?? 1.0;
    
    if (colorMode === 'solid' && !autoAnimate) {
      customUniforms.useGradient.value = false;
      material.color.set(renderConfig.color || '#8b5cf6');
    } else if (colorMode === 'gradient' && !autoAnimate) {
      customUniforms.useGradient.value = true;
      customUniforms.color1.value.set(renderConfig.customColors?.[0] || '#FF0080');
      customUniforms.color2.value.set(renderConfig.customColors?.[1] || '#00DFD8');
    } else if (autoAnimate) {
      const timeScaled = elapsedTime * colorSpeedLocal;
      const phase = timeScaled % 1.0;
      const colors = (renderConfig.autoColors || ['#FF00A0', '#00DFD8']).map(c => new THREE.Color(c));
      const numColors = colors.length;
      
      const segment = 1.0 / numColors;
      const index = Math.floor(phase / segment);
      const nextIndex = (index + 1) % numColors;
      const nextNextIndex = (index + 2) % numColors;
      const localPhase = (phase - (index * segment)) / segment;
      
      let targetColor1 = new THREE.Color();
      let targetColor2 = new THREE.Color();
      
      targetColor1.lerpColors(colors[index], colors[nextIndex], localPhase);
      targetColor2.lerpColors(colors[nextIndex], colors[nextNextIndex], localPhase);
      
      if (colorMode === 'gradient') {
         customUniforms.useGradient.value = true;
         customUniforms.color1.value.copy(targetColor1);
         customUniforms.color2.value.copy(targetColor2);
      } else {
         customUniforms.useGradient.value = false;
         material.color.copy(targetColor1);
      }
    }
    
    const t = elapsedTime * 0.5 * speed;

    customUniforms.uTime.value = t;
    customUniforms.uComplexity.value = complexity;
    customUniforms.uWobble.value = intensity;
    customUniforms.uRadius.value = baseRadius;

    blobMesh.rotation.y += 0.002 * speed;
    blobMesh.rotation.x += 0.001 * speed;
    wireframeMesh.rotation.copy(blobMesh.rotation);

    controls.update();
    composer.render();
  }

  animate();

  const resizeObserver = new ResizeObserver(() => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    composer.setSize(container.clientWidth, container.clientHeight);
  });
  resizeObserver.observe(container);
</script>
<!-- BlobGen 3D Embed Snippet End -->`;
  }

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
                const paddedColors1 = [...layer.autoColors, layer.autoColors[0]];
                const paddedColors2 = [...layer.autoColors.slice(1), layer.autoColors[0], layer.autoColors[1] || layer.autoColors[0]];
                
                const c1 = d3.interpolateRgbBasis(paddedColors1)(phase);
                const c2 = d3.interpolateRgbBasis(paddedColors2)(phase);

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
