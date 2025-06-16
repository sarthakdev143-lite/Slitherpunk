// src/hooks/useSnakeGame.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    GRID_SIZE, INITIAL_SNAKE_SPEED_MS,
    CANVAS_WIDTH, CANVAS_HEIGHT,
    LEFT_KEY, UP_KEY, RIGHT_KEY, DOWN_KEY
} from '@/constants';
import { SnakeSegment, Food, PowerUp, PowerUpType, ActivePowerUp, CanvasContextRef } from '@/types';

interface UseSnakeGameReturn {
    snake: SnakeSegment[];
    food: Food | null;
    powerUp: PowerUp | null;
    activePowerUp: ActivePowerUp | null;
    direction: 'up' | 'down' | 'left' | 'right';
    score: number;
    isGameOver: boolean;
    isGameStarted: boolean;
    gameMessage: string;
    initGame: () => void;
    startGame: () => void;
    changeDirection: (keyCode: number) => void;
    activatePowerUp: (powerUpType: PowerUpType) => void;
    checkCollisions: (head: Position, body: Position[]) => boolean;
    getVisibleCells: (snakeHead: Position) => Set<string>;
}

interface Position {
    x: number;
    y: number;
}

const POWERUP_DURATIONS = {
    ghostTime: 8000,      // 8 seconds
    magnetHead: 10000,    // 10 seconds // Initially Doesn't work 
    doubleScore: 8000,    // 8 seconds
    speedBoost: 6000,     // 6 seconds
    snailTime: 12000,     // 12 seconds
    blackoutMode: 8000,   // 8 seconds // Initially Doesn't work 
    goldenApple: 0,       // Instant
    mysteryBox: 0         // Instant (will be replaced by random powerup)
};

// Powerup spawn chances (out of 100)
const POWERUP_SPAWN_CHANCES = {
    ghostTime: 12,
    magnetHead: 15,
    doubleScore: 18,
    goldenApple: 8,
    speedBoost: 12,
    snailTime: 10,
    mysteryBox: 5,
    blackoutMode: 8
};

