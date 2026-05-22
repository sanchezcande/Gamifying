const { buildAvatarPrompt, CLASS_BUILD, STAGE_BUILD_MALE, STAGE_BUILD_FEMALE } = require('../../src/services/avatarImageService');

describe('avatarImageService', () => {
  test('builds prompt with correct gender and class', () => {
    const prompt = buildAvatarPrompt({ gender: 'MALE', avatarClass: 'FIGHTER', bodyStage: 2 });
    expect(prompt).toContain('male');
    expect(prompt).toContain(STAGE_BUILD_MALE[2]);
    expect(prompt).toContain('Pixar');
  });

  test('uses female label and feminine build for FEMALE gender', () => {
    const prompt = buildAvatarPrompt({ gender: 'FEMALE', avatarClass: 'CHAMPION', bodyStage: 3 });
    expect(prompt).toContain('female');
    expect(prompt).toContain(STAGE_BUILD_FEMALE[3]);
  });

  test('falls back to class build when body stage is invalid', () => {
    const prompt = buildAvatarPrompt({ gender: 'MALE', avatarClass: 'WARRIOR', bodyStage: 99 });
    expect(prompt).toContain(CLASS_BUILD.WARRIOR);
  });

  test('defaults to ROOKIE class build', () => {
    const prompt = buildAvatarPrompt({});
    expect(prompt).toContain('male');
    expect(prompt).toContain(CLASS_BUILD.ROOKIE);
  });
});
