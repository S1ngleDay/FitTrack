import { useState, useEffect } from 'react';
import { requestStepPermissions, getStepsForToday, watchStepCount } from '../utils/stepCounter';

export function usePedometer() {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    let sub = null;

    (async () => {
      if (!(await requestStepPermissions())) return;
      setSteps(await getStepsForToday());
      sub = watchStepCount(setSteps);      // общая подписка
    })();

    return () => {
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  return steps;
}