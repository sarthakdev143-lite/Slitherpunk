// src/components/GameCanvas.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, LEFT_KEY, UP_KEY, RIGHT_KEY, DOWN_KEY } from '../constants';
import { SnakeSegment, Food, PowerUp, CanvasContextRef } from '../types';

interface GameCanvasProps {
    snake: SnakeSegment[];
    food: Food | null;
    powerUp: PowerUp | null;
    canvasContextRef: CanvasContextRef;
    changeDirection: (keyCode: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
    snake, food, powerUp, canvasContextRef, changeDirection
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const SWIPE_THRESHOLD = 30;

    /**
     * Draws all game elements on the canvas.
     */
    const draw = useCallback(() => {
        const ctx = canvasContextRef.current;
        if (!ctx) return;

        // Clear the entire canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Add a subtle grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < CANVAS_WIDTH; i += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let i = 0; i < CANVAS_HEIGHT; i += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(CANVAS_WIDTH, i);
            ctx.stroke();
        }

        // Draw the snake with improved visuals
        for (let i = 0; i < snake.length; i++) {
            const segment = snake[i];

            if (i === 0) {
                // Snake head - special styling with gradient
                const gradient = ctx.createLinearGradient(segment.x, segment.y, segment.x + GRID_SIZE, segment.y + GRID_SIZE);
                gradient.addColorStop(0, '#3498db');
                gradient.addColorStop(1, '#2980b9');

                ctx.fillStyle = gradient;
                ctx.strokeStyle = '#1f4e79';
                ctx.lineWidth = 2;

                // Draw rounded rectangle for head
                ctx.beginPath();
                ctx.roundRect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 4);
                ctx.fill();
                ctx.stroke();

                // Add eyes to the head
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(segment.x + 6, segment.y + 6, 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(segment.x + GRID_SIZE - 6, segment.y + 6, 2, 0, 2 * Math.PI);
                ctx.fill();

                // Add pupils
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(segment.x + 6, segment.y + 6, 1, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(segment.x + GRID_SIZE - 6, segment.y + 6, 1, 0, 2 * Math.PI);
                ctx.fill();
            } else {
                // Snake body with alternating colors
                const bodyGradient = ctx.createLinearGradient(segment.x, segment.y, segment.x + GRID_SIZE, segment.y + GRID_SIZE);
                if (i % 2 === 0) {
                    bodyGradient.addColorStop(0, '#27ae60');
                    bodyGradient.addColorStop(1, '#229954');
                } else {
                    bodyGradient.addColorStop(0, '#2ecc71');
                    bodyGradient.addColorStop(1, '#27ae60');
                }

                ctx.fillStyle = bodyGradient;
                ctx.strokeStyle = '#1e8449';
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.roundRect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        // Draw the food with pulsing animation
        if (food) {
            const time = Date.now() * 0.005;
            const pulse = Math.sin(time) * 0.15 + 0.85;

            const foodGradient = ctx.createRadialGradient(
                food.x + GRID_SIZE / 2, food.y + GRID_SIZE / 2, 0,
                food.x + GRID_SIZE / 2, food.y + GRID_SIZE / 2, GRID_SIZE / 2
            );
            foodGradient.addColorStop(0, `rgba(231, 76, 60, ${pulse})`);
            foodGradient.addColorStop(1, `rgba(192, 57, 43, ${pulse})`);

            ctx.fillStyle = foodGradient;
            ctx.strokeStyle = '#a93226';
            ctx.lineWidth = 2;

            const offset = (1 - pulse) * 2;
            ctx.beginPath();
            ctx.roundRect(food.x + offset, food.y + offset, GRID_SIZE - offset * 2, GRID_SIZE - offset * 2, 4);
            ctx.fill();
            ctx.stroke();

            // Add food emoji
            ctx.font = `${GRID_SIZE * 0.7}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText('🍎', food.x + GRID_SIZE / 2, food.y + GRID_SIZE / 2);
        }

        // Draw the power-up with glowing effects
        if (powerUp) {
            const time = Date.now() * 0.008;
            const glow = Math.sin(time) * 0.4 + 0.6;

            const colors = {
                speed: { primary: `rgba(155, 89, 182, ${glow})`, secondary: `rgba(125, 60, 152, ${glow})` },
                freeze: { primary: `rgba(52, 152, 219, ${glow})`, secondary: `rgba(41, 128, 185, ${glow})` },
                doubleScore: { primary: `rgba(241, 196, 15, ${glow})`, secondary: `rgba(243, 156, 18, ${glow})` }
            };

            const powerUpGradient = ctx.createRadialGradient(
                powerUp.x + GRID_SIZE / 2, powerUp.y + GRID_SIZE / 2, 0,
                powerUp.x + GRID_SIZE / 2, powerUp.y + GRID_SIZE / 2, GRID_SIZE / 2
            );
            powerUpGradient.addColorStop(0, colors[powerUp.type].primary);
            powerUpGradient.addColorStop(1, colors[powerUp.type].secondary);

            ctx.fillStyle = powerUpGradient;
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;

            const glowOffset = (1 - glow) * 1.5;
            ctx.beginPath();
            ctx.roundRect(powerUp.x + glowOffset, powerUp.y + glowOffset, GRID_SIZE - glowOffset * 2, GRID_SIZE - glowOffset * 2, 6);
            ctx.fill();
            ctx.stroke();

            // Add outer glow effect
            ctx.shadowColor = colors[powerUp.type].primary;
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Add power-up icons
            ctx.font = `${GRID_SIZE * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';

            const icons = {
                speed: '⚡',
                freeze: '❄️',
                doubleScore: '2×'
            };

            ctx.fillText(
                icons[powerUp.type],
                powerUp.x + GRID_SIZE / 2,
                powerUp.y + GRID_SIZE / 2
            );
        }
    }, [snake, food, powerUp, canvasContextRef]);

    // Enhanced touch event handlers with better feedback
    const handleTouchStart = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                touchStartRef.current = {
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top
                };
            }
        }
    }, []);

