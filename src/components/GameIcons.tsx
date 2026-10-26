import React from 'react';
import { WeaponId } from '../game/types';

export function VitalityPipSvg({ state }: { state: 'full' | 'cracked' | 'empty' }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-6 sm:h-6 shrink-0" aria-hidden="true">
      <path
        d="M12 21.5C12 21.5 3.5 15.6 3.5 9.2C3.5 5.8 6.2 3.2 9.3 3.2C10.9 3.2 12 4.1 12 4.1C12 4.1 13.1 3.2 14.7 3.2C17.8 3.2 20.5 5.8 20.5 9.2C20.5 15.6 12 21.5 12 21.5Z"
        fill="#0b110e"
        stroke="#0b110e"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 20.2C12 20.2 4.5 14.8 4.5 9.2C4.5 6.4 6.7 4.2 9.3 4.2C10.8 4.2 12 5.3 12 5.3C12 5.3 13.2 4.2 14.7 4.2C17.3 4.2 19.5 6.4 19.5 9.2C19.5 14.8 12 20.2 12 20.2Z"
        fill={state === 'full' ? '#ef4444' : state === 'cracked' ? '#f97316' : '#18241e'}
        stroke={state === 'empty' ? '#334e43' : '#fca5a5'}
        strokeWidth="1.2"
      />
      {state !== 'empty' && (
        <path
          d="M7.2 7.2C7.8 6.1 9 5.6 10.2 5.8"
          stroke="#fee2e2"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {state === 'cracked' && (
        <path
          d="M12 5.2L10.3 10.2L13.4 12.6L11.2 18.5"
          stroke="#0b110e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </svg>
  );
}

const WEAPON_ICON_URLS: Record<WeaponId, string> = {
  slingshot: '/assets/icons/icon_slingshot.png',
  shotgun: '/assets/icons/icon_shotgun.png',
  nailgun: '/assets/icons/icon_nailgun.png',
  acid: '/assets/icons/icon_acid.png',
  tesla: '/assets/icons/icon_tesla.png',
};

export function WeaponIconSvg({ id }: { id: WeaponId }) {
  return (
    <img
      src={WEAPON_ICON_URLS[id]}
      alt=""
      aria-hidden="true"
      className="w-7 h-7 rounded-md object-cover border border-[#2a4539] shadow-sm shrink-0 select-none pointer-events-none"
      draggable={false}
    />
  );
}

export function GadgetIconSvg({
  kind,
}: {
  kind: 'barricade' | 'turret' | 'bell' | 'sonic_bell' | 'sandevistan' | 'shadow_ninja';
}) {
  const iconUrl =
    kind === 'barricade'
      ? '/assets/icons/icon_barricade.png'
      : kind === 'turret'
      ? '/assets/icons/icon_turret.png'
      : kind === 'sandevistan'
      ? '/assets/icons/icon_sandevistan.png'
      : kind === 'shadow_ninja'
      ? '/assets/icons/icon_shadow_ninja.png'
      : '/assets/icons/icon_sonic_bell.png';

  return (
    <img
      src={iconUrl}
      alt=""
      aria-hidden="true"
      className="w-7 h-7 rounded-md object-cover border border-[#2a4539] shadow-sm shrink-0 select-none pointer-events-none"
      draggable={false}
    />
  );
}
