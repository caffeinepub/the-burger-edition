import React from 'react';
import { WeaponState } from '../hooks/useF19FlightSimulatorGame';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  isMaxed?: (ws: WeaponState) => boolean;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'missile_refill',
    name: 'MISSILE REFILL',
    description: 'Restock all 8 air-to-air missiles',
    cost: 80,
    icon: '🚀',
    isMaxed: (ws) => ws.missileAmmo >= 16,
  },
  {
    id: 'flare_refill',
    name: 'FLARE REFILL',
    description: 'Restock all 4 countermeasure flares',
    cost: 60,
    icon: '✨',
    isMaxed: (ws) => ws.flareCount >= 8,
  },
  {
    id: 'fuel_refill',
    name: 'FUEL REFILL',
    description: 'Refill fuel tank to maximum capacity',
    cost: 50,
    icon: '⛽',
  },
  {
    id: 'fuel_tank',
    name: 'FUEL TANK UPGRADE',
    description: 'Increase max fuel capacity (max 200)',
    cost: 120,
    icon: '🛢️',
    isMaxed: (ws) => ws.maxFuel >= 200,
  },
  {
    id: 'engine_upgrade',
    name: 'ENGINE UPGRADE',
    description: 'Boost max speed by 20% (max 2.0×)',
    cost: 150,
    icon: '⚡',
    isMaxed: (ws) => ws.engineSpeedMultiplier >= 2.0,
  },
];

interface F19CoinShopProps {
  weaponState: WeaponState;
  onPurchase: (itemId: string, cost: number) => void;
  onClose: () => void;
}

export default function F19CoinShop({ weaponState, onPurchase, onClose }: F19CoinShopProps) {
  const hudGreen = '#00ff41';
  const hudDim = 'rgba(0,255,65,0.6)';
  const gold = '#ffd700';

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.88)',
    backdropFilter: 'blur(8px)',
    zIndex: 200,
    fontFamily: '"Courier New", monospace',
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(0,15,0,0.95)',
    border: `2px solid ${hudGreen}`,
    borderRadius: '6px',
    padding: '28px 32px',
    minWidth: '420px',
    maxWidth: '520px',
    width: '90%',
    boxShadow: `0 0 40px rgba(0,255,65,0.3), inset 0 0 40px rgba(0,255,65,0.05)`,
  };

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ color: hudDim, fontSize: '10px', letterSpacing: '0.4em', marginBottom: '6px' }}>
            ◆ ARMAMENT & UPGRADES ◆
          </div>
          <div style={{ color: hudGreen, fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.2em', textShadow: `0 0 16px ${hudGreen}` }}>
            COIN SHOP
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>★</span>
            <span style={{ color: gold, fontSize: '22px', fontWeight: 'bold', textShadow: `0 0 12px ${gold}` }}>
              {weaponState.coins}
            </span>
            <span style={{ color: 'rgba(255,215,0,0.6)', fontSize: '11px', letterSpacing: '0.1em' }}>COINS</span>
          </div>
        </div>

        <div style={{ borderTop: `1px solid rgba(0,255,65,0.3)`, marginBottom: '16px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SHOP_ITEMS.map(item => {
            const canAfford = weaponState.coins >= item.cost;
            const isMaxed = item.isMaxed ? item.isMaxed(weaponState) : false;
            const disabled = !canAfford || isMaxed;

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  background: disabled ? 'rgba(0,0,0,0.4)' : 'rgba(0,255,65,0.05)',
                  border: `1px solid ${disabled ? 'rgba(0,255,65,0.15)' : 'rgba(0,255,65,0.4)'}`,
                  borderRadius: '4px',
                  opacity: disabled ? 0.55 : 1,
                }}
              >
                <div style={{ fontSize: '22px', minWidth: '28px', textAlign: 'center' }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: disabled ? 'rgba(0,255,65,0.5)' : hudGreen, fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: '2px' }}>
                    {item.name}
                    {isMaxed && <span style={{ color: '#ffaa00', marginLeft: '8px', fontSize: '9px' }}>[MAXED]</span>}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '0.05em' }}>
                    {item.description}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: gold, fontSize: '10px' }}>★</span>
                    <span style={{ color: canAfford ? gold : '#ff4444', fontSize: '13px', fontWeight: 'bold' }}>
                      {item.cost}
                    </span>
                  </div>
                  <button
                    onClick={() => !disabled && onPurchase(item.id, item.cost)}
                    disabled={disabled}
                    style={{
                      background: disabled ? 'rgba(0,0,0,0.3)' : 'rgba(0,255,65,0.15)',
                      border: `1px solid ${disabled ? 'rgba(0,255,65,0.2)' : hudGreen}`,
                      color: disabled ? 'rgba(0,255,65,0.3)' : hudGreen,
                      fontFamily: '"Courier New", monospace',
                      fontSize: '9px',
                      letterSpacing: '0.15em',
                      padding: '4px 10px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      borderRadius: '2px',
                    }}
                  >
                    {isMaxed ? 'MAXED' : 'BUY'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: `1px solid rgba(0,255,65,0.3)`, marginTop: '16px', marginBottom: '14px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'rgba(0,255,65,0.4)', fontSize: '9px', letterSpacing: '0.1em' }}>
            EARN COINS BY DESTROYING TARGETS
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid rgba(0,255,65,0.5)`,
              color: hudGreen,
              fontFamily: '"Courier New", monospace',
              fontSize: '10px',
              letterSpacing: '0.2em',
              padding: '6px 16px',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            ✕ CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
