/**
 * Avatar helpers — shared across InboxView, AbandonedCartsView, etc.
 */

export const AVATAR_COLORS = [
  'bg-red-500', 'bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500',
  'bg-pink-500', 'bg-cyan-600', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500',
];

export function getInitials(name: string): string {
  if (!name || name.startsWith('Cliente ')) {
    const digits = name?.replace(/\D/g, '') || '';
    return digits.slice(-2) || '??';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function getAvatarColor(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
