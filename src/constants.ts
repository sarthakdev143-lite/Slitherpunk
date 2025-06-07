// src/constants.ts

export const GRID_SIZE = 20 as const; // Size of each snake segment and food item
export const INITIAL_SNAKE_SPEED_MS = 150 as const; // Initial speed of the snake in milliseconds
export const POWER_UP_DURATION_MS = 5000 as const; // Duration for which power-ups last (5 seconds)
export const CANVAS_WIDTH = 400 as const; // Fixed canvas width
export const CANVAS_HEIGHT = 400 as const; // Fixed canvas height
export const POWER_UP_SPAWN_CHANCE = 0.2 as const; // 20% chance for a power-up to spawn instead of food

// Key Codes for direction
export const LEFT_KEY = 37 as const;
export const UP_KEY = 38 as const;
export const RIGHT_KEY = 39 as const;
export const DOWN_KEY = 40 as const;