export const useSnakeGame = (canvasContextRef: CanvasContextRef): UseSnakeGameReturn => {
    // State variables for the game
    const [snake, setSnake] = useState<SnakeSegment[]>([]);
    const [food, setFood] = useState<Food | null>(null);
    const [powerUp, setPowerUp] = useState<PowerUp | null>(null);
    const [activePowerUp, setActivePowerUp] = useState<ActivePowerUp | null>(null);
    const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('right');
    const [score, setScore] = useState<number>(0);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [gameMessage, setGameMessage] = useState<string>('');

    // Ref for mutable value that doesn't trigger re-renders
    const changingDirectionRef = useRef<boolean>(false);

    /**
     * Helper to get random coordinates on the grid.
     * @returns {Object} Random coordinates {x, y}.
     */
    const getRandomGridCoords = useCallback((): { x: number; y: number } => {
        const x = Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)) * GRID_SIZE;
        const y = Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)) * GRID_SIZE;
        return { x, y };
    }, []);

    /**
     * Generates new random coordinates for food or power-up.
     * Ensures collectible does not appear on the snake's body or another collectible.
     */
    const generateCollectiblePosition = useCallback((
        currentSnake: SnakeSegment[],
        currentFood: Food | null,
        currentPowerUp: PowerUp | null
    ): { x: number; y: number } => {
        let newCollectiblePos: { x: number; y: number };
        let collisionDetected: boolean;

        do {
            newCollectiblePos = getRandomGridCoords();
            collisionDetected = false;

            // Check collision with snake
            for (let i = 0; i < currentSnake.length; i++) {
                if (currentSnake[i].x === newCollectiblePos.x && currentSnake[i].y === newCollectiblePos.y) {
                    collisionDetected = true;
                    break;
                }
            }

            // Check collision with existing food
            if (!collisionDetected && currentFood && currentFood.x === newCollectiblePos.x && currentFood.y === newCollectiblePos.y) {
                collisionDetected = true;
            }

            // Check collision with existing power-up
            if (!collisionDetected && currentPowerUp && currentPowerUp.x === newCollectiblePos.x && currentPowerUp.y === newCollectiblePos.y) {
                collisionDetected = true;
            }

        } while (collisionDetected);

        return newCollectiblePos;
    }, [getRandomGridCoords]);

    /**
     * Decides whether to generate food or a power-up, and sets its position.
     */
    const generateCollectible = useCallback((currentSnake: SnakeSegment[]): void => {
        // First clear any existing collectibles
        setFood(null);
        setPowerUp(null);

        // Choose a random power-up type to determine spawn chance
        const types: PowerUpType[] = ['ghostTime', 'magnetHead', 'doubleScore', 'goldenApple', 'speedBoost', 'snailTime', 'mysteryBox', 'blackoutMode'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const shouldSpawnPowerUp = Math.random() < (POWERUP_SPAWN_CHANCES[randomType] / 100);

        if (shouldSpawnPowerUp) {
            const newPowerUpPos = generateCollectiblePosition(currentSnake, null, null);
            setPowerUp({
                ...newPowerUpPos,
                type: randomType,
                endTime: Date.now() + (POWERUP_DURATIONS[randomType] || 0),
                isInstant: (POWERUP_DURATIONS[randomType] || 0) === 0
            });
        } else {
            const newFoodPos = generateCollectiblePosition(currentSnake, null, null);
            setFood(newFoodPos);
        }
    }, [generateCollectiblePosition]);

    /**
     * Checks for game over conditions with proper collision detection.
     */
    const checkCollision = useCallback((currentSnake: SnakeSegment[]): boolean => {
        const head = currentSnake[0];

        // Ghost mode allows passing through walls and body
        if (activePowerUp && activePowerUp.type === 'ghostTime') {
            return false;
        }

        // Check collision with walls
        if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) {
            return true;
        }

        // Check collision with its own body (start checking from the 1st segment after head)
        for (let i = 1; i < currentSnake.length; i++) {
            if (head.x === currentSnake[i].x && head.y === currentSnake[i].y) {
                return true;
            }
        }
        return false;
    }, [activePowerUp]);

    /**
     * Applies the effect of a power-up when collected.
     */
    const applyPowerUpEffect = useCallback((powerUpType: PowerUpType): void => {
        const now = Date.now();

        // Handle mystery box - randomly select another powerup
        if (powerUpType === 'mysteryBox') {
            const availablePowerUps: PowerUpType[] = (Object.keys(POWERUP_DURATIONS) as PowerUpType[]).filter((p: PowerUpType) => p !== 'mysteryBox');
            powerUpType = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
            setGameMessage(`Mystery Box revealed: ${powerUpType}!`);
        }

        // Handle instant powerups
        if (powerUpType === 'goldenApple') {
            setScore(prevScore => prevScore + 5);
            setGameMessage("Golden Apple! +5 points!");
            setPowerUp(null);
            return;
        }

        // Handle timed powerups
        const duration = POWERUP_DURATIONS[powerUpType];
        const newPowerUp: ActivePowerUp = {
            type: powerUpType,
            startTime: now,
            endTime: now + duration,
            isInstant: duration === 0,
            x: powerUp?.x ?? 0,
            y: powerUp?.y ?? 0
        };

        setActivePowerUp(newPowerUp);
        setPowerUp(null);

        // Set appropriate message for each powerup
        const messages: Record<PowerUpType, string> = {
            ghostTime: "Ghost Mode: Pass through walls and yourself!",
            magnetHead: "Magnet Head: Food is drawn to you!",
            doubleScore: "Double Score: All food worth 2x points!",
            speedBoost: "Speed Boost: Lightning fast!",
            snailTime: "Snail Time: Slow but double points!",
            blackoutMode: "Blackout Mode: Limited vision!",
            goldenApple: "Golden Apple! +5 points!",
            mysteryBox: "Mystery Box revealed!",
        };

        setGameMessage(messages[powerUpType] || `${powerUpType} activated!`);
    }, [powerUp]);

    /**
     * Activates a specified power-up (exposed function for external use).
     */
    const activatePowerUp = useCallback((powerUpType: PowerUpType) => {
        applyPowerUpEffect(powerUpType);
    }, [applyPowerUpEffect]);

    /**
     * Get visible cells for blackout mode.
     */
    const getVisibleCells = useCallback((snakeHead: Position): Set<string> => {
        if (!activePowerUp || activePowerUp.type !== 'blackoutMode') {
            return new Set();
        }

        const visibleCells = new Set<string>();
        const visionRadius = 3;

        for (let dx = -visionRadius; dx <= visionRadius; dx++) {
            for (let dy = -visionRadius; dy <= visionRadius; dy++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= visionRadius) {
                    const x = snakeHead.x + (dx * GRID_SIZE);
                    const y = snakeHead.y + (dy * GRID_SIZE);
                    if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
                        visibleCells.add(`${x},${y}`);
                    }
                }
            }
        }

        return visibleCells;
    }, [activePowerUp]);

    // Key changes to fix Ghost Mode in useSnakeGame.ts

    // Add this helper function after the existing helper functions:
    const wrapPosition = useCallback((x: number, y: number): { x: number; y: number } => {
        let wrappedX = x;
        let wrappedY = y;

        // Wrap horizontally
        if (x < 0) {
            wrappedX = CANVAS_WIDTH - GRID_SIZE;
        } else if (x >= CANVAS_WIDTH) {
            wrappedX = 0;
        }

        // Wrap vertically
        if (y < 0) {
            wrappedY = CANVAS_HEIGHT - GRID_SIZE;
        } else if (y >= CANVAS_HEIGHT) {
            wrappedY = 0;
        }

        return { x: wrappedX, y: wrappedY };
    }, []);

    /**
     * Updates the game state in each frame of the game loop.
     */
    const update = useCallback((): void => {
        changingDirectionRef.current = false;

        setSnake((prevSnake: SnakeSegment[]) => {
            if (isGameOver) return prevSnake;

            const head: SnakeSegment = { x: prevSnake[0].x, y: prevSnake[0].y };
            const newSnake: SnakeSegment[] = [...prevSnake];
            let collectibleEaten: boolean = false;

            // Move the snake's head based on current direction
            switch (direction) {
                case 'up':
                    head.y -= GRID_SIZE;
                    break;
                case 'down':
                    head.y += GRID_SIZE;
                    break;
                case 'left':
                    head.x -= GRID_SIZE;
                    break;
                case 'right':
                    head.x += GRID_SIZE;
                    break;
            }

            // Handle Ghost Mode - wrap around screen edges
            if (activePowerUp && activePowerUp.type === 'ghostTime') {
                const wrappedPos = wrapPosition(head.x, head.y);
                head.x = wrappedPos.x;
                head.y = wrappedPos.y;
            }

            newSnake.unshift(head);

            // Check for collision with food
            if (food && head.x === food.x && head.y === food.y) {
                const pointsToAdd = (activePowerUp && (activePowerUp.type === 'doubleScore' || activePowerUp.type === 'snailTime')) ? 2 : 1 / 2;
                setScore((prevScore: number) => prevScore + pointsToAdd);
                collectibleEaten = true;
                setFood(null);
            }
            // Check for collision with power-up
            else if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
                applyPowerUpEffect(powerUp.type);
                collectibleEaten = true;
                newSnake.pop(); // Snake doesn't grow from power-ups
            }

            // If no collectible was eaten, remove the tail
            if (!collectibleEaten) {
                newSnake.pop();
            }

            // Generate new collectible if one was eaten
            if (collectibleEaten) {
                setTimeout(() => generateCollectible(newSnake), 0);
            }

            // Check for collisions (this will return false during ghost mode)
            if (checkCollision(newSnake)) {
                setScore((currentScore) => {
                    setIsGameOver(true);
                    setIsGameStarted(false);
                    setGameMessage(`Game Over! <br/> Final Score: ${currentScore}`);
                    return currentScore;
                });
                return prevSnake;
            }

            return newSnake;
        });
    }, [direction, food, powerUp, isGameOver, activePowerUp, checkCollision, generateCollectible, applyPowerUpEffect, wrapPosition]);

    // Also update the checkCollisions function to be more explicit:
    const checkCollisions = useCallback((head: Position, body: Position[]): boolean => {
        // Ghost mode allows passing through walls and body
        if (activePowerUp && activePowerUp.type === 'ghostTime') {
            return false;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) {
            return true;
        }

        // Check self collision (exclude head from body check)
        for (let i = 0; i < body.length; i++) {
            if (body[i].x === head.x && body[i].y === head.y) {
                return true;
            }
        }

        return false;
    }, [activePowerUp]);

    /**
     * Initializes the game state.
     */
    const initGame = useCallback((): void => {
        const initialHeadX: number = Math.floor((CANVAS_WIDTH / 2 - GRID_SIZE) / GRID_SIZE) * GRID_SIZE;
        const initialHeadY: number = Math.floor(CANVAS_HEIGHT / 2 / GRID_SIZE) * GRID_SIZE;

        const initialSnake: SnakeSegment[] = [
            { x: initialHeadX, y: initialHeadY },
            { x: initialHeadX - GRID_SIZE, y: initialHeadY },
            { x: initialHeadX - (2 * GRID_SIZE), y: initialHeadY }
        ];

        setSnake(initialSnake);
        setDirection('right');
        setScore(0);
        setIsGameOver(false);
        setIsGameStarted(false);
        setGameMessage('Press any arrow key to start!');
        changingDirectionRef.current = false;
        setPowerUp(null);
        setActivePowerUp(null);

        // Generate initial food
        const newFoodPos: Food = generateCollectiblePosition(initialSnake, null, null);
        setFood(newFoodPos);
    }, [generateCollectiblePosition]);

    /**
     * Handles direction changes with proper validation.
     */
    const changeDirection = useCallback((keyCode: number): void => {
        if (changingDirectionRef.current || isGameOver) return;

        // Auto-start game on first direction input
        if (!isGameStarted) {
            setIsGameStarted(true);
            setGameMessage('');
        }

        changingDirectionRef.current = true;

        const goingUp: boolean = direction === 'up';
        const goingDown: boolean = direction === 'down';
        const goingLeft: boolean = direction === 'left';
        const goingRight: boolean = direction === 'right';

        if (keyCode === LEFT_KEY && !goingRight) {
            setDirection('left');
        } else if (keyCode === UP_KEY && !goingDown) {
            setDirection('up');
        } else if (keyCode === RIGHT_KEY && !goingLeft) {
            setDirection('right');
        } else if (keyCode === DOWN_KEY && !goingUp) {
            setDirection('down');
        }
    }, [direction, isGameStarted, isGameOver]);

    /**
     * Starts the game manually.
     */
    const startGame = useCallback((): void => {
        if (!isGameStarted && !isGameOver) {
            setIsGameStarted(true);
            setGameMessage('');
        }
    }, [isGameStarted, isGameOver]);

    // Game loop and power-up management effect
    useEffect(() => {
        let gameIntervalId: NodeJS.Timeout | undefined;
        let powerUpTimerId: NodeJS.Timeout | undefined;
        let magnetIntervalId: NodeJS.Timeout | undefined;

        if (isGameStarted && !isGameOver) {
            // Determine speed based on active power-up
            let currentSpeed: number = INITIAL_SNAKE_SPEED_MS;

            if (activePowerUp) {
                switch (activePowerUp.type) {
                    case 'speedBoost':
                        currentSpeed = INITIAL_SNAKE_SPEED_MS / 2;
                        break;
                    case 'snailTime':
                        currentSpeed = INITIAL_SNAKE_SPEED_MS * 2.5;
                        break;
                }
            }

            gameIntervalId = setInterval(update, currentSpeed);

            // Handle magnet powerup
            if (activePowerUp && activePowerUp.type === 'magnetHead' && food) {
                magnetIntervalId = setInterval(() => {
                    setFood(currentFood => {
                        if (!currentFood || !snake.length) return currentFood;

                        const head = snake[0];
                        const dx = head.x - currentFood.x;
                        const dy = head.y - currentFood.y;

                        let newX = currentFood.x;
                        let newY = currentFood.y;

                        // Move food one grid cell at a time toward snake head
                        if (Math.abs(dx) >= GRID_SIZE) {
                            newX += dx > 0 ? GRID_SIZE : -GRID_SIZE;
                        } else if (Math.abs(dy) >= GRID_SIZE) {
                            newY += dy > 0 ? GRID_SIZE : -GRID_SIZE;
                        }

                        // Keep food within bounds
                        newX = Math.max(0, Math.min(CANVAS_WIDTH - GRID_SIZE, newX));
                        newY = Math.max(0, Math.min(CANVAS_HEIGHT - GRID_SIZE, newY));

                        return { x: newX, y: newY };
                    });
                }, 300);
            }

            // Handle power-up expiration
            if (activePowerUp && !activePowerUp.isInstant) {
                const remainingTime: number = activePowerUp.endTime - Date.now();
                if (remainingTime > 0) {
                    powerUpTimerId = setTimeout(() => {
                        const expiredPowerUp = activePowerUp.type;
                        setActivePowerUp(null);
                        setGameMessage(`${expiredPowerUp} expired!`);
                    }, remainingTime);
                } else {
                    setActivePowerUp(null);
                }
            }
        }

        return () => {
            if (gameIntervalId) clearInterval(gameIntervalId);
            if (powerUpTimerId) clearTimeout(powerUpTimerId);
            if (magnetIntervalId) clearInterval(magnetIntervalId);
        };
    }, [isGameStarted, isGameOver, activePowerUp, update, snake, food]);

    // Keyboard event listener
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const arrowKeys = [LEFT_KEY, UP_KEY, RIGHT_KEY, DOWN_KEY];
            if (arrowKeys.includes(event.keyCode as any)) {
                event.preventDefault();
                changeDirection(event.keyCode);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [changeDirection]);

    // Initialize game when canvas context is ready
    useEffect(() => {
        if (canvasContextRef.current) {
            initGame();
        }
    }, [initGame, canvasContextRef]);

    return {
        snake, food, powerUp, activePowerUp, direction, score,
        isGameOver, isGameStarted, gameMessage, activatePowerUp,
        initGame, startGame, changeDirection, checkCollisions, getVisibleCells
    };
};