const { buildAvatarPrompt, CLASS_BUILD, STAGE_BUILD } = require('../../src/services/avatarImageService');

describe('avatarImageService', () => {
  test('builds prompt with correct gender and class', () => {
    const prompt = buildAvatarPrompt({ gender: 'MALE', avatarClass: 'FIGHTER', bodyStage: 2 });
    expect(prompt).toContain('male');
    expect(prompt).toContain(STAGE_BUILD[2]);
    expect(prompt).toContain('Pixar');
  });

  test('uses female label for FEMALE gender', () => {
    const prompt = buildAvatarPrompt({ gender: 'FEMALE', avatarClass: 'CHAMPION', bodyStage: 3 });
    expect(prompt).toContain('female');
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
