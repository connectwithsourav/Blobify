import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createNoise3D } from 'simplex-noise';
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
    
    const getSegments = (quality: number) => {
      switch(quality) {
        case 1: return 32;
        case 2: return 64;
        case 3: return 128;
        case 4: return 256;
        default: return 128;
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
    let geometry = new THREE.SphereGeometry(baseRadius, getSegments(currentQuality), getSegments(currentQuality));
    let basePositions = geometry.attributes.position.clone();

    const customUniforms = {
      color1: { value: new THREE.Color() },
      color2: { value: new THREE.Color() },
      useGradient: { value: false }
    };

    const materialColor = configRef.current.config3D?.color || '#8b5cf6';
    const material = new THREE.MeshStandardMaterial({
      color: materialColor,
      roughness: 0.3,
      metalness: 0.1,
      flatShading: false
    });
    
    material.onBeforeCompile = (shader) => {
      shader.uniforms.color1 = customUniforms.color1;
      shader.uniforms.color2 = customUniforms.color2;
      shader.uniforms.useGradient = customUniforms.useGradient;
      
      shader.vertexShader = `
        varying vec2 vUvBlob;
      ` + shader.vertexShader;
      
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `
        #include <uv_vertex>
        vUvBlob = uv;
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
    wireframeMaterialRef.current = wireframeMaterial;
    const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
    scene.add(wireframeMesh);

    const noise3D = createNoise3D();
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
        geometry = new THREE.SphereGeometry(rad, getSegments(quality), getSegments(quality));
        basePositions = geometry.attributes.position.clone();
        blobMesh.geometry = geometry;
        wireframeMesh.geometry = geometry;
        updateShadowRes(quality);
      }

      // Update material shine properties
      material.roughness = Math.max(0.05, 1.0 - (shine / 300));
      material.metalness = Math.min(1.0, shine / 600);

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

      const positionAttribute = geometry.attributes.position;
      const vertex = new THREE.Vector3();

      for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(basePositions, i);
        const noise = noise3D(
          vertex.x * complexity + t,
          vertex.y * complexity + t,
          vertex.z * complexity + t
        );
        vertex.normalize().multiplyScalar(rad + (noise * intensity));
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }

      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();

      blobMesh.rotation.y += 0.002 * speed;
      blobMesh.rotation.x += 0.001 * speed;
      wireframeMesh.rotation.copy(blobMesh.rotation);

      if (controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
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
