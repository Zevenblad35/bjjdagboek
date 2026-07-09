// Jouw email — alleen dit account heeft toegang tot /admin
export const ADMIN_EMAIL = 'peter@peterrutgersmedia.nl';

export function isAdmin(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}
