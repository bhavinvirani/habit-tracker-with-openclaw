import confetti from 'canvas-confetti';

const colors = ['#2aa3ff', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

/** Triple-burst confetti: center + left cannon + right cannon */
export const fireConfetti = () => {
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.6 },
    colors,
    startVelocity: 30,
    gravity: 1.2,
    ticks: 200,
  });

  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      startVelocity: 45,
      ticks: 200,
    });
  }, 150);

  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      startVelocity: 45,
      ticks: 200,
    });
  }, 300);
};
