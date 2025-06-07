"use client";

// src/App.tsx
import React, { useRef } from 'react';
import { useSnakeGame } from '@/hooks/useSnakeGame';
import { GameCanvas } from '@/components/GameCanvas';
import { GameUI } from '@/components/GameUI';
import { CanvasContextRef } from '@/types';

export default function App() {
    // Ref for the canvas 2D rendering context, managed by App and passed to hook/canvas
    const canvasContextRef: CanvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

    const {
        snake, food, powerUp, activePowerUp, score,
        isGameOver, isGameStarted, gameMessage,
        initGame, startGame, changeDirection
    } = useSnakeGame(canvasContextRef);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 text-gray-100">
            <div className="game-container flex flex-col items-center bg-gray-800/90 backdrop-blur-sm p-6 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-700">
                <h1 style={{ fontFamily: '"Press Start 2P", monospace' }} className="text-4xl sm:text-[2rem] mb-6 text-center bg-gray-900/70 px-5 py-3.5 rounded-md border-4 border-fuchsia-400 shadow-[4px_4px_0_#000] tracking-wider uppercase">
                    <span className="text-fuchsia-300 drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)] whitespace-nowrap">Hungry Snake</span>
                </h1>

                <GameCanvas
                    snake={snake}
                    food={food}
                    powerUp={powerUp}
                    canvasContextRef={canvasContextRef}
                    changeDirection={changeDirection}
                />

                <GameUI
                    score={score}
                    isGameStarted={isGameStarted}
                    isGameOver={isGameOver}
                    gameMessage={gameMessage}
                    activePowerUp={activePowerUp}
                    startGame={startGame}
                    initGame={initGame}
                    changeDirection={changeDirection}
                />
            </div>
        </div>
    );
}