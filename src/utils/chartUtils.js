const generateFullDayData = (realData) => {
  // 1. Создаем карту значений: { 0: 0, 1: 0, ..., 23: 0 }
  const hoursMap = new Array(24).fill(0);

  // 2. Заполняем карту данными из realData
  if (Array.isArray(realData)) {
    realData.forEach(item => {
      // Пытаемся понять, какой это час
      let hour = -1;

      // Если label это строка "7:00" -> 7
      if (typeof item.label === 'string') {
        hour = parseInt(item.label, 10);
      } 
      // Если label это число 7 -> 7
      else if (typeof item.label === 'number') {
        hour = item.label;
      }

      // Если час валиден (0..23), записываем значение
      if (hour >= 0 && hour <= 23) {
        hoursMap[hour] = item.value;
      }
    });
  }

  // 3. Формируем итоговый массив
  const detailedData = [];
  
  for (let i = 0; i < 24; i++) {
     let label = '';
     if (i === 0) label = '0:00';
     else if (i === 6) label = '6:00';
     else if (i === 12) label = '12:00';
     else if (i === 18) label = '18:00';

     detailedData.push({
       value: hoursMap[i], 
       label: label,
       labelTextStyle: { color: '#8E8E93', fontSize: 10, width: 40, textAlign: 'center' } 
     });
  }
  
  return detailedData;
};

export default generateFullDayData;
