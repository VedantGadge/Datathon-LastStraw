import React from "react";

export const EnduranceLogo = ({ className }) => {
    return (
        <div
            className={className}
            style={{
                perspective: '800px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    animation: 'float 6s ease-in-out infinite'
                }}
            >
                <style>{`
                    /* Constrained rotations to avoid edge-on disappearance */
                    @keyframes spinX-safe {
                        0% { transform: rotateX(60deg) rotateZ(0deg); }
                        100% { transform: rotateX(60deg) rotateZ(360deg); }
                    }
                    @keyframes spinY-safe {
                        0% { transform: rotateY(60deg) rotateZ(0deg); }
                        100% { transform: rotateY(60deg) rotateZ(-360deg); }
                    }
                    @keyframes spinZ-safe {
                        0% { transform: rotateX(-45deg) rotateY(45deg) rotateZ(0deg); }
                        100% { transform: rotateX(-45deg) rotateY(45deg) rotateZ(360deg); }
                    }
                    
                    @keyframes float {
                        0%, 100% { transform: translateY(-2px); }
                        50% { transform: translateY(2px); }
                    }
                    @keyframes pulse {
                         0%, 100% { opacity: 0.9; transform: scale(1); box-shadow: 0 0 10px rgba(249, 115, 22, 0.4); }
                         50% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 15px rgba(249, 115, 22, 0.6); }
                    }
                    .ring-3d {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        border-radius: 50%;
                        transform-style: preserve-3d;
                        backface-visibility: visible;
                        box-shadow: 0 0 4px rgba(249, 115, 22, 0.2); /* Subtle glow to smooth edges */
                        will-change: transform;
                    }
                `}</style>

                {/* Ring 1 - Tilted Orbit */}
                <div
                    className="ring-3d"
                    style={{
                        width: '100%',
                        height: '100%',
                        marginTop: '-50%',
                        marginLeft: '-50%',
                        border: '2.5px solid #f97316',
                        animation: 'spinX-safe 8s linear infinite',
                    }}
                />

                {/* Ring 2 - Opposing Tilted Orbit */}
                <div
                    className="ring-3d"
                    style={{
                        width: '75%',
                        height: '75%',
                        marginTop: '-37.5%',
                        marginLeft: '-37.5%',
                        border: '2.5px solid #ea580c',
                        animation: 'spinY-safe 7s linear infinite',
                    }}
                />

                {/* Ring 3 - Diagonal Orbit */}
                <div
                    className="ring-3d"
                    style={{
                        width: '100%',
                        height: '100%',
                        marginTop: '-50%',
                        marginLeft: '-50%',
                        border: '1.5px solid #fbbf24',
                        animation: 'spinZ-safe 12s linear infinite',
                    }}
                />

                {/* Core - The glowing heart */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '15%',
                        height: '15%',
                        marginTop: '-7.5%',
                        marginLeft: '-7.5%',
                        backgroundColor: '#f97316',
                        borderRadius: '50%',
                        transformStyle: 'preserve-3d',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}
                />
            </div>
        </div>
    );
};
