import { render, screen, cleanup } from '@testing-library/react';
import App from './App';

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

test('renders the default mobile oil change homepage identity', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /oil changes without the waiting room/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /quick mobile oil change home/i })).toBeInTheDocument();
});

test('renders a MultiSaaS experience without changing the source default', () => {
  window.history.replaceState({}, '', '/?ms_name=Oil%20Change%20Demo%20Managed&ms_tagline=Owner-managed%20experience&ms_color=%232563eb');
  const { container } = render(<App />);
  expect(screen.getByRole('link', { name: /oil change demo managed home/i })).toBeInTheDocument();
  expect(screen.getByText('Owner-managed experience')).toBeInTheDocument();
  expect(container.querySelector('.site-shell')).toHaveStyle('--accent: #2563eb');
});
