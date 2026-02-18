import React, { useState, useEffect, useRef } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import type { ISourceOptions } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';

const bubblesOptions: ISourceOptions = {
  fullScreen: { enable: true, zIndex: 0 },
  background: { color: 'transparent' },
  fpsLimit: 60,
  particles: {
    number: { value: 30 },
    color: { value: ['#2aa3ff', '#8b5cf6', '#06b6d4', '#52c2ff'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.03, max: 0.08 },
      animation: { enable: true, speed: 0.3, sync: false },
    },
    size: {
      value: { min: 6, max: 45 },
      animation: { enable: true, speed: 1.5, sync: false },
    },
    move: {
      enable: true,
      speed: { min: 0.2, max: 0.8 },
      direction: 'none',
      outModes: { default: 'out' },
      random: true,
    },
  },
  detectRetina: true,
};

const BubblesBackground: React.FC = () => {
  const [ready, setReady] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <Particles id="bubbles-bg" options={bubblesOptions} />;
};

export default BubblesBackground;
