import { request } from './client';
import { getIrReport } from './irReportService';

jest.mock('./client', () => ({ request: jest.fn() }));

const mockRequest = request as jest.MockedFunction<typeof request>;

const API_RESPONSE = {
  incident_id: 'alert-1',
  generated_at: '2026-08-13T20:00:00Z',
  summary: 'Suspicious scheduled job correlated to T1603.',
  sections: [
    { id: 'preparation', title: 'Preparation', body: 'Lab environment isolated.' },
    { id: 'detection', title: 'Detection & Analysis', body: 'Signal triaged suspicious.' },
    { id: 'containment', title: 'Containment, Eradication & Recovery', body: 'force-stop applied.' },
    { id: 'post_event', title: 'Post-Event Activity', body: 'Evidence retained.' },
  ],
};

describe('getIrReport', () => {
  beforeEach(() => mockRequest.mockReset());

  it('posts to /reports/ir and maps the snake_case response to the screen shape', async () => {
    mockRequest.mockResolvedValue(API_RESPONSE);

    const report = await getIrReport();

    expect(mockRequest).toHaveBeenCalledWith(
      '/reports/ir',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ alert_id: null }) })
    );
    expect(report.incidentId).toBe('alert-1');
    expect(report.generatedAt).toBe('2026-08-13T20:00:00Z');
    expect(report.sections.map((s) => s.id)).toEqual([
      'preparation',
      'detection',
      'containment',
      'post_event',
    ]);
  });

  it('passes an explicit alert_id through when given one', async () => {
    mockRequest.mockResolvedValue(API_RESPONSE);

    await getIrReport('alert-42');

    expect(mockRequest).toHaveBeenCalledWith(
      '/reports/ir',
      expect.objectContaining({ body: JSON.stringify({ alert_id: 'alert-42' }) })
    );
  });
});
