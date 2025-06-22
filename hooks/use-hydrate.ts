/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";

export function useHydrate<T>(
  useFn: (value: unknown) => unknown,
  [defaultState, defaultValue]: unknown[] = [],
  rawDepsFn: (value: any) => any[],
): T {
  const [value, setValue] = useState(defaultState || null);
  const fn = useFn(defaultValue);
  const deps =
    rawDepsFn({
      value: {
        get: value,
        set: setValue,
        default: { state: defaultState, value: defaultValue },
      },
      fn,
    }) || [];

  useEffect(() => {
    setValue(fn || null);
  }, deps);

  return (value || defaultState) as T;
}
