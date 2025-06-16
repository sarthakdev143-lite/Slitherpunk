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

export type PowerUpType = 'ghostTime' | 'magnetHead' | 'doubleScore' | 'goldenApple' | 'speedBoost' | 'snailTime' | 'mysteryBox' | 'blackoutMode';

export interface PowerUp {
  type: PowerUpType;
  endTime: number;
  isInstant?: boolean;
}

// Represents an active power-up after it's been collected
export interface ActivePowerUp extends PowerUp {
  startTime: number;
}


// Type for canvas context reference
export type CanvasContextRef = React.MutableRefObject<CanvasRenderingContext2D | null>;
