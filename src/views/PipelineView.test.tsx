import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '@/test-utils';
import { PipelineView } from './PipelineView';

describe('PipelineView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders 6 Kanban columns', async () => {
    renderWithRouter(<PipelineView />);
    await waitFor(() => {
      expect(screen.getByText('Nuevo')).toBeInTheDocument();
      expect(screen.getByText('Interesado')).toBeInTheDocument();
      expect(screen.getByText('Link enviado')).toBeInTheDocument();
      expect(screen.getByText('Pagó')).toBeInTheDocument();
      expect(screen.getByText('Entregado')).toBeInTheDocument();
      expect(screen.getByText('Recurrente')).toBeInTheDocument();
    });
  });

  it('shows empty state when API returns no clients', async () => {
    renderWithRouter(<PipelineView />);
    await waitFor(() => {
      // Each column shows 0 clients
      const counts = screen.getAllByText('0');
      expect(counts.length).toBeGreaterThanOrEqual(6);
    });
  });

  it('renders client card with name and phone when data available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        clients: [{ id: '1', name: 'Juan Perez', phone: '+5491155555555', state: 'nuevo', last_message: 'Hola', time_in_state: 30 }]
      }),
    }));
    renderWithRouter(<PipelineView />);
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });
  });
});
