import { request } from './client';
import { runHuntQuery } from './huntService';

jest.mock('./client', () => ({ request: jest.fn() }));

const mockRequest = request as jest.MockedFunction<typeof request>;

describe('runHuntQuery', () => {
  beforeEach(() => mockRequest.mockReset());

  it('posts the query to /hunt and returns the parsed result', async () => {
    mockRequest.mockResolvedValue({
      query: 'poc_recon_job',
      matches: [
        {
          signal_id: 's1',
          device_id: 'd1',
          type: 'scheduled_job',
          matched_reason: "'poc_recon_job' matched signal type/payload",
          observed_at: '2026-08-13T20:00:00Z',
        },
      ],
    });

    const result = await runHuntQuery('poc_recon_job');

    expect(mockRequest).toHaveBeenCalledWith(
      '/hunt',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ query: 'poc_recon_job' }),
      })
    );
    expect(result.query).toBe('poc_recon_job');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].signal_id).toBe('s1');
  });

  it('propagates an empty match list as a valid no-hit result', async () => {
    mockRequest.mockResolvedValue({ query: 'nothing-matches', matches: [] });

    const result = await runHuntQuery('nothing-matches');

    expect(result.matches).toEqual([]);
  });
});
