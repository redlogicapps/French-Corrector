export type NavItem = {
  name: string;
  path: string;
  requiresAuth: boolean;
  icon?: React.ComponentType<{ className?: string }>;
};

export const NAV_ITEMS: NavItem[] = [
  { name: 'Home', path: '/', requiresAuth: false },
  { name: 'History', path: '/history', requiresAuth: true },
];