    const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        if (!touchStartRef.current || event.changedTouches.length === 0) return;

        const touch = event.changedTouches[0];
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const touchEndX = touch.clientX - rect.left;
        const touchEndY = touch.clientY - rect.top;

        const dx = touchEndX - touchStartRef.current.x;
        const dy = touchEndY - touchStartRef.current.y;

        // Determine swipe direction with improved sensitivity
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
            // Horizontal swipe
            changeDirection(dx > 0 ? RIGHT_KEY : LEFT_KEY);
        } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_THRESHOLD) {
            // Vertical swipe
            changeDirection(dy > 0 ? DOWN_KEY : UP_KEY);
        }

        touchStartRef.current = null;
    }, [changeDirection]);

    // Prevent touch scrolling
    const handleTouchMove = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
        event.preventDefault();
    }, []);

    // Effect for initializing canvas context
    useEffect(() => {
        if (canvasRef.current && !canvasContextRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                canvasContextRef.current = ctx;
                canvasRef.current.width = CANVAS_WIDTH;
                canvasRef.current.height = CANVAS_HEIGHT;

                // Set high DPI support for crisp rendering
                const dpr = window.devicePixelRatio || 1;
                canvasRef.current.style.width = CANVAS_WIDTH + 'px';
                canvasRef.current.style.height = CANVAS_HEIGHT + 'px';
                canvasRef.current.width = CANVAS_WIDTH * dpr;
                canvasRef.current.height = CANVAS_HEIGHT * dpr;
                ctx.scale(dpr, dpr);
            }
        }
    }, [canvasContextRef]);

    // Effect for drawing whenever game state changes
    useEffect(() => {
        draw();
    }, [draw]);

    return (
        <div className="relative">
            <canvas
                id="gameCanvas"
                ref={canvasRef}
                className="bg-gray-900 border-4 rounded-xl shadow-2xl cursor-pointer touch-none transition-all duration-300 border-purple-500/70"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                style={{
                    touchAction: 'none',
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT
                }}
                aria-label="Snake game canvas - swipe to control snake direction"
            />
        </div>
    );
};