// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock the localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the Web Audio API
window.AudioContext = jest.fn().mockImplementation(() => {
  return {
    createGain: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn(),
        gain: {
          value: 1,
        },
      };
    }),
    createOscillator: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: {
          value: 440,
        },
        type: 'sine',
      };
    }),
    decodeAudioData: jest.fn().mockImplementation(() => {
      return Promise.resolve({});
    }),
    createBufferSource: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        buffer: null,
      };
    }),
    destination: {},
  };
});

// Mock the navigator.vibrate API
navigator.vibrate = jest.fn();

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
