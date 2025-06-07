// src/types.ts

// Represents a single segment of the snake's body
export interface SnakeSegment {
  x: number;
  y: number;
}

// Represents the food item on the canvas
export interface Food {
  x: number;
  y: number;
}

// Represents a power-up item on the canvas
export interface PowerUp {
  x: number;
  y: number;
  type: 'speed' | 'freeze' | 'doubleScore';
}

// Represents an active power-up after it's been collected
export interface ActivePowerUp {
  type: 'speed' | 'freeze' | 'doubleScore';
  endTime: number; // Timestamp when the power-up expires
}

// Type for canvas context reference
export type CanvasContextRef = React.MutableRefObject<CanvasRenderingContext2D | null>;
