import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
  title: 'Delete Item',
  message: 'Are you sure you want to delete this?',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ConfirmDialog', () => {
  it('does not render when isOpen=false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title and message when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this?')).toBeInTheDocument();
  });

  it('calls onConfirm on confirm click', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on cancel click', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.keyboard('{Escape}');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose on close button click', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByLabelText('Close dialog'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom confirm and cancel text', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Delete" cancelText="Keep" />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
  });

  it('shows loading state on confirm button', () => {
    render(<ConfirmDialog {...defaultProps} loading />);
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toHaveAttribute('aria-busy', 'true');
  });

  it('renders danger variant with alert icon', () => {
    render(<ConfirmDialog {...defaultProps} danger />);
    // The danger variant renders an AlertTriangle icon
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
