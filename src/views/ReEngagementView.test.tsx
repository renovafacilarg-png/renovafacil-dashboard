import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '@/test-utils';
import { ReEngagementView } from './ReEngagementView';

describe('ReEngagementView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders create campaign button', async () => {
    renderWithRouter(<ReEngagementView />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nueva campaña|crear/i })).toBeInTheDocument();
    });
  });

  it('renders empty state when API unavailable', async () => {
    renderWithRouter(<ReEngagementView />);
    await waitFor(() => {
      expect(screen.getByText(/no hay campañas|sin campañas|phase 3/i)).toBeInTheDocument();
    });
  });
});
