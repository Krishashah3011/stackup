import { useState, useCallback } from 'react';

/**
 * useLocalStorage — syncs state with localStorage.
 * Useful for persisting UI preferences (sidebar collapsed, theme, etc.)
 *
 * Usage:
 *   const [theme, setTheme] = useLocalStorage('theme', 'dark');
 */
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (err) {
        console.warn(`useLocalStorage: could not set "${key}"`, err);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (err) {
      console.warn(`useLocalStorage: could not remove "${key}"`, err);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
