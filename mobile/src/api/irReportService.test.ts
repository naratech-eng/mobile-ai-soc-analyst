import { getIrReport } from './irReportService';

const EXPECTED_SECTION_IDS = ['preparation', 'detection', 'containment', 'post_event'];

describe('getIrReport', () => {
  it('resolves with all four FR-004 lifecycle sections, each with real content', async () => {
    const report = await getIrReport();
    expect(report.sections.map((s) => s.id)).toEqual(EXPECTED_SECTION_IDS);
    for (const section of report.sections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(20);
    }
  });
});
