import '@testing-library/jest-dom';

const createMediaQueryList = query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

window.matchMedia = query => createMediaQueryList(query);
global.matchMedia = window.matchMedia;
