import React from "react";

export default function CornerLight({ className, style }) {
    // We create a "Fan" of rays
    const rays = [
        { angle: -20, width: 80, height: 800, left: '20%', opacity: 0.3, delay: 0 },
        { angle: -10, width: 100, height: 900, left: '35%', opacity: 0.5, delay: 0.1 },
        { angle: 0, width: 120, height: 1000, left: '50%', opacity: 0.7, delay: 0.2 }, // Center/Main beam
        { angle: 10, width: 100, height: 900, left: '65%', opacity: 0.5, delay: 0.3 },
        { angle: 20, width: 80, height: 800, left: '80%', opacity: 0.3, delay: 0.4 },
    ];

    return (
        <div className={`pointer-events-none absolute w-[600px] h-[600px] ${className}`} style={style}>

            {/* Ambient Orange Glow (Backlight) */}
            <div
                className="absolute -top-[100px] -left-[100px] w-[800px] h-[800px] rounded-full opacity-50 blur-[80px]"
                style={{
                    background: 'radial-gradient(circle at center, #FFAA40 0%, #FFD080 30%, transparent 70%)',
                }}
            />

            {/* Rays Container */}
            <div className="absolute top-0 left-0 w-full h-full overflow-visible">
                {rays.map((ray, i) => (
                    <div
                        key={i}
                        className="absolute -top-[100px] origin-top mix-blend-overlay"
                        style={{
                            left: ray.left,
                            width: `${ray.width}px`,
                            height: `${ray.height}px`,
                            transform: `translateX(-50%) rotate(${ray.angle}deg)`,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,240,200,0.4) 40%, transparent 100%)',
                            filter: 'blur(12px)',
                            opacity: ray.opacity,
                        }}
                    />
                ))}
            </div>

            {/* Core Brightness (Hotspot at origin) */}
            <div
                className="absolute top-[-50px] left-[50%] -translate-x-1/2 w-[300px] h-[300px] rounded-full blur-[50px] opacity-60 mix-blend-screen"
                style={{ background: '#FFF5D0' }}
            />
        </div>
    );
}
