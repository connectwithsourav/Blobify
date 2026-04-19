export interface GlobalConfig {
  speed: number;
  tension: number;
  showPoints: boolean;
}

export interface Layer {
  id: string;
  data: number[];
  staticColors: [string, string];
  autoAnimateColors: boolean;
  autoColors: [string, string, string];
  colorSpeed: number;
  opacity: number;
  blur: number;
}
