import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the real homepage identity', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /champion/i })).toBeInTheDocument();
});
