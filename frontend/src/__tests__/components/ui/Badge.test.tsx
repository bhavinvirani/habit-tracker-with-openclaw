import React from 'react';
import { render, screen } from '@testing-library/react';
import Badge, { CategoryBadge, FrequencyBadge } from '../../../components/ui/Badge';

describe('Badge', () => {
  it('renders text content', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge.className).toContain('bg-dark-700');
  });

  it('renders success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge.className).toContain('bg-accent-green/20');
  });

  it('renders warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText('Warning');
    expect(badge.className).toContain('bg-accent-orange/20');
  });

  it('renders danger variant', () => {
    render(<Badge variant="danger">Danger</Badge>);
    const badge = screen.getByText('Danger');
    expect(badge.className).toContain('bg-accent-red/20');
  });

  it('renders primary variant', () => {
    render(<Badge variant="primary">Primary</Badge>);
    const badge = screen.getByText('Primary');
    expect(badge.className).toContain('bg-primary-500/20');
  });

  it('renders custom variant with color', () => {
    render(
      <Badge variant="custom" color="#3b82f6">
        Custom
      </Badge>
    );
    const badge = screen.getByText('Custom');
    expect(badge).toHaveStyle({ color: '#3b82f6' });
  });
});

describe('CategoryBadge', () => {
  it('renders category name', () => {
    render(<CategoryBadge category="Health" />);
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  it('renders with custom color for known category', () => {
    render(<CategoryBadge category="Fitness" />);
    const badge = screen.getByText('Fitness');
    expect(badge).toHaveStyle({ color: '#10b981' });
  });

  it('renders with fallback color for unknown category', () => {
    render(<CategoryBadge category="Unknown" />);
    const badge = screen.getByText('Unknown');
    expect(badge).toHaveStyle({ color: '#64748b' });
  });
});

describe('FrequencyBadge', () => {
  it('renders with capitalized frequency', () => {
    render(<FrequencyBadge frequency="DAILY" />);
    expect(screen.getByText('Daily')).toBeInTheDocument();
  });

  it('renders weekly frequency', () => {
    render(<FrequencyBadge frequency="WEEKLY" />);
    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });
});
