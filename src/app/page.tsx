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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 text-gray-100">
            <h1 style={{ fontFamily: '"Press Start 2P", monospace' }} className="z-10 text-4xl sm:text-[2rem] mb-6 text-center bg-gray-900/70 w-fit px-6.5 mx-auto py-3.5 rounded-md border-4 border-fuchsia-400 shadow-[4px_4px_0_#000] tracking-widest uppercase absolute top-[4%]">
                <span className="text-fuchsia-300 drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)] whitespace-nowrap">snak3</span>
            </h1>

            <div className="flex relative">
                <div className="absolute z-0 bg-gray-800/90 backdrop-blur-sm p-6 pb-0 rounded-2xl shadow-2xl max-h-lg h-full border border-gray-700"></div>

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
                />
            </div>
        </div>
    );
}