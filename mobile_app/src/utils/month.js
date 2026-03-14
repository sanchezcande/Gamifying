export function currentMonthLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
}
