export function normalizeVi(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatQty(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  if (Math.abs(rounded) < 0.01) return '0';
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

function canonicalUnit(unit: string): string {
  const u = normalizeVi(unit);
  if (['g', 'gr', 'gram', 'gam'].includes(u)) return 'g';
  if (['kg', 'kilogram', 'ky'].includes(u)) return 'kg';
  if (['ml', 'millilit'].includes(u)) return 'ml';
  if (['l', 'lit', 'liter'].includes(u)) return 'lit';
  if (['muong canh', 'mc', 'tbsp', 'thia canh'].includes(u)) return 'muong_canh';
  if (['muong ca phe', 'mcf', 'tsp', 'thia ca phe', 'thia nho'].includes(u)) return 'muong_ca_phe';
  if (['qua', 'trai'].includes(u)) return 'qua';
  if (['tep'].includes(u)) return 'tep';
  if (['cu'].includes(u)) return 'cu';
  if (['nhanh', 'cong'].includes(u)) return 'nhanh';
  if (['la'].includes(u)) return 'la';
  if (['bia', 'mieng'].includes(u)) return 'bia';
  if (['goi', 'tui'].includes(u)) return 'goi';
  if (['bo', 'mo'].includes(u)) return 'bo';
  return u;
}

/**
 * Converts `amount` from `fromUnit` into `toUnit` when units are compatible.
 * Returns null if units cannot be meaningfully converted.
 */
export function convertUnit(amount: number, fromUnit: string, toUnit: string): number | null {
  const from = canonicalUnit(fromUnit);
  const to = canonicalUnit(toUnit);

  if (from === to) return amount;

  // Mass conversions
  if (from === 'g' && to === 'kg') return amount / 1000;
  if (from === 'kg' && to === 'g') return amount * 1000;

  // Volume conversions
  if (from === 'ml' && to === 'lit') return amount / 1000;
  if (from === 'lit' && to === 'ml') return amount * 1000;

  // Spoon approximations to ml or g
  if (from === 'muong_canh') {
    if (to === 'ml' || to === 'g') return amount * 15;
    if (to === 'lit' || to === 'kg') return (amount * 15) / 1000;
    if (to === 'muong_ca_phe') return amount * 3;
  }
  if (from === 'muong_ca_phe') {
    if (to === 'ml' || to === 'g') return amount * 5;
    if (to === 'lit' || to === 'kg') return (amount * 5) / 1000;
    if (to === 'muong_canh') return amount / 3;
  }

  // Reverse spoon conversions
  if (to === 'muong_canh') {
    if (from === 'ml' || from === 'g') return amount / 15;
    if (from === 'lit' || from === 'kg') return (amount * 1000) / 15;
  }
  if (to === 'muong_ca_phe') {
    if (from === 'ml' || from === 'g') return amount / 5;
    if (from === 'lit' || from === 'kg') return (amount * 1000) / 5;
  }

  // Approximate fresh garlic clove <-> g (1 tep ~ 4g)
  if (from === 'tep' && to === 'g') return amount * 4;
  if (from === 'g' && to === 'tep') return amount / 4;

  // Approximate ginger/carrot/tomato bulb <-> g (1 cu ~ 100g, 1 qua ~ 100g)
  if ((from === 'cu' || from === 'qua') && to === 'g') return amount * 100;
  if (from === 'g' && (to === 'cu' || to === 'qua')) return amount / 100;

  // Approximate tofu block <-> g (1 bia ~ 150g)
  if (from === 'bia' && to === 'g') return amount * 150;
  if (from === 'g' && to === 'bia') return amount / 150;

  // Approximate bunch <-> g (1 bo ~ 250g)
  if (from === 'bo' && to === 'g') return amount * 250;
  if (from === 'g' && to === 'bo') return amount / 250;

  return null;
}

export function getQuickStep(unit: string): number {
  const c = canonicalUnit(unit);
  if (c === 'g' || c === 'ml') return 50;
  if (c === 'kg' || c === 'lit') return 0.2;
  return 1;
}

export function formatDateTimeVi(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}
