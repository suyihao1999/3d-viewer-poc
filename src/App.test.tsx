import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App Component', () => {
  it('renders the get started heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /get started/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders counter button with initial count', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /count is 0/i });
    expect(button).toBeInTheDocument();
  });

  it('increments counter when button is clicked', async () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /count is 0/i });

    await userEvent.click(button);

    const updatedButton = screen.getByRole('button', { name: /count is 1/i });
    expect(updatedButton).toBeInTheDocument();
  });

  it('increments counter multiple times', async () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /count is 0/i });

    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    const updatedButton = screen.getByRole('button', { name: /count is 3/i });
    expect(updatedButton).toBeInTheDocument();
  });
});
