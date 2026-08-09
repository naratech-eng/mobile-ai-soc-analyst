import { formatAttackId } from './format';

describe('formatAttackId', () => {
  it('returns the id when present', () => {
    expect(formatAttackId('T1422')).toBe('T1422');
  });

  it('returns a fallback label when null', () => {
    expect(formatAttackId(null)).toBe('no technique matched');
  });
});
