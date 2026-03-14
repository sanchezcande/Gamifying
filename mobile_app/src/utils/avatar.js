export function getInitials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function classColor(avatarClass) {
  if (avatarClass === 'WARRIOR') return '#330000';
  if (avatarClass === 'CHAMPION') return '#1a1a33';
  if (avatarClass === 'FIGHTER') return '#1a3300';
  return '#333333';
}

export function nextClassThreshold(avatarClass) {
  if (avatarClass === 'ROOKIE') return 501;
  if (avatarClass === 'FIGHTER') return 1501;
  if (avatarClass === 'CHAMPION') return 3001;
  return null; // WARRIOR = max class, no next threshold
}

export function timeLeftLabel(expiresAt) {
  if (!expiresAt) return 'active';
  const now = Date.now();
  const diff = Math.max(0, new Date(expiresAt).getTime() - now);
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days}d left`;
}

export function skinToneColor(id) {
  const palette = {
    1: '#f6e7dd',
    2: '#ebc9a2',
    3: '#d8a87f',
    4: '#b9835a',
    5: '#8e5f3f',
    6: '#5e3d2b'
  };
  return palette[id] || '#d8a87f';
}
