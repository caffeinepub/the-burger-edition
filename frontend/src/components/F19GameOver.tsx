interface F19GameOverProps {
  crashReason: 'TERRAIN_IMPACT' | 'WATER_IMPACT' | 'FUEL_EMPTY' | null;
  onRestart: () => void;
}

const CRASH_MESSAGES: Record<string, { title: string; subtitle: string; color: string }> = {
  TERRAIN_IMPACT: {
    title: 'TERRAIN IMPACT',
    subtitle: 'Aircraft destroyed on impact with terrain',
    color: '#ff4444',
  },
  WATER_IMPACT: {
    title: 'WATER IMPACT',
    subtitle: 'Aircraft lost at sea — ditched in ocean',
    color: '#4488ff',
  },
  FUEL_EMPTY: {
    title: 'OUT OF FUEL',
    subtitle: 'Engine cutout — aircraft lost control',
    color: '#ffaa00',
  },
};

export default function F19GameOver({ crashReason, onRestart }: F19GameOverProps) {
  const info = crashReason ? CRASH_MESSAGES[crashReason] : CRASH_MESSAGES.TERRAIN_IMPACT;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(6px)',
      zIndex: 100,
      fontFamily: '"Courier New", monospace',
    }}>
      {/* Crash icon */}
      <div style={{ fontSize: '64px', marginBottom: '16px', filter: `drop-shadow(0 0 20px ${info.color})` }}>
        💥
      </div>

      {/* CRASH label */}
      <div style={{
        color: info.color,
        fontSize: '11px',
        letterSpacing: '0.4em',
        marginBottom: '8px',
        textShadow: `0 0 16px ${info.color}`,
      }}>
        MISSION FAILED
      </div>

      {/* Crash reason */}
      <div style={{
        color: info.color,
        fontSize: '22px',
        fontWeight: 'bold',
        letterSpacing: '0.15em',
        textShadow: `0 0 20px ${info.color}`,
        marginBottom: '12px',
        textAlign: 'center',
      }}>
        {info.title}
      </div>

      {/* Subtitle */}
      <div style={{
        color: 'rgba(255,255,255,0.6)',
        fontSize: '11px',
        letterSpacing: '0.1em',
        marginBottom: '40px',
        textAlign: 'center',
      }}>
        {info.subtitle}
      </div>

      {/* Restart button */}
      <button
        onClick={onRestart}
        style={{
          background: 'transparent',
          border: `2px solid ${info.color}`,
          color: info.color,
          fontFamily: '"Courier New", monospace',
          fontSize: '13px',
          letterSpacing: '0.25em',
          padding: '12px 32px',
          cursor: 'pointer',
          textShadow: `0 0 8px ${info.color}`,
          boxShadow: `0 0 16px ${info.color}40, inset 0 0 16px ${info.color}10`,
          borderRadius: '2px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = `${info.color}20`;
          (e.target as HTMLButtonElement).style.boxShadow = `0 0 24px ${info.color}80, inset 0 0 24px ${info.color}20`;
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = 'transparent';
          (e.target as HTMLButtonElement).style.boxShadow = `0 0 16px ${info.color}40, inset 0 0 16px ${info.color}10`;
        }}
      >
        ↺ RETURN TO BASE
      </button>

      {/* Tip */}
      <div style={{
        color: 'rgba(0,255,65,0.4)',
        fontSize: '9px',
        letterSpacing: '0.15em',
        marginTop: '24px',
      }}>
        AIRCRAFT RESET TO RUNWAY
      </div>
    </div>
  );
}
