import { computeDecisionScore } from '@/hooks/useDecisionSupport';

describe('computeDecisionScore', () => {
  it('returns 50 when all factors are neutral', () => {
    const score = computeDecisionScore({ indicator: 50, sentiment: 50, macro: 50, orderBook: 50 });
    expect(score).toBe(50);
  });

  it('weights indicator score highest', () => {
    const score = computeDecisionScore({ indicator: 100, sentiment: 0, macro: 0, orderBook: 0 });
    // 100 * 0.4 = 40
    expect(score).toBe(40);
  });

  it('combines all values with weights', () => {
    const score = computeDecisionScore({ indicator: 80, sentiment: 60, macro: 40, orderBook: 20 });
    const expected = Math.round(80*0.4 + 60*0.2 + 40*0.2 + 20*0.2);
    expect(score).toBe(expected);
  });
});
