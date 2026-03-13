import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/test-utils';
import { OrdersView } from './OrdersView';

vi.stubGlobal('fetch', vi.fn());

describe('OrdersView', () => {
  it('renders search input', () => {
    renderWithRouter(<OrdersView />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders a search button or heading', () => {
    renderWithRouter(<OrdersView />);
    const heading = screen.queryByText(/buscar pedido/i) || screen.queryByText(/pedido/i);
    expect(heading).toBeTruthy();
  });
});
