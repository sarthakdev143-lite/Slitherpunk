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

    const getPowerUpConfig = (type: string) => {
        switch (type) {
            case 'speed':
                return {
                    gradient: 'from-purple-500 via-pink-500 to-purple-600',
                    border: 'border-purple-400',
                    shadow: 'shadow-[0_0_25px_rgba(168,85,247,0.4)]',
                    glow: 'from-purple-400 to-pink-400',
                    name: 'SPEED BOOST',
                    description: 'Lightning Fast!'
                };
            case 'freeze':
                return {
                    gradient: 'from-cyan-400 via-blue-500 to-cyan-600',
                    border: 'border-cyan-400',
                    shadow: 'shadow-[0_0_25px_rgba(34,211,238,0.4)]',
                    glow: 'from-cyan-400 to-blue-400',
                    name: 'TIME FREEZE',
                    description: 'Enemies Frozen!'
                };
            case 'doubleScore':
                return {
                    gradient: 'from-yellow-400 via-orange-500 to-yellow-600',
                    border: 'border-yellow-400',
                    shadow: 'shadow-[0_0_25px_rgba(251,191,36,0.4)]',
                    glow: 'from-yellow-400 to-orange-400',
                    name: 'DOUBLE SCORE',
                    description: '2x Points!'
                };
            default:
                return {
                    gradient: 'from-purple-500 via-pink-500 to-purple-600',
                    border: 'border-purple-400',
                    shadow: 'shadow-[0_0_25px_rgba(168,85,247,0.4)]',
                    glow: 'from-purple-400 to-pink-400',
                    name: 'POWER UP',
                    description: 'Special Effect!'
                };
        }
    };

    const getMessageStyle = (message: string) => {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('game over') || lowerMessage.includes('died') || lowerMessage.includes('crashed')) {
            return {
                gradient: 'from-red-500 via-pink-500 to-red-600',
                border: 'border-red-400',
                shadow: 'shadow-[0_0_25px_rgba(239,68,68,0.4)]',
                text: 'text-red-300',
                icon: '💀'
            };
        } else if (lowerMessage.includes('paused')) {
            return {
                gradient: 'from-yellow-500 via-orange-500 to-yellow-600',
                border: 'border-yellow-400',
                shadow: 'shadow-[0_0_25px_rgba(251,191,36,0.4)]',
                text: 'text-yellow-300',
                icon: '⏸️'
            };
        } else if (lowerMessage.includes('level') || lowerMessage.includes('bonus') || lowerMessage.includes('great')) {
            return {
                gradient: 'from-green-500 via-emerald-500 to-green-600',
                border: 'border-green-400',
                shadow: 'shadow-[0_0_25px_rgba(34,197,94,0.4)]',
                text: 'text-green-300',
                icon: '🎉'
            };
        } else {
            return {
                gradient: 'from-cyan-500 via-blue-500 to-cyan-600',
                border: 'border-cyan-400',
                shadow: 'shadow-[0_0_25px_rgba(34,211,238,0.4)]',
                text: 'text-cyan-300',
                icon: 'ℹ️'
            };
        }
    };

    return (
        <aside className="ml-6 flex flex-col items-center justify-center space-y-4 min-w-[280px]">
            {/* Score Display - Retro Terminal Style */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-fuchsia-400 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                    className="relative bg-gray-900 border-2 border-cyan-400 rounded-lg p-4 px-6 text-center shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                    <div className="text-cyan-300 text-sm mb-1 tracking-wider">SCORE</div>
                    <div className="text-3xl font-bold text-white tracking-widest">
                        {score.toString().padStart(4, '0')}
                    </div>
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
            </div>

            {/* Enhanced Active Power-up Display */}
            {activePowerUp && (
                <div className="relative group w-full">
                    {(() => {
                        const config = getPowerUpConfig(activePowerUp.type);
                        const timeLeft = Math.ceil(Math.max(0, activePowerUp.endTime - Date.now()) / 1000);
                        const totalDuration = 5; // Assuming 5 seconds total duration
                        const progress = Math.max(0, (timeLeft / totalDuration) * 100);

                        return (
                            <>
                                {/* Outer glow effect */}
                                <div className={`absolute inset-0 bg-gradient-to-r ${config.glow} rounded-lg blur-md opacity-60 group-hover:opacity-80 transition duration-300 animate-pulse`}></div>

                                {/* Main power-up container */}
                                <div
                                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                                    className={`relative bg-gray-900/95 border-2 ${config.border} rounded-lg p-4 text-center backdrop-blur-sm ${config.shadow} overflow-hidden`}
                                >
                                    {/* Animated background pattern */}
                                    <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-10`}>
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-ping"></div>
                                    </div>

                                    {/* Power-up header */}
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-center space-x-2 mb-2">
                                            <span className="text-2xl animate-bounce" style={{ animationDuration: '1s' }}>
                                                {getPowerUpIcon(activePowerUp.type)}
                                            </span>
                                            <div className="text-center">
                                                <div className="text-white text-xs font-bold tracking-wider">
                                                    {config.name}
                                                </div>
                                                <div className="text-xs text-gray-300 tracking-wide opacity-80">
                                                    {config.description}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timer display */}
                                        <div className="mb-3">
                                            <div className={`text-lg font-bold ${timeLeft <= 2 ? 'text-red-300 animate-pulse' : 'text-yellow-300'} tracking-wider`}>
                                                {timeLeft}s
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${config.gradient} transition-all duration-100 ease-linear`}
                                                style={{ width: `${progress}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                            </div>
                                            {/* Animated shimmer effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                        </div>
                                    </div>

                                    {/* Corner decoration */}
                                    <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-60"></div>
                                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-white rounded-full animate-pulse opacity-40"></div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            {/* Game Start Buttons - Neon Arcade Style */}
            <div className="flex flex-col items-center gap-4 w-full">
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

                {isGameOver && (
                    <button
                        onClick={() => {
                            initGame();
                            startGame();
                        }}
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                        className="relative group bg-gray-900 border-2 border-red-400 text-red-300 py-5 px-6 rounded-lg font-bold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-red-400/10 hover:text-white hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] active:scale-95 cursor-pointer"
                    >
                        <span className="relative z-10">🚀 PLAY AGAIN</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 border-2 border-red-400/50 rounded-lg animate-ping pointer-events-none"></div>
                    </button>
                )}
            </div>

            {/* Enhanced Game Message Display */}
            {gameMessage && (
                <div className="relative w-full group">
                    {(() => {
                        const messageStyle = getMessageStyle(gameMessage);

                        return (
                            <>
                                {/* Outer glow effect */}
                                <div className={`absolute inset-0 bg-gradient-to-r ${messageStyle.gradient} rounded-lg blur opacity-60 animate-pulse`}></div>

                                {/* Main message container */}
                                <div
                                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                                    className={`relative border-2 ${messageStyle.border} rounded-lg p-4 text-center backdrop-blur-sm bg-gray-900/95 ${messageStyle.shadow} overflow-hidden max-w-80 mx-auto`}
                                >
                                    {/* Animated background */}
                                    <div className={`absolute inset-0 bg-gradient-to-r ${messageStyle.gradient} opacity-5`}>
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,0.1)_50%,transparent_70%)] animate-pulse"></div>
                                    </div>

                                    {/* Message content */}
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-center mb-2">
                                            <span className="text-lg mr-2 animate-bounce" style={{ animationDuration: '1.5s' }}>
                                                {messageStyle.icon}
                                            </span>
                                        </div>

                                        <div className={`text-xs leading-tight tracking-wider ${messageStyle.text}`}>
                                            {gameMessage.split(' ').map((word, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-block"
                                                    style={{
                                                        animation: `fadeInUp 0.3s ease-out forwards`,
                                                        animationDelay: `${index * 50}ms`,
                                                        opacity: 0,
                                                        transform: 'translateY(10px)'
                                                    }}
                                                >
                                                    {word}&nbsp;
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full animate-ping opacity-60"></div>
                                </div>

                                {/* Custom CSS for fadeInUp animation */}
                                <style jsx>{`
                                    @keyframes fadeInUp {
                                        to {
                                            opacity: 1;
                                            transform: translateY(0);
                                        }
                                    }
                                `}</style>
                            </>
                        );
                    })()}
                </div>
            )}
        </aside>
    );
};