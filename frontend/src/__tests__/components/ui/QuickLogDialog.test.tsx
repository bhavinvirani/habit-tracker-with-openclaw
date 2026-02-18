import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickLogDialog from '../../../components/ui/QuickLogDialog';

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
  habitName: 'Read',
  habitIcon: '📚',
  habitColor: '#2aa3ff',
  currentValue: 10,
  targetValue: 30,
  unit: 'pages',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('QuickLogDialog', () => {
  it('does not render when isOpen=false', () => {
    render(<QuickLogDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows habit name and progress info', () => {
    render(<QuickLogDialog {...defaultProps} />);
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText(/10 \/ 30/)).toBeInTheDocument();
    expect(screen.getByText(/20 left/)).toBeInTheDocument();
  });

  it('renders quick-add buttons based on target', () => {
    render(<QuickLogDialog {...defaultProps} />);
    // For target 30: quick add buttons are 1, 5, 10
    expect(screen.getByRole('button', { name: /\+1 pages/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+5 pages/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+10 pages/i })).toBeInTheDocument();
  });

  it('quick-add button calls onSubmit with correct values', async () => {
    const user = userEvent.setup();
    render(<QuickLogDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /\+5 pages/i }));
    // currentValue (10) + 5 = 15, which is < targetValue (30), so completed=false
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(15, false);
  });

  it('complete button calls onSubmit with target value', async () => {
    const user = userEvent.setup();
    render(<QuickLogDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /complete/i }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(30, true);
  });

  it('Escape closes dialog', async () => {
    const user = userEvent.setup();
    render(<QuickLogDialog {...defaultProps} />);

    await user.keyboard('{Escape}');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows custom value section when toggled', async () => {
    const user = userEvent.setup();
    render(<QuickLogDialog {...defaultProps} />);

    await user.click(screen.getByText('Custom value'));
    // Custom section should show an input and Set button
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  it('custom value input works and submits', async () => {
    const user = userEvent.setup();
    render(<QuickLogDialog {...defaultProps} />);

    // Open custom section
    await user.click(screen.getByText('Custom value'));

    // Clear and type new value
    const input = screen.getByDisplayValue('10');
    await user.clear(input);
    await user.type(input, '25');

    // Click the "Set to 25 pages" button
    await user.click(screen.getByRole('button', { name: /set to 25/i }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(25, false);
  });

  it('renders different quick-add buttons for small targets', () => {
    render(<QuickLogDialog {...defaultProps} targetValue={8} currentValue={2} />);
    // For target <= 10: buttons are 1, 2, 5
    expect(screen.getByRole('button', { name: /\+1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+5/i })).toBeInTheDocument();
  });
});
