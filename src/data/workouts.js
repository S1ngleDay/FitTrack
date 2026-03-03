// src/data/workouts.js
export const workoutsData = [
  {
    id: '1',
    date: '30.09',
    type: 'Пробежка',
    typeColor: '#4da6ff', // Голубой
    metrics: [
      { value: '4', unit: 'км' },
      { value: '30', unit: 'мин', highlight: true }, // Зеленый текст
      { value: '300', unit: 'ккал', highlight: true } // Оранжевый текст
    ]
  },
  {
    id: '2',
    date: '30.09',
    type: 'Кардио',
    typeColor: '#E0B0FF', // Фиолетовый
    metrics: [
      { value: '400', unit: 'шаг' },
      { value: '30', unit: 'мин', highlight: true },
      { value: '300', unit: 'ккал', highlight: true }
    ]
  },
  {
    id: '3',
    date: '30.09',
    type: 'Силовая',
    typeColor: '#ff9999', // Розовый
    metrics: [
      { value: '5', unit: 'упр' },
      { value: '30', unit: 'мин', highlight: true },
      { value: '300', unit: 'ккал', highlight: true }
    ]
  },
  // Добавьте еще копий, чтобы список скроллился
  { id: '4', date: '30.09', type: 'Пробежка', typeColor: '#4da6ff', metrics: [{ value: '4', unit: 'км' }, { value: '30', unit: 'мин', highlight: true }, { value: '300', unit: 'ккал', highlight: true }] },
  { id: '5', date: '30.09', type: 'Пробежка', typeColor: '#4da6ff', metrics: [{ value: '4', unit: 'км' }, { value: '30', unit: 'мин', highlight: true }, { value: '300', unit: 'ккал', highlight: true }] },
];
