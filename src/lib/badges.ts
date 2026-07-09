// Alle badges definitie + berekening

export interface Badge {
  id: string;
  title: string;
  desc: string;
  icon: string;
  category: 'sessies' | 'uren' | 'doelen' | 'belt' | 'strepen' | 'type';
}

export const BADGES: Badge[] = [
  // Sessies
  { id: 'first_session',  title: 'Eerste stap',       desc: 'Eerste sessie gelogd',          icon: '🥋', category: 'sessies' },
  { id: 'sessions_10',    title: 'Op de mat',          desc: '10 sessies gelogd',             icon: '✦',  category: 'sessies' },
  { id: 'sessions_50',    title: 'Vaste bezoeker',     desc: '50 sessies gelogd',             icon: '⭐', category: 'sessies' },
  { id: 'sessions_100',   title: 'Honderd keer',       desc: '100 sessies gelogd',            icon: '💯', category: 'sessies' },
  { id: 'sessions_200',   title: 'Mat veteraan',       desc: '200 sessies gelogd',            icon: '🏆', category: 'sessies' },
  // Mat uren
  { id: 'hours_10',       title: '10 mat uren',        desc: '10 uur getraind',               icon: '⏱',  category: 'uren' },
  { id: 'hours_50',       title: '50 mat uren',        desc: '50 uur getraind',               icon: '⌚', category: 'uren' },
  { id: 'hours_200',      title: '200 mat uren',       desc: '200 uur getraind',              icon: '🕰',  category: 'uren' },
  { id: 'hours_500',      title: '500 mat uren',       desc: '500 uur getraind',              icon: '⚡', category: 'uren' },
  // Type
  { id: 'seminar',        title: 'Seminar ganger',     desc: 'Eerste seminar bijgewoond',     icon: '📋', category: 'type' },
  { id: 'competition',    title: 'Eerste competitie',  desc: 'Eerste competitie gelogd',      icon: '🥊', category: 'type' },
  // Doelen
  { id: 'goal_5',         title: 'Doelgericht',        desc: '5 doelen voltooid',             icon: '🎯', category: 'doelen' },
  { id: 'goal_20',        title: 'Onverbeterlijk',     desc: '20 doelen voltooid',            icon: '🔥', category: 'doelen' },
  // Belt
  { id: 'blue_belt',      title: 'Blauwe belt',        desc: 'Blauwe belt bereikt',           icon: '🔵', category: 'belt' },
  { id: 'purple_belt',    title: 'Paarse belt',        desc: 'Paarse belt bereikt',           icon: '🟣', category: 'belt' },
  { id: 'brown_belt',     title: 'Bruine belt',        desc: 'Bruine belt bereikt',           icon: '🟤', category: 'belt' },
  { id: 'black_belt',     title: 'Zwarte belt',        desc: 'Zwarte belt bereikt',           icon: '⬛', category: 'belt' },
  // Strepen
  { id: 'stripe_1',       title: 'Eerste streep',      desc: 'Eerste streep verdiend',        icon: '〡',     category: 'strepen' },
  { id: 'stripe_4',       title: 'Vier strepen',       desc: 'Alle 4 strepen verdiend',       icon: '〡〡〡〡', category: 'strepen' },
];

export interface UserStats {
  entries: number;
  hours: number;
  seminars: number;
  competitions: number;
  goals_done: number;
  belt: string;
  stripes: number;
}

export function calcEarnedBadges(stats: UserStats): string[] {
  const earned: string[] = [];

  if (stats.entries >= 1)   earned.push('first_session');
  if (stats.entries >= 10)  earned.push('sessions_10');
  if (stats.entries >= 50)  earned.push('sessions_50');
  if (stats.entries >= 100) earned.push('sessions_100');
  if (stats.entries >= 200) earned.push('sessions_200');

  if (stats.hours >= 10)  earned.push('hours_10');
  if (stats.hours >= 50)  earned.push('hours_50');
  if (stats.hours >= 200) earned.push('hours_200');
  if (stats.hours >= 500) earned.push('hours_500');

  if (stats.seminars >= 1)    earned.push('seminar');
  if (stats.competitions >= 1) earned.push('competition');

  if (stats.goals_done >= 5)  earned.push('goal_5');
  if (stats.goals_done >= 20) earned.push('goal_20');

  if (['blue','purple','brown','black'].includes(stats.belt)) earned.push('blue_belt');
  if (['purple','brown','black'].includes(stats.belt))        earned.push('purple_belt');
  if (['brown','black'].includes(stats.belt))                 earned.push('brown_belt');
  if (stats.belt === 'black')                                 earned.push('black_belt');

  if (stats.stripes >= 1) earned.push('stripe_1');
  if (stats.stripes >= 4) earned.push('stripe_4');

  return earned;
}

// Punten per badge
export function calcPoints(earnedIds: string[]): number {
  const points: Record<string, number> = {
    first_session: 10, sessions_10: 25, sessions_50: 75, sessions_100: 150, sessions_200: 300,
    hours_10: 20, hours_50: 60, hours_200: 175, hours_500: 400,
    seminar: 30, competition: 50,
    goal_5: 40, goal_20: 120,
    blue_belt: 100, purple_belt: 200, brown_belt: 350, black_belt: 500,
    stripe_1: 25, stripe_4: 75,
  };
  return earnedIds.reduce((sum, id) => sum + (points[id] ?? 0), 0);
}
