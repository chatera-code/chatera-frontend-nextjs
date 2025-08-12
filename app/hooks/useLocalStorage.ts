// app/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

/**
 * A custom hook to synchronize state with localStorage.
 * It ensures that the state persists across page reloads.
 * @param key The key to use in localStorage.
 * @param initialValue The initial value of the state if not found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T>(() => {
        // This part only runs on the client-side
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            // Get from local storage by key
            const item = window.localStorage.getItem(key);
            // Parse stored json or if none return initialValue
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            // If error also return initialValue
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    // useEffect to update local storage when the state changes
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(storedValue));
            }
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}

export default useLocalStorage;
