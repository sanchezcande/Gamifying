const { buildAvatarImageUrl } = require('../../src/services/avatarImageService');

describe('avatarImageService', () => {
  test('builds pollinations URL with stable seed for same variant', () => {
    const url1 = buildAvatarImageUrl({
      name: 'Luca',
      avatarClass: 'FIGHTER',
      gender: 'MALE',
      faceOptions: { faceHairStyleId: 2, faceSkinToneId: 3 },
      imageVariant: 5
    });
    const url2 = buildAvatarImageUrl({
      name: 'Luca',
      avatarClass: 'FIGHTER',
      gender: 'MALE',
      faceOptions: { faceHairStyleId: 2, faceSkinToneId: 3 },
      imageVariant: 5
    });

    expect(url1).toEqual(url2);
    expect(url1).toContain('image.pollinations.ai');
    expect(url1).toContain('seed=');
  });

  test('changes image seed when variant changes', () => {
    const base = buildAvatarImageUrl({ name: 'Luca', avatarClass: 'FIGHTER', imageVariant: 1 });
    const changed = buildAvatarImageUrl({ name: 'Luca', avatarClass: 'FIGHTER', imageVariant: 2 });
    expect(base).not.toEqual(changed);
  });
});
