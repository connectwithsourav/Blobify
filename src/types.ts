export interface Config3D {
  animationSpeed: number;
  wobbleIntensity: number;
  complexity: number;
  color: string;
  wireframe: boolean;
  baseRadius: number;
  shininess: number;
  quality: number;
  
  // Color Options
  colorMode: 'solid' | 'gradient';
  customColors: [string, string];
  autoAnimateColors: boolean;
  autoColors: string[];
  colorSpeed: number;
}

export interface GlobalConfig {
  speed: number;
  tension: number;
  showPoints: boolean;
  dimension: '2d' | '3d';
  config3D?: Config3D;
}

export interface Layer {
  id: string;
  data: number[];
  staticColors: [string, string];
  autoAnimateColors: boolean;
  autoColors: string[];
  colorSpeed: number;
  opacity: number;
  blur: number;
}
