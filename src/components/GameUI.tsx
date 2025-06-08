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
}

export const GameUI: React.FC<GameUIProps> = ({
    score, isGameStarted, isGameOver, gameMessage, activePowerUp,
    startGame, initGame, pauseGame, isPaused = false
}) => {
    // Power-up icon mapping
    const getPowerUpIcon = (type: string) => {
        switch (type) {
            case 'speed': return '⚡';
            case 'freeze': return '❄️';
            case 'doubleScore': return '2×';
            default: return '✨';
        }
    };

    const getPowerUpColor = (type: string) => {
        switch (type) {
            case 'speed': return 'from-purple-500 to-pink-500 border-purple-400';
            case 'freeze': return 'from-cyan-500 to-blue-500 border-cyan-400';
            case 'doubleScore': return 'from-yellow-500 to-orange-500 border-yellow-400';
            default: return 'from-purple-500 to-pink-500 border-purple-400';
        }
    };

    return (
        <aside className="ml-6 flex flex-col items-center justify-center space-y-4 min-w-[280px]">
            {/* Score Display - Retro Terminal Style */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-fuchsia-400 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                    className="relative bg-gray-900 border-2 border-cyan-400 rounded-lg p-4 text-center shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                    <div className="text-cyan-300 text-sm mb-1 tracking-wider">SCORE</div>
                    <div className="text-3xl font-bold text-white tracking-widest">
                        {score.toString().padStart(4, '0')}
                    </div>
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
            </div>

            {/* Active Power-up Display - Holographic Style */}
            {activePowerUp && (
                <div className="relative group w-full">
                    <div className={`absolute inset-0 bg-gradient-to-r ${getPowerUpColor(activePowerUp.type)} rounded-lg blur opacity-60 group-hover:opacity-80 transition duration-300 animate-pulse`}></div>
                    <div
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                        className={`relative bg-gray-900/95 border-2 ${getPowerUpColor(activePowerUp.type)} rounded-lg p-3 text-center backdrop-blur-sm`}
                    >
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <span className="text-xl animate-bounce">{getPowerUpIcon(activePowerUp.type)}</span>
                            <span className="text-xs text-cyan-300 tracking-wider uppercase">
                                {activePowerUp.type}
                            </span>
                        </div>
                        <div className="text-yellow-300 text-xs tracking-wider">
                            {Math.ceil(Math.max(0, activePowerUp.endTime - Date.now()) / 1000)}s
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                    </div>
                </div>
            )}

            {/* Game Control Buttons - Neon Arcade Style */}
            <div className="flex flex-col gap-4 w-full">
                {!isGameStarted && !isGameOver && !isPaused && (
                    <button
                        onClick={startGame}
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                        className="relative group bg-gray-900 border-2 border-green-400 text-green-300 py-4 px-6 rounded-lg font-bold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-green-400/10 hover:text-white hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] active:scale-95"
                    >
                        <span className="relative z-10">🎮 START GAME</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                    </button>
                )}

                {isGameStarted && !isGameOver && !isPaused && pauseGame && (
                    <button
                        onClick={pauseGame}
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                        className="relative group bg-gray-900 border-2 border-yellow-400 text-yellow-300 py-4 px-6 rounded-lg font-bold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-yellow-400/10 hover:text-white hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] active:scale-95"
                    >
                        <span className="relative z-10">⏸️ PAUSE</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                )}

                {(isPaused || (!isGameStarted && score > 0)) && (
                    <button
                        onClick={() => {
                            initGame();
                            startGame();
                        }}
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                        className="relative group bg-gray-900 border-2 border-blue-400 text-blue-300 py-4 px-6 rounded-lg font-bold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-blue-400/10 hover:text-white hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] active:scale-95"
                    >
                        <span className="relative z-10">
                            {isPaused ? '▶️ RESUME' : '🔄 RESTART'}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-400 rounded-tl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-400 rounded-br-lg"></div>
                    </button>
                )}

                {isGameOver && (
                    <button
                        onClick={() => {
                            initGame();
                            startGame();
                        }}
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                        className="relative group bg-gray-900 border-2 border-red-400 text-red-300 py-4 px-6 rounded-lg font-bold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-red-400/10 hover:text-white hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] active:scale-95 animate-pulse"
                    >
                        <span className="relative z-10">🚀 PLAY AGAIN</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 border-2 border-red-400/50 rounded-lg animate-ping"></div>
                    </button>
                )}
            </div>

            {/* Game Message - Retro Terminal Output */}
            {gameMessage && (
                <div className="relative w-full group">
                    <div className={`absolute inset-0 rounded-lg blur opacity-60 ${isGameOver
                        ? 'bg-gradient-to-r from-red-500 to-pink-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        } animate-pulse`}></div>
                    <div
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                        className={`relative border-2 rounded-lg p-4 text-center backdrop-blur-sm bg-gray-900/95 ${isGameOver
                            ? 'border-red-400 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                            : 'border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                            }`}
                    >
                        <div className="text-xs leading-tight tracking-wider">
                            {gameMessage.split(' ').map((word, index) => (
                                <span
                                    key={index}
                                    className="inline-block animate-pulse"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {word}&nbsp;
                                </span>
                            ))}
                        </div>
                        {/* Scanning line effect */}
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-pulse"></div>
                        <div className="absolute bottom-1 right-1 text-xs opacity-60">█</div>
                    </div>
                </div>
            )}

            {/* Ambient glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-cyan-500/5 rounded-2xl pointer-events-none"></div>
        </aside>
    );
};