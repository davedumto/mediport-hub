import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Re-export testing utilities for convenience
export { render, screen, fireEvent, waitFor };

// Custom render function with providers if needed
export const customRender = (ui: React.ReactElement, options = {}) => {
  return render(ui, options);
};

// Common test helpers
export const clickElement = (element: HTMLElement) => {
  fireEvent.click(element);
};

export const typeText = (element: HTMLElement, text: string) => {
  fireEvent.change(element, { target: { value: text } });
};

export const waitForElement = (element: HTMLElement) => {
  return waitFor(() => expect(element).toBeInTheDocument());
};
