import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

describe('Button', () => {
  it('renders text content', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('shows loading spinner when loading=true', () => {
    render(<Button loading>Submit</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('disabled state prevents click', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
    );

    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);

    await user.click(screen.getByRole('button', { name: /click/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders with icon', () => {
    render(<Button icon={Plus}>Add</Button>);
    const button = screen.getByRole('button', { name: /add/i });
    expect(button).toBeInTheDocument();
    // Icon renders as an SVG inside the button
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('renders icon-only button', () => {
    render(<Button icon={Plus} iconOnly />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Full</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-full');
  });
});
