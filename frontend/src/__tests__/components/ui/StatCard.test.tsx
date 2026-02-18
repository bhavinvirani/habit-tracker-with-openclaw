import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from '../../../components/ui/StatCard';
import { Flame, Trophy } from 'lucide-react';

describe('StatCard', () => {
  it('renders value and label', () => {
    render(<StatCard icon={Flame} value={7} label="Current Streak" color="orange" />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
  });

  it('renders with suffix', () => {
    render(<StatCard icon={Trophy} value={85} label="Completion" color="green" suffix="%" />);
    // Value and suffix are in the same <span>: "85%"
    expect(screen.getByText(/85/)).toBeInTheDocument();
    expect(screen.getByText(/85/).textContent).toContain('%');
  });

  it('renders icon as SVG', () => {
    const { container } = render(<StatCard icon={Flame} value={5} label="Streak" color="orange" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders default variant', () => {
    const { container } = render(<StatCard icon={Flame} value={5} label="Streak" color="orange" />);
    // Default variant has text-2xl font-bold
    const valueEl = container.querySelector('.text-2xl');
    expect(valueEl).toBeInTheDocument();
  });

  it('renders minimal variant', () => {
    const { container } = render(
      <StatCard icon={Flame} value={5} label="Streak" color="orange" variant="minimal" />
    );
    // Minimal variant has text-lg font-bold
    const valueEl = container.querySelector('.text-lg');
    expect(valueEl).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    const { container } = render(
      <StatCard icon={Flame} value={5} label="Streak" color="orange" variant="compact" />
    );
    // Compact variant has text-xl font-bold
    const valueEl = container.querySelector('.text-xl');
    expect(valueEl).toBeInTheDocument();
  });

  it('calls onClick when clickable', async () => {
    const onClick = jest.fn();
    render(<StatCard icon={Flame} value={5} label="Streak" color="orange" onClick={onClick} />);
    const card = screen.getByText('5').closest('div');
    card?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
