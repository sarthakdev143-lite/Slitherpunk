// src/hooks/useSnakeGame.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    GRID_SIZE, INITIAL_SNAKE_SPEED_MS, POWER_UP_DURATION_MS,
    CANVAS_WIDTH, CANVAS_HEIGHT, POWER_UP_SPAWN_CHANCE,
    LEFT_KEY, UP_KEY, RIGHT_KEY, DOWN_KEY
} from '../constants';
import { SnakeSegment, Food, PowerUp, ActivePowerUp, CanvasContextRef } from '../types';

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
        const shouldSpawnPowerUp = Math.random() < POWER_UP_SPAWN_CHANCE && !powerUp;

        if (shouldSpawnPowerUp) {
            const types: ('speed' | 'freeze' | 'doubleScore')[] = ['speed', 'freeze', 'doubleScore'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            const newPowerUpPos = generateCollectiblePosition(currentSnake, food, powerUp);
            setPowerUp({ ...newPowerUpPos, type: randomType });
            setFood(null); // Clear food when a power-up spawns
        } else {
            const newFoodPos = generateCollectiblePosition(currentSnake, food, powerUp);
            setFood(newFoodPos);
            setPowerUp(null); // Clear power-up when food spawns
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
     * Sets the game to an over state.
     * Stops the game loop, displays message, and shows restart button.
     */
    const gameOver = useCallback((): void => {
        setIsGameOver(true);
        setIsGameStarted(false); // Game is no longer started
        setGameMessage(`Game Over! Your score: ${score}`);
    }, []); // Removed 'score' dependency to fix ESLint warning

    /**
     * Applies the effect of a power-up.
     * @param {'speed' | 'freeze' | 'doubleScore'} type The type of power-up.
     */
    const applyPowerUpEffect = useCallback((type: 'speed' | 'freeze' | 'doubleScore'): void => {
        const endTime = Date.now() + POWER_UP_DURATION_MS;
        setActivePowerUp({ type, endTime });
        setGameMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} Power-up activated!`);
    }, []);

    /**
     * Updates the game state in each frame of the game loop.
     */
    const update = useCallback((): void => {
        // Reset the direction changing flag at the start of each update
        // This allows new direction changes to be processed in the next update cycle
        changingDirectionRef.current = false;

        setSnake((prevSnake: SnakeSegment[]) => {
            // If game is over or frozen, don't update snake position
            if (isGameOver || (activePowerUp && activePowerUp.type === 'freeze')) {
                return prevSnake;
            }

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
                    setGameMessage(`Game Over! Your score: ${currentScore}`);
                    return currentScore;
                });
                return prevSnake; // Return previous snake to show final state before game over
            } else {
                return newSnake;
            }
        });
    }, [direction, food, powerUp, isGameOver, activePowerUp, checkCollision, generateCollectible, applyPowerUpEffect]);


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

        if (isGameStarted && !isGameOver) {
            // Determine effective speed based on power-up
            let currentSpeed: number = INITIAL_SNAKE_SPEED_MS;
            if (activePowerUp && activePowerUp.type === 'speed') {
                currentSpeed = INITIAL_SNAKE_SPEED_MS / 2; // Half the interval for double speed
            }

            // Start the game update interval
            if (activePowerUp && activePowerUp.type === 'freeze') {
                // Do nothing if frozen - gameIntervalId will not be set
            } else {
                gameIntervalId = setInterval(update, currentSpeed);
            }

            // Start power-up expiration timer
            if (activePowerUp) {
                const remainingTime: number = activePowerUp.endTime - Date.now();
                if (remainingTime > 0) {
                    powerUpTimerId = setTimeout(() => {
                        setActivePowerUp(null); // Deactivate power-up
                        setGameMessage(`${activePowerUp.type.charAt(0).toUpperCase() + activePowerUp.type.slice(1)} Power-up expired.`);
                    }, remainingTime);
                } else {
                    // If power-up already expired (e.g., due to tab switch)
                    setActivePowerUp(null);
                }
            }
        }

        return () => {
            if (gameIntervalId) {
                clearInterval(gameIntervalId);
            }
            if (powerUpTimerId) {
                clearTimeout(powerUpTimerId);
            }
        };
    }, [isGameStarted, isGameOver, activePowerUp, update]);

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