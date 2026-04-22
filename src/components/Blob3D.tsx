import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { GlobalConfig, Layer } from '../types';

interface Blob3DProps {
  config: GlobalConfig;
  layers: Layer[];
}

export function Blob3D({ config, layers }: Blob3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const wireframeMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
    if (wireframeMaterialRef.current && config.config3D) {
      wireframeMaterialRef.current.visible = config.config3D.wireframe;
    }
  }, [config]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Add fog to match HTML
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 15;
    controlsRef.current = controls;

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

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(5, 5, 5);
    dirLight1.castShadow = true;
    dirLight1.shadow.bias = -0.001;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00FF94, 0.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    let currentQuality = configRef.current.config3D?.quality ?? 3;
    
    const getDetail = (quality: number) => {
      switch(quality) {
        case 1: return 16;
        case 2: return 32;
        case 3: return 64;
        case 4: return 128;
        default: return 64;
      }
    };

    const updateShadowRes = (quality: number) => {
      const res = quality > 2 ? 1024 : 512;
      dirLight1.shadow.mapSize.width = res;
      dirLight1.shadow.mapSize.height = res;
      if (dirLight1.shadow.map) {
        dirLight1.shadow.map.dispose();
        dirLight1.shadow.map = null as any;
      }
    };
    updateShadowRes(currentQuality);

    let baseRadius = configRef.current.config3D?.baseRadius ?? 2;
    let geometry = new THREE.IcosahedronGeometry(baseRadius, getDetail(currentQuality));

    const customUniforms = {
      color1: { value: new THREE.Color() },
      color2: { value: new THREE.Color() },
      useGradient: { value: false },
      uTime: { value: 0 },
      uComplexity: { value: 1.2 },
      uWobble: { value: 0.5 },
      uRadius: { value: 2.0 }
    };

    const materialColor = configRef.current.config3D?.color || '#8b5cf6';
    const material = new THREE.MeshStandardMaterial({
      color: materialColor,
      roughness: 0.3,
      metalness: 0.1,
      flatShading: false
    });
    
    const applyBlobShader = (shader: THREE.Shader) => {
      shader.uniforms.color1 = customUniforms.color1;
      shader.uniforms.color2 = customUniforms.color2;
      shader.uniforms.useGradient = customUniforms.useGradient;
      shader.uniforms.uTime = customUniforms.uTime;
      shader.uniforms.uComplexity = customUniforms.uComplexity;
      shader.uniforms.uWobble = customUniforms.uWobble;
      shader.uniforms.uRadius = customUniforms.uRadius;
      
      shader.vertexShader = `
         varying vec2 vUvBlob;
        uniform float uTime;
        uniform float uComplexity;
        uniform float uWobble;
        uniform float uRadius;

        float pseudoNoise3D(vec3 p) {
            float x = p.x;
            float y = p.y;
            float z = p.z;
            return (
                sin(x) + sin(y) + sin(z) +
                sin(x * 2.3 + y * 1.7 + z * 0.5) +
                sin(y * 2.3 + z * 1.7 + x * 0.5) +
                sin(z * 2.3 + x * 1.7 + y * 0.5)
            ) / 6.0;
        }

        vec3 getDisplacedPosition(vec3 p) {
            float noise = pseudoNoise3D(p * uComplexity + vec3(uTime));
            return normalize(p) * (uRadius + (noise * uWobble));
        }
      ` + shader.vertexShader;
      
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `
        #include <uv_vertex>
        vUvBlob = uv;
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>
        
        vec3 customTangent = normalize(cross(objectNormal, vec3(0.0, 1.0, 0.0)));
        if (length(customTangent) < 0.1) {
            customTangent = normalize(cross(objectNormal, vec3(1.0, 0.0, 0.0)));
        }
        vec3 customBitangent = normalize(cross(objectNormal, customTangent));
        float offset = 0.01;
        vec3 p0 = getDisplacedPosition(position);
        vec3 p1 = getDisplacedPosition(position + customTangent * offset);
        vec3 p2 = getDisplacedPosition(position + customBitangent * offset);
        objectNormal = normalize(cross(p1 - p0, p2 - p0));
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        vec3 transformed = getDisplacedPosition(position);
        `
      );
      
      shader.fragmentShader = `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform bool useGradient;
        varying vec2 vUvBlob;
      ` + shader.fragmentShader;
      
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        if (useGradient) {
          diffuseColor.rgb = mix(color1, color2, vUvBlob.y * 1.5 - 0.25);
        }
        `
      );
    };

    material.onBeforeCompile = applyBlobShader;
    
    materialRef.current = material;

    const blobMesh = new THREE.Mesh(geometry, material);
    blobMesh.castShadow = true;
    blobMesh.receiveShadow = true;
    scene.add(blobMesh);

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00FF94,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      visible: configRef.current.config3D?.wireframe ?? false
    });
    wireframeMaterial.onBeforeCompile = applyBlobShader;
    
    wireframeMaterialRef.current = wireframeMaterial;
    const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
    scene.add(wireframeMesh);

    let animationFrameId: number;

    const animate = (time: number = 0) => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = time * 0.001;
      const currentConfig = configRef.current.config3D;
      
      const speed = currentConfig?.animationSpeed ?? 1.0;
      const complexity = currentConfig?.complexity ?? 1.2;
      const intensity = currentConfig?.wobbleIntensity ?? 0.5;
      const rad = currentConfig?.baseRadius ?? 2;
      const shine = currentConfig?.shininess ?? 100;
      const quality = currentConfig?.quality ?? 3;

      if (quality !== currentQuality) {
        currentQuality = quality;
        geometry.dispose();
        geometry = new THREE.IcosahedronGeometry(rad, getDetail(quality));
        blobMesh.geometry = geometry;
        wireframeMesh.geometry = geometry;
        updateShadowRes(quality);
      }

      // Use "Shine Strength" purely for a smooth specular material response instead of raw bloom overload
      material.roughness = Math.max(0.25, 1.0 - (shine / 300));
      material.metalness = Math.min(0.5, shine / 600);
      
      // We will ALSO allow Shine to softly govern post-processing bloom if the user wants true glow
      bloomPass.strength = (shine / 300) * 0.8;

      // Colors 
      const colorMode = currentConfig?.colorMode || 'solid';
      const autoAnimate = currentConfig?.autoAnimateColors || false;
      const colorSpeedLocal = currentConfig?.colorSpeed ?? 1.0;
      
      if (colorMode === 'solid' && !autoAnimate) {
        customUniforms.useGradient.value = false;
        material.color.set(currentConfig?.color || '#8b5cf6');
      } else if (colorMode === 'gradient' && !autoAnimate) {
        customUniforms.useGradient.value = true;
        customUniforms.color1.value.set(currentConfig?.customColors?.[0] || '#FF0080');
        customUniforms.color2.value.set(currentConfig?.customColors?.[1] || '#00DFD8');
      } else if (autoAnimate) {
        const timeScaled = elapsedTime * colorSpeedLocal;
        const phase = timeScaled % 1.0;
        const colors = (currentConfig?.autoColors || ['#FF00A0', '#00DFD8']).map(c => new THREE.Color(c));
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
      customUniforms.uRadius.value = rad;

      blobMesh.rotation.y += 0.002 * speed;
      blobMesh.rotation.x += 0.001 * speed;
      wireframeMesh.rotation.copy(blobMesh.rotation);

      if (controlsRef.current) controlsRef.current.update();
      composer.render();
    };

    animate();

    const handleResize = () => {
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      composer.setSize(container.clientWidth, container.clientHeight);
    };
    
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (controlsRef.current) controlsRef.current.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      wireframeMaterial.dispose();
    };
  }, []); // Run once, config updates are handled via configRef

  return (
    <>
      <div className="absolute inset-x-0 bottom-4 text-center z-20 pointer-events-none">
        <p className="text-[10px] text-white/40 tracking-wider">Drag to rotate • Scroll to zoom</p>
      </div>
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-10 pl-0 cursor-move" />
    </>
  );
}
