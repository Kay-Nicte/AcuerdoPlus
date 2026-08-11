import { expandPattern, parsePatternRule, frequencyLabel } from '../patternExpander';
import { CalendarEvent, PatternRule } from '../../types';

const baseEvent: CalendarEvent = {
  id: 'evt1',
  agreementId: 'agr1',
  minorId: 'minor1',
  title: 'Custodia',
  startDate: new Date('2026-01-05'), // Monday
  endDate: new Date('2026-01-05'),
  assignedTo: '',
  isPattern: true,
  requiresApproval: false,
  createdBy: 'uidA',
  createdAt: new Date('2026-01-01'),
};

function withRule(rule: PatternRule): CalendarEvent {
  return { ...baseEvent, patternRule: JSON.stringify(rule) };
}

describe('expandPattern', () => {
  it('returns empty array when the event is not a pattern', () => {
    const event = { ...baseEvent, isPattern: false, patternRule: JSON.stringify({}) };
    expect(expandPattern(event, new Date('2026-01-01'), new Date('2026-01-31'))).toEqual([]);
  });

  it('returns empty array when patternRule is missing', () => {
    const event = { ...baseEvent, patternRule: undefined };
    expect(expandPattern(event, new Date('2026-01-01'), new Date('2026-01-31'))).toEqual([]);
  });

  it('returns empty array when patternRule is invalid JSON', () => {
    const event = { ...baseEvent, patternRule: '{not valid json' };
    expect(expandPattern(event, new Date('2026-01-01'), new Date('2026-01-31'))).toEqual([]);
  });

  describe('weekdays mode', () => {
    it('generates one instance per assigned weekday within the range', () => {
      // Only Mon (1) -> uidA, Wed (3) -> uidB
      const rule: PatternRule = {
        mode: 'weekdays',
        frequency: 'weekly',
        alternating: false,
        assignments: ['uidA', 'uidB'],
        durationDays: 1,
        weekdayAssignments: { 1: 'uidA', 3: 'uidB' },
      };
      const event = withRule(rule);
      // One week range: Mon 2026-01-05 to Sun 2026-01-11
      const results = expandPattern(event, new Date('2026-01-05'), new Date('2026-01-11'));

      expect(results).toHaveLength(2);
      expect(results.every((r) => !r.isPattern)).toBe(true);
      expect(results.find((r) => r.assignedTo === 'uidA')?.startDate.getDay()).toBe(1);
      expect(results.find((r) => r.assignedTo === 'uidB')?.startDate.getDay()).toBe(3);
    });

    it('does not generate instances past the pattern end date', () => {
      const rule: PatternRule = {
        mode: 'weekdays',
        frequency: 'weekly',
        alternating: false,
        assignments: ['uidA', 'uidB'],
        durationDays: 1,
        weekdayAssignments: { 1: 'uidA' }, // every Monday
        endDate: '2026-01-05', // only the first Monday
      };
      const event = withRule(rule);
      const results = expandPattern(event, new Date('2026-01-01'), new Date('2026-01-31'));

      expect(results).toHaveLength(1);
      expect(results[0].startDate.toDateString()).toBe(new Date('2026-01-05').toDateString());
    });
  });

  describe('alternating mode', () => {
    it('alternates between the two parents every cycle', () => {
      const rule: PatternRule = {
        mode: 'alternating',
        frequency: 'weekly',
        alternating: true,
        assignments: ['uidA', 'uidB'],
        durationDays: 7,
      };
      const event = withRule(rule);
      // 3 cycles: starting 2026-01-05
      const results = expandPattern(event, new Date('2026-01-05'), new Date('2026-01-26'));

      expect(results.length).toBeGreaterThanOrEqual(3);
      expect(results[0].assignedTo).toBe('uidA');
      expect(results[1].assignedTo).toBe('uidB');
      expect(results[2].assignedTo).toBe('uidA');
    });

    it('always assigns the same parent when alternating is false', () => {
      const rule: PatternRule = {
        mode: 'alternating',
        frequency: 'weekly',
        alternating: false,
        assignments: ['uidA', 'uidB'],
        durationDays: 7,
      };
      const event = withRule(rule);
      const results = expandPattern(event, new Date('2026-01-05'), new Date('2026-01-26'));

      expect(results.every((r) => r.assignedTo === 'uidA')).toBe(true);
    });

    it('skips ahead to the requested range instead of expanding from the beginning', () => {
      const rule: PatternRule = {
        mode: 'alternating',
        frequency: 'weekly',
        alternating: true,
        assignments: ['uidA', 'uidB'],
        durationDays: 7,
      };
      const event = withRule(rule);
      // Range starts 10 cycles (70 days) after the pattern start
      const rangeStart = new Date('2026-03-16');
      const rangeEnd = new Date('2026-03-23');
      const results = expandPattern(event, rangeStart, rangeEnd);

      expect(results.length).toBeGreaterThan(0);
      results.forEach((r) => {
        expect(r.startDate.getTime()).toBeGreaterThanOrEqual(
          new Date('2026-03-09').getTime()
        );
      });
    });
  });
});

describe('parsePatternRule', () => {
  it('returns null for undefined input', () => {
    expect(parsePatternRule(undefined)).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parsePatternRule('{broken')).toBeNull();
  });

  it('parses a valid rule', () => {
    const rule: PatternRule = {
      mode: 'alternating',
      frequency: 'biweekly',
      alternating: true,
      assignments: ['a', 'b'],
      durationDays: 14,
    };
    expect(parsePatternRule(JSON.stringify(rule))).toEqual(rule);
  });
});

describe('frequencyLabel', () => {
  it('translates known frequencies to Spanish labels', () => {
    expect(frequencyLabel('weekly')).toBe('Semanal');
    expect(frequencyLabel('biweekly')).toBe('Quincenal');
    expect(frequencyLabel('monthly')).toBe('Mensual');
  });
});
