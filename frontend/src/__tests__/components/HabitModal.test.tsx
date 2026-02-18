import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HabitModal from '../../components/habits/HabitModal';

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
  isLoading: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HabitModal', () => {
  it('does not render when isOpen=false', () => {
    render(<HabitModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Create New Habit')).not.toBeInTheDocument();
  });

  it('renders create mode header', () => {
    render(<HabitModal {...defaultProps} />);
    expect(screen.getByText('Create New Habit')).toBeInTheDocument();
  });

  it('renders edit mode header when habit is provided', () => {
    const habit = {
      id: 'habit-1',
      userId: 'user-1',
      name: 'Meditation',
      description: 'Daily meditation',
      frequency: 'DAILY' as const,
      color: '#8b5cf6',
      icon: '🧘',
      category: 'Mindfulness',
      goal: 1,
      isActive: true,
      isArchived: false,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(<HabitModal {...defaultProps} habit={habit} />);
    expect(screen.getByText('Edit Habit')).toBeInTheDocument();
  });

  it('pre-fills form with existing habit data in edit mode', () => {
    const habit = {
      id: 'habit-1',
      userId: 'user-1',
      name: 'Meditation',
      description: 'Daily meditation',
      frequency: 'DAILY' as const,
      color: '#8b5cf6',
      icon: '🧘',
      category: 'Mindfulness',
      goal: 1,
      isActive: true,
      isArchived: false,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(<HabitModal {...defaultProps} habit={habit} />);
    expect(screen.getByDisplayValue('Meditation')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Daily meditation')).toBeInTheDocument();
  });

  it('shows validation error for empty name on submit', async () => {
    const user = userEvent.setup();
    render(<HabitModal {...defaultProps} />);

    // Navigate to the Schedule tab (step 3) where submit button is
    await user.click(screen.getByText('Details'));
    await user.click(screen.getByText('Schedule'));

    // Click submit with empty name
    await user.click(screen.getByText('Create Habit'));
    expect(screen.getByText('Habit name is required')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('creates new habit with filled form', async () => {
    const user = userEvent.setup();
    render(<HabitModal {...defaultProps} />);

    // Step 1: Basics - fill name
    const nameInput = screen.getByPlaceholderText(/morning meditation/i);
    await user.type(nameInput, 'New Habit');

    // Navigate to Details
    await user.click(screen.getByText('Details'));

    // Navigate to Schedule
    await user.click(screen.getByText('Schedule'));

    // Submit
    await user.click(screen.getByText('Create Habit'));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Habit',
        frequency: 'DAILY',
      })
    );
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<HabitModal {...defaultProps} />);

    await user.keyboard('{Escape}');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes on cancel button click', async () => {
    const user = userEvent.setup();
    render(<HabitModal {...defaultProps} />);

    await user.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows habit type selection on Details step', async () => {
    const user = userEvent.setup();
    render(<HabitModal {...defaultProps} />);

    await user.click(screen.getByText('Details'));
    expect(screen.getByText('Check-off')).toBeInTheDocument();
    expect(screen.getByText('Counter')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
  });

  it('shows category selection', () => {
    render(<HabitModal {...defaultProps} />);
    expect(screen.getByText(/Health/)).toBeInTheDocument();
    expect(screen.getByText(/Fitness/)).toBeInTheDocument();
    expect(screen.getByText(/Learning/)).toBeInTheDocument();
  });
});
