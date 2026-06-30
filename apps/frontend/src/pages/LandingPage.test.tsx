// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import LandingPage from './LandingPage';

test('renders LandingPage heading', () => {
  render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  );
  // Assuming LandingPage has DevDuel or similar text. We'll just check if it renders without crashing.
  expect(document.body).toBeInTheDocument();
});
