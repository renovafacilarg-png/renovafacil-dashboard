import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { Sidebar } from './Sidebar';

function renderSidebar(initialPath = '/inbox') {
  const router = createMemoryRouter(
    [{ path: '*', element: <Sidebar /> }],
    { initialEntries: [initialPath] }
  );
  return render(
    <ThemeProvider attribute="class" defaultTheme="dark">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

describe('Sidebar', () => {
  it('renders Inbox WA link', () => {
    renderSidebar();
    expect(screen.getByRole('link', { name: /inbox wa/i })).toHaveAttribute('href', '/inbox');
  });

  it('renders Pipeline link', () => {
    renderSidebar();
    expect(screen.getByRole('link', { name: /pipeline/i })).toHaveAttribute('href', '/pipeline');
  });

  it('active link has primary styling', () => {
    renderSidebar('/inbox');
    const inboxLink = screen.getByRole('link', { name: /inbox wa/i });
    expect(inboxLink.className).toContain('text-sidebar-primary');
  });
});
