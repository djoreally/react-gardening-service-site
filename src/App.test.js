import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the mobile oil change homepage identity', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /oil changes without the waiting room/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /quick mobile oil change home/i })).toBeInTheDocument();
});
