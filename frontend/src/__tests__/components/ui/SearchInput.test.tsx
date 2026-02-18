import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchInput from '../../../components/ui/SearchInput';

describe('SearchInput', () => {
  it('renders with placeholder text', () => {
    render(<SearchInput value="" onChange={jest.fn()} placeholder="Search habits..." />);
    expect(screen.getByPlaceholderText('Search habits...')).toBeInTheDocument();
  });

  it('renders default placeholder when none provided', () => {
    render(<SearchInput value="" onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('calls onChange on typing', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<SearchInput value="" onChange={onChange} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'med');
    expect(onChange).toHaveBeenCalledTimes(3);
    // Controlled component — each keystroke fires onChange with the single character
    // (since value prop doesn't update in this test, input stays empty between keystrokes)
    expect(onChange).toHaveBeenNthCalledWith(1, 'm');
    expect(onChange).toHaveBeenNthCalledWith(2, 'e');
    expect(onChange).toHaveBeenNthCalledWith(3, 'd');
  });

  it('clear button appears when value exists', () => {
    render(<SearchInput value="test" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clear button is hidden when value is empty', () => {
    render(<SearchInput value="" onChange={jest.fn()} />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('clear button calls onChange with empty string', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<SearchInput value="test" onChange={onChange} />);

    await user.click(screen.getByLabelText('Clear search'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('hides clear button when showClear=false', () => {
    render(<SearchInput value="test" onChange={jest.fn()} showClear={false} />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });
});
