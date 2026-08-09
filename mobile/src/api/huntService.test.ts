import { runHuntQuery } from './huntService';

describe('runHuntQuery', () => {
  it('resolves with a query and at least one shaped match', async () => {
    const result = await runHuntQuery();
    expect(typeof result.query).toBe('string');
    expect(result.query.length).toBeGreaterThan(0);
    expect(result.matches.length).toBeGreaterThan(0);
    for (const match of result.matches) {
      expect(typeof match.signal_id).toBe('string');
      expect(typeof match.device_id).toBe('string');
      expect(typeof match.type).toBe('string');
      expect(typeof match.matched_reason).toBe('string');
      expect(Number.isNaN(new Date(match.observed_at).getTime())).toBe(false);
    }
  });
});
