'use client';

type CircularTimerProps = {
  remaining: number; 
  total: number;   
  size?: number;   
};


function timerColor(fraction: number): string {
  const white = [232, 228, 216]; 
  const amber = [201, 161, 90]; 
  const rust = [181, 83, 60];
  const lerp = (a: number[], b: number[], t: number) =>
    a.map((v, i) => Math.round(v + (b[i] - v) * t));
  
  const c =
    fraction > 0.5
      ? lerp(amber, white, (fraction - 0.5) / 0.5)
      : lerp(rust, amber, fraction / 0.5);
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export default function CircularTimer({ remaining, total, size = 64 }: CircularTimerProps) {
  const fraction = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const color = timerColor(fraction);

  const stroke = Math.max(3, size * 0.08);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg width={size} height={size} className="-rotate-90">
      
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(58,78,99,0.4)"
          strokeWidth={stroke}
        />
    
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.5s linear' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-mono font-semibold"
        style={{ color, fontSize: size * 0.32 }}
      >
        {Math.ceil(remaining)}
      </span>
    </div>
  );
}