import { useState, useEffect } from 'react';
import { getHourlyStepsForToday } from '../utils/stepCounter';
import { usePedometer } from './usePedometer';

export function useHourlySteps() {
  const [hours, setHours] = useState(new Array(24).fill(0));
  const steps = usePedometer(); // триггер на каждый обновлённый шаг

  useEffect(() => {
    (async () => {
      setHours(await getHourlyStepsForToday());
    })();
  }, [steps]);

  return hours;
}