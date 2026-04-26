import {
  buildAzureLabStoryboard,
  type AzureLabStoryboard,
  type StoryboardSlide,
  type StoryboardSlideType,
} from '@/lib/qa/azure-lab-storyboard';

const VALID_SLIDE_TYPES: ReadonlySet<StoryboardSlideType> = new Set<StoryboardSlideType>([
  'narrative',
  'architecture',
  'demo_step',
  'trust_story',
  'caveat',
  'plan',
]);

describe('LIVE4 azure lab storyboard — shape', () => {
  let storyboard: AzureLabStoryboard;

  beforeAll(() => {
    storyboard = buildAzureLabStoryboard();
  });

  it('buildAzureLabStoryboard() returns a valid storyboard', () => {
    expect(storyboard).toBeDefined();
    expect(typeof storyboard).toBe('object');
  });

  it('schemaVersion is 1', () => {
    expect(storyboard.schemaVersion).toBe(1);
  });

  it("generatedAt is '2026-04-26'", () => {
    expect(storyboard.generatedAt).toBe('2026-04-26');
  });

  it('has at least 8 slides', () => {
    expect(storyboard.slides.length).toBeGreaterThanOrEqual(8);
  });

  it('totalSlides equals slides.length', () => {
    expect(storyboard.totalSlides).toBe(storyboard.slides.length);
  });

  it('totalDurationMinutes equals sum of slide durationMinutes', () => {
    const sum = storyboard.slides.reduce(
      (acc: number, s: StoryboardSlide) => acc + s.durationMinutes,
      0,
    );
    expect(storyboard.totalDurationMinutes).toBe(sum);
  });

  it('every slide has non-empty id', () => {
    for (const slide of storyboard.slides) {
      expect(slide.id.trim().length).toBeGreaterThan(0);
    }
  });

  it('every slide has non-empty title', () => {
    for (const slide of storyboard.slides) {
      expect(slide.title.trim().length).toBeGreaterThan(0);
    }
  });

  it('every slide has non-empty keyMessage', () => {
    for (const slide of storyboard.slides) {
      expect(slide.keyMessage.trim().length).toBeGreaterThan(0);
    }
  });

  it('every slide has non-empty speakerNotes', () => {
    for (const slide of storyboard.slides) {
      expect(slide.speakerNotes.trim().length).toBeGreaterThan(0);
    }
  });

  it('every slide has non-empty whatToShow', () => {
    for (const slide of storyboard.slides) {
      expect(slide.whatToShow.trim().length).toBeGreaterThan(0);
    }
  });

  it('every slide has non-empty whatNotToClaim', () => {
    for (const slide of storyboard.slides) {
      expect(slide.whatNotToClaim.trim().length).toBeGreaterThan(0);
    }
  });

  it('every slide has non-empty clientQuestion', () => {
    for (const slide of storyboard.slides) {
      expect(slide.clientQuestion.trim().length).toBeGreaterThan(0);
    }
  });

  it('every slideType is a valid StoryboardSlideType value', () => {
    for (const slide of storyboard.slides) {
      expect(VALID_SLIDE_TYPES.has(slide.slideType)).toBe(true);
    }
  });

  it('all slide IDs are unique', () => {
    const ids = storyboard.slides.map((s: StoryboardSlide) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('whatLabProves has at least 3 entries', () => {
    expect(storyboard.whatLabProves.length).toBeGreaterThanOrEqual(3);
  });

  it('whatLabDoesNotProve has at least 3 entries', () => {
    expect(storyboard.whatLabDoesNotProve.length).toBeGreaterThanOrEqual(3);
  });

  it('whatRemainsClientSpecific has at least 3 entries', () => {
    expect(storyboard.whatRemainsClientSpecific.length).toBeGreaterThanOrEqual(3);
  });

  it('fortune500TrustRationale is a non-empty string longer than 50 chars', () => {
    expect(typeof storyboard.fortune500TrustRationale).toBe('string');
    expect(storyboard.fortune500TrustRationale.length).toBeGreaterThan(50);
  });

  it('may4LabPlan is a non-empty string', () => {
    expect(typeof storyboard.may4LabPlan).toBe('string');
    expect(storyboard.may4LabPlan.trim().length).toBeGreaterThan(0);
  });

  it('every slide durationMinutes is > 0', () => {
    for (const slide of storyboard.slides) {
      expect(slide.durationMinutes).toBeGreaterThan(0);
    }
  });

  it("narrative slide exists (slideType 'narrative')", () => {
    const narrativeSlides = storyboard.slides.filter(
      (s: StoryboardSlide) => s.slideType === 'narrative',
    );
    expect(narrativeSlides.length).toBeGreaterThanOrEqual(1);
  });

  it('architecture slide exists', () => {
    const architectureSlides = storyboard.slides.filter(
      (s: StoryboardSlide) => s.slideType === 'architecture',
    );
    expect(architectureSlides.length).toBeGreaterThanOrEqual(1);
  });

  it('caveat slide exists', () => {
    const caveatSlides = storyboard.slides.filter(
      (s: StoryboardSlide) => s.slideType === 'caveat',
    );
    expect(caveatSlides.length).toBeGreaterThanOrEqual(1);
  });
});
