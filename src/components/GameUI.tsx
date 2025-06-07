// src/components/GameUI.tsx
import React from 'react';
import { ActivePowerUp } from '@/types';

interface GameUIProps {
    score: number;
    isGameStarted: boolean;
    isGameOver: boolean;
    gameMessage: string;
    activePowerUp: ActivePowerUp | null;
    startGame: () => void;
    initGame: () => void;
    pauseGame?: () => void;
    isPaused?: boolean;
    changeDirection: (keyCode: number) => void;
}

export const GameUI: React.FC<GameUIProps> = ({
    score, isGameStarted, isGameOver, gameMessage, activePowerUp,
    startGame, initGame, pauseGame, isPaused = false, changeDirection
}) => {
    const buttonClass = "w-full py-3 px-6 rounded-lg font-bold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 text-lg sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed";

    // D-pad control handler
    const handleDirectionClick = (direction: string) => {
        const keyMap = {
            'up': 38,
            'down': 40,
            'left': 37,
            'right': 39
        };
        changeDirection(keyMap[direction as keyof typeof keyMap]);
    };

    // Power-up icon mapping
    const getPowerUpIcon = (type: string) => {
        switch (type) {
            case 'speed': return '⚡';
            case 'freeze': return '❄️';
            case 'doubleScore': return '2️⃣';
            default: return '✨';
        }
    };

    return (
        <>
            {/* Score Display */}
            <div className="text-3xl sm:text-4xl font-bold mt-4 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl shadow-lg min-w-[150px] text-center border-2 border-teal-400/30">
                🏆 Score: {score}
            </div>

            {/* Active Power-up Display */}
            {activePowerUp && (
                <div className="text-lg sm:text-xl font-bold mt-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-lg shadow-lg text-center border border-purple-400/30 animate-pulse">
                    <span className="mr-2">{getPowerUpIcon(activePowerUp.type)}</span>
                    {activePowerUp.type.charAt(0).toUpperCase() + activePowerUp.type.slice(1)} Active
                    <span className="text-yellow-300 ml-2 font-mono">
                        ({Math.ceil(Math.max(0, activePowerUp.endTime - Date.now()) / 1000)}s)
                    </span>
                </div>
            )}

            {/* Game Control Buttons */}
            <div className="button-container flex flex-col sm:flex-row gap-3 mt-6 w-full sm:w-auto">
                {!isGameStarted && !isGameOver && !isPaused && (
                    <button
                        onClick={startGame}
                        className={`${buttonClass} bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-2 border-green-400/30`}
                    >
                        🎮 Start Game
                    </button>
                )}
                
                {isGameStarted && !isGameOver && !isPaused && pauseGame && (
                    <button
                        onClick={pauseGame}
                        className={`${buttonClass} bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 border-2 border-yellow-400/30`}
                    >
                        ⏸️ Pause Game
                    </button>
                )}

                {(isPaused || (!isGameStarted && score > 0)) && (
                    <button
                        onClick={() => {
                            initGame();
                            startGame();
                        }}
                        className={`${buttonClass} bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-2 border-blue-400/30`}
                    >
                        {isPaused ? '▶️ Resume' : '🔄 Restart'}
                    </button>
                )}

                {isGameOver && (
                    <button
                        onClick={() => {
                            initGame();
                            startGame();
                        }}
                        className={`${buttonClass} bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-2 border-red-400/30`}
                    >
                        🚀 Play Again
                    </button>
                )}
            </div>

            {/* Game Message */}
            {gameMessage && (
                <div className={`mt-4 p-4 rounded-lg text-lg sm:text-xl font-bold transition-all duration-500 text-center max-w-sm border-2 ${
                    isGameOver 
                        ? 'text-red-200 bg-gradient-to-r from-red-900/80 to-red-800/80 border-red-400/30' 
                        : 'text-blue-200 bg-gradient-to-r from-blue-900/80 to-blue-800/80 border-blue-400/30'
                }`}>
                    {gameMessage}
                </div>
            )}

            {/* D-Pad Controls */}
            <div className="mt-6 bg-gray-700/50 rounded-xl p-4 border border-gray-600/30">
                <p className="text-center text-sm text-gray-300 mb-3 font-semibold">🎮 Touch Controls</p>
                <div className="flex flex-col items-center gap-2">
                    {/* Up Button */}
                    <button
                        onClick={() => handleDirectionClick('up')}
                        disabled={!isGameStarted || isGameOver || isPaused}
                        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg transition-all duration-150 flex items-center justify-center text-xl border-2 border-blue-400/30 active:scale-95"
                        aria-label="Move up"
                    >
                        ⬆️
                    </button>
                    
                    {/* Left, Down, Right Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleDirectionClick('left')}
                            disabled={!isGameStarted || isGameOver || isPaused}
                            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg transition-all duration-150 flex items-center justify-center text-xl border-2 border-blue-400/30 active:scale-95"
                            aria-label="Move left"
                        >
                            ⬅️
                        </button>
                        <button
                            onClick={() => handleDirectionClick('down')}
                            disabled={!isGameStarted || isGameOver || isPaused}
                            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg transition-all duration-150 flex items-center justify-center text-xl border-2 border-blue-400/30 active:scale-95"
                            aria-label="Move down"
                        >
                            ⬇️
                        </button>
                        <button
                            onClick={() => handleDirectionClick('right')}
                            disabled={!isGameStarted || isGameOver || isPaused}
                            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg transition-all duration-150 flex items-center justify-center text-xl border-2 border-blue-400/30 active:scale-95"
                            aria-label="Move right"
                        >
                            ➡️
                        </button>
                    </div>
                </div>
                
                {/* Instructions */}
                <div className="mt-4 text-center text-xs text-gray-300 max-w-xs space-y-1">
                    <p className="font-semibold">🎯 How to Play:</p>
                    <p>• Use arrow keys, WASD, swipe on canvas, or tap buttons above</p>
                    <p>• Collect 🍎 food to grow and score points</p>
                    <p>• Get power-ups: ⚡ Speed, ❄️ Freeze, 2️⃣ Double Score</p>
                    <p>• Avoid walls and your own body!</p>
                </div>
            </div>
        </>
    );
};