// Canonical keys shared with Instinct's note format. Change them in one place only.

export const TAGS = {
  gluten: 'Gluten',
  dairy: 'Dairy',
  onion_garlic: 'Onion / garlic',
  beans: 'Beans / lentils',
  fructose: 'High-fructose fruit',
  sweetener: 'Sweeteners / sugar alcohols',
  grains: 'Rice / grains',
  coffee: 'Coffee',
  fatty: 'Fried / fatty',
  raw: 'Big raw salad',
  late: 'Within 2h of bed',
  out: 'Ate out',
} as const;

export const BRISTOL = {
  1: 'Hard lumps',
  2: 'Lumpy log',
  3: 'Cracked log',
  4: 'Smooth',
  5: 'Soft blobs',
  6: 'Mushy',
  7: 'Watery',
} as const;

export const RITUALS = {
  breath: 'Breathwork',
  purpose: 'Purpose / prayer',
  aroma: 'Aromatherapy',
} as const;

export const ACTIONS = {
  sun: '10–20 min outside',
  walk: 'Walk after dinner',
  meditate: 'Meditation',
  train: 'Training',
  sauna: 'Sauna',
  cold: 'Cold plunge',
  read: 'Read 20 min',
  connect: 'Real connection',
  screens: 'Screens off 1h pre-bed',
  epsom: 'Epsom bath',
} as const;

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Off-plan'] as const;

export const AUDIT_DAYS = 60;
