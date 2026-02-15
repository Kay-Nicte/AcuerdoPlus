import { CalendarEvent, PatternRule } from '../types';

/**
 * Expands a pattern event into individual calendar event instances
 * within a given date range.
 */
export function expandPattern(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  if (!event.isPattern || !event.patternRule) return [];

  let rule: PatternRule;
  try {
    rule = JSON.parse(event.patternRule);
  } catch {
    return [];
  }

  const instances: CalendarEvent[] = [];
  const patternStart = new Date(event.startDate);
  patternStart.setHours(0, 0, 0, 0);

  const patternEnd = rule.endDate ? new Date(rule.endDate) : null;
  const cycleDays = getCycleDays(rule);
  const durationMs = rule.durationDays * 24 * 60 * 60 * 1000;

  // Walk through cycles starting from the pattern's start date
  let cycleIndex = 0;
  let currentStart = new Date(patternStart);

  // Fast-forward to near the range start
  if (currentStart < rangeStart) {
    const diffMs = rangeStart.getTime() - currentStart.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const cyclesToSkip = Math.floor(diffDays / cycleDays);
    cycleIndex = cyclesToSkip;
    currentStart = addDays(patternStart, cyclesToSkip * cycleDays);
  }

  // Generate instances within range (cap at 200 to prevent runaway)
  const maxIterations = 200;
  let iterations = 0;

  while (currentStart <= rangeEnd && iterations < maxIterations) {
    iterations++;

    // Check pattern end boundary
    if (patternEnd && currentStart > patternEnd) break;

    const instanceEnd = new Date(currentStart.getTime() + durationMs - 24 * 60 * 60 * 1000);

    // Only include if the instance overlaps with the visible range
    if (instanceEnd >= rangeStart && currentStart <= rangeEnd) {
      const dateISO = formatISO(currentStart);
      const assignedTo = rule.alternating
        ? rule.assignments[cycleIndex % 2]
        : rule.assignments[0];

      instances.push({
        ...event,
        id: `${event.id}_${dateISO}`,
        startDate: new Date(currentStart),
        endDate: new Date(instanceEnd),
        assignedTo,
        isPattern: false, // instances are not patterns themselves
        requiresApproval: false,
        approvalStatus: undefined,
      });
    }

    // Advance to next cycle
    currentStart = addDays(currentStart, cycleDays);
    cycleIndex++;
  }

  return instances;
}

function getCycleDays(rule: PatternRule): number {
  switch (rule.frequency) {
    case 'weekly': return 7;
    case 'biweekly': return 14;
    case 'monthly': return 30;
    default: return 7;
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parsePatternRule(json?: string): PatternRule | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function frequencyLabel(freq: PatternRule['frequency']): string {
  switch (freq) {
    case 'weekly': return 'Semanal';
    case 'biweekly': return 'Quincenal';
    case 'monthly': return 'Mensual';
    default: return freq;
  }
}
