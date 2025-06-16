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
    changeDirection: (keyCode: number) => void; // Expose changeDirection for touch controls
}

interface Position {
    x: number;
    y: number;
}

const POWERUP_DURATIONS = {
    ghostTime: 5000,      // 5 seconds
    magnetHead: 10000,    // 10 seconds
    doubleScore: 8000,    // 8 seconds
    speedBoost: 6000,     // 6 seconds
    snailTime: 12000,     // 12 seconds
    blackoutMode: 8000,   // 8 seconds
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
    const changingDirectionRef = useRef<boolean>(false); // Flag to prevent rapid direction changes

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
     * @param {SnakeSegment[]} currentSnake The current snake array.
     * @param {Food | null} currentFood Current food position.
     * @param {PowerUp | null} currentPowerUp Current power-up position.
     * @returns {Object} New collectible coordinates {x, y}.
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

        } while (collisionDetected); // Keep generating until no collision

        return newCollectiblePos;
    }, [getRandomGridCoords]);

    /**
     * Decides whether to generate food or a power-up, and sets its position.
     * @param {SnakeSegment[]} currentSnake The current snake array.
     */
    const generateCollectible = useCallback((currentSnake: SnakeSegment[]): void => {
        // Choose a random power-up type to determine spawn chance
        const types: PowerUpType[] = ['ghostTime', 'magnetHead', 'doubleScore', 'goldenApple', 'speedBoost', 'snailTime', 'mysteryBox', 'blackoutMode'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const shouldSpawnPowerUp = Math.random() < (POWERUP_SPAWN_CHANCES[randomType] / 100) && !powerUp;

        if (shouldSpawnPowerUp) {
            const newPowerUpPos = generateCollectiblePosition(currentSnake, food, powerUp);
            setPowerUp({
                ...newPowerUpPos,
                type: randomType,
                endTime: Date.now() + (POWERUP_DURATIONS[randomType] || 0),
                isInstant: (POWERUP_DURATIONS[randomType] || 0) === 0
            });
        } else {
            const newFoodPos = generateCollectiblePosition(currentSnake, food, powerUp);
            setFood(newFoodPos);
        }
    }, [generateCollectiblePosition, food, powerUp]);


    /**
     * Checks for game over conditions:
     * 1. Snake hitting the canvas walls.
     * 2. Snake hitting its own body.
     * @param {SnakeSegment[]} currentSnake The current snake array.
     * @returns {boolean} True if collision detected, false otherwise.
     */
    const checkCollision = useCallback((currentSnake: SnakeSegment[]): boolean => {
        const head = currentSnake[0];

        // Check collision with walls
        if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) {
            return true; // Wall collision
        }

        // Check collision with its own body (start checking from the 1st segment after head)
        for (let i = 1; i < currentSnake.length; i++) {
            if (head.x === currentSnake[i].x && head.y === currentSnake[i].y) {
                return true; // Self collision
            }
        }
        return false; // No collision
    }, []);

    /**
     * Activates a specified power-up, applying its effects 
     * to the game, and sets the corresponding game message. 
     *
     * @param {PowerUpType} powerUpType - The type of power-up to activate.
     */
    const activatePowerUp = (powerUpType: PowerUpType) => {
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
            return;
        }

        // Handle timed powerups
        const duration = POWERUP_DURATIONS[powerUpType];
        const newPowerUp: ActivePowerUp = {
            type: powerUpType,
            startTime: now,
            endTime: now + duration,
            isInstant: duration === 0
        };

        setActivePowerUp(newPowerUp);

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
    };


    // collision detection with ghost mode
    const checkCollisions = (head: Position, body: Position[]): boolean => {
        // Ghost mode allows passing through walls and body
        if (activePowerUp && activePowerUp.type === 'ghostTime') {
            return false;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            return true;
        }

        // Check self collision
        return body.some(segment => segment.x === head.x && segment.y === head.y);
    };

    /**
     * Updates the game state in each frame of the game loop.
     */
    const update = useCallback((): void => {
        // Reset the direction changing flag at the start of each update
        // This allows new direction changes to be processed in the next update cycle
        changingDirectionRef.current = false;

        setSnake((prevSnake: SnakeSegment[]) => {
            // If game is over, don't update snake position
            if (isGameOver) return prevSnake;

            const head: SnakeSegment = { x: prevSnake[0].x, y: prevSnake[0].y };
            const newSnake: SnakeSegment[] = [...prevSnake]; // Changed to const to fix ESLint error
            let collectibleEaten: boolean = false; // Flag to track if any collectible was eaten

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

            // Add the new head to the beginning of the snake array
            newSnake.unshift(head);

            // Check for collision with food
            if (food && head.x === food.x && head.y === food.y) {
                setScore((prevScore: number) => prevScore + (activePowerUp && activePowerUp.type === 'doubleScore' ? 2 : 1));
                collectibleEaten = true;
            }
            // Check for collision with power-up
            else if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
                applyPowerUpEffect(powerUp.type);
                collectibleEaten = true;
                // Snake does not grow from power-ups, so pop the tail
                newSnake.pop();
            }

            // If no collectible was eaten, remove the tail (normal movement)
            if (!collectibleEaten) {
                newSnake.pop();
            }

            // If any collectible was eaten, generate the next one
            if (collectibleEaten) {
                generateCollectible(newSnake); // This ensures a new food or power-up spawns
            }

            // Check for collisions with the updated snake
            if (checkCollision(newSnake)) {
                // Use setScore to capture current score in gameOver message
                setScore((currentScore) => {
                    setIsGameOver(true);
                    setIsGameStarted(false);
                    return currentScore;
                });
                return prevSnake; // Return previous snake to show final state before game over
            } else {
                return newSnake;
            }
        });
    }, [direction, food, powerUp, isGameOver, activePowerUp, checkCollision, generateCollectible]);


    /**
     * Initializes the game state.
     * Resets snake, food, score, direction, and game flags.
     */
    const initGame = useCallback((): void => {
        // Calculate initial head position, slightly to the left of center for a right-moving snake
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
        setGameMessage('');
        changingDirectionRef.current = false;
        setPowerUp(null);
        setActivePowerUp(null);

        // Generate initial food (or power-up)
        const newFoodPos: Food = generateCollectiblePosition(initialSnake, null, null);
        setFood(newFoodPos); // Set initial food
    }, [generateCollectiblePosition]);


    /**
     * Handles keyboard or touch input for changing snake direction.
     * Prevents snake from immediately reversing direction.
     * @param {number} keyCode The key code corresponding to direction.
     */
    const changeDirection = useCallback((keyCode: number): void => {
        // Prevent changing direction multiple times within one update cycle
        if (changingDirectionRef.current || !isGameStarted || isGameOver) return;
        changingDirectionRef.current = true; // Set flag to true to prevent further changes

        const goingUp: boolean = direction === 'up';
        const goingDown: boolean = direction === 'down';
        const goingLeft: boolean = direction === 'left';
        const goingRight: boolean = direction === 'right';

        // Update direction only if valid and not reversing
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
     * Starts the game by setting the isGameStarted flag to true.
     * The actual game loop (setInterval) will be managed by a useEffect.
     */
    const startGame = useCallback((): void => {
        if (!isGameStarted && !isGameOver) {
            setIsGameStarted(true);
            setGameMessage(''); // Clear any previous messages
        }
    }, [isGameStarted, isGameOver]);


    // Effect for managing the game loop (setInterval) and power-up expiration
    useEffect(() => {
        let gameIntervalId: NodeJS.Timeout | undefined;
        let powerUpTimerId: NodeJS.Timeout | undefined;
        let magnetIntervalId: NodeJS.Timeout | undefined;

        if (isGameStarted && !isGameOver) {
            // Determine effective speed based on power-up
            let currentSpeed: number = INITIAL_SNAKE_SPEED_MS;

            if (activePowerUp) {
                switch (activePowerUp.type) {
                    case 'speedBoost':
                        currentSpeed = INITIAL_SNAKE_SPEED_MS / 2; // Double speed
                        break;
                    case 'snailTime':
                        currentSpeed = INITIAL_SNAKE_SPEED_MS * 2.5; // Much slower
                        break;
                }
            }

            // Start the game update interval
            gameIntervalId = setInterval(update, currentSpeed);

            // Handle magnet powerup - continuously pull food toward snake head
            if (activePowerUp && activePowerUp.type === 'magnetHead') {
                magnetIntervalId = setInterval(() => {
                    setFood(currentFood => {
                        if (!currentFood || !snake.length) return currentFood;

                        const head = snake[0];
                        const dx = head.x - currentFood.x;
                        const dy = head.y - currentFood.y;

                        // Move food closer to snake head (1 cell at a time)
                        let newX = currentFood.x;
                        let newY = currentFood.y;

                        if (Math.abs(dx) > Math.abs(dy)) {
                            newX += dx > 0 ? 1 : -1;
                        } else {
                            newY += dy > 0 ? 1 : -1;
                        }

                        // Keep food within bounds
                        newX = Math.max(0, Math.min(GRID_SIZE - 1, newX));
                        newY = Math.max(0, Math.min(GRID_SIZE - 1, newY));

                        return { x: newX, y: newY };
                    });
                }, 200); // Move food every 200ms
            }

            // Start power-up expiration timer
            if (activePowerUp && !activePowerUp.isInstant) {
                const remainingTime: number = activePowerUp.endTime - Date.now();
                if (remainingTime > 0) {
                    powerUpTimerId = setTimeout(() => {
                        const expiredPowerUp = activePowerUp.type;
                        setActivePowerUp(null);

                        // Special cleanup for certain powerups
                        if (expiredPowerUp === 'blackoutMode') {
                            // Reset vision back to normal
                            setGameMessage("Vision restored!");
                        } else {
                            setGameMessage(`${expiredPowerUp.charAt(0).toUpperCase() + expiredPowerUp.slice(1)} expired!`);
                        }
                    }, remainingTime);
                } else {
                    // If power-up already expired
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

    // Effect for adding/removing keyboard event listener
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Prevent default browser behavior for arrow keys (e.g., scrolling)
            if ([LEFT_KEY, UP_KEY, RIGHT_KEY, DOWN_KEY].includes(event.keyCode as typeof LEFT_KEY | typeof UP_KEY | typeof RIGHT_KEY | typeof DOWN_KEY)) {
                event.preventDefault();
            }
            changeDirection(event.keyCode);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [changeDirection]);

    // Initial game setup (called once when the canvas context is ready)
    useEffect(() => {
        if (canvasContextRef.current) {
            initGame();
        }
    }, [initGame, canvasContextRef]); // Dependency on canvasContextRef to ensure it's ready


    return {
        snake, food, powerUp, activePowerUp, direction, score,
        isGameOver, isGameStarted, gameMessage,
        initGame, startGame, changeDirection,
    };
};