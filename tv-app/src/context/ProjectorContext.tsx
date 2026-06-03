import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROJECTOR_STORAGE_KEY } from '@/constants/projector';

interface ProjectorContextValue {
  /** Whether Projector Mode is enabled. */
  on: boolean;
  /** False until the persisted preference has loaded (avoids a flash on boot). */
  ready: boolean;
  setOn: (value: boolean) => void;
  toggle: () => void;
}

const ProjectorContext = createContext<ProjectorContextValue>({
  on: false,
  ready: false,
  setOn: () => {},
  toggle: () => {},
});

export function ProjectorProvider({ children }: { children: React.ReactNode }) {
  const [on, setOnState] = useState(false);
  const [ready, setReady] = useState(false);

  // Load the saved preference once on mount.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PROJECTOR_STORAGE_KEY)
      .then((value) => {
        if (active) setOnState(value === '1');
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((value: boolean) => {
    AsyncStorage.setItem(PROJECTOR_STORAGE_KEY, value ? '1' : '0').catch(() => {});
  }, []);

  const setOn = useCallback(
    (value: boolean) => {
      setOnState(value);
      persist(value);
    },
    [persist],
  );

  const toggle = useCallback(() => {
    setOnState((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
  }, [persist]);

  const value = useMemo(
    () => ({ on, ready, setOn, toggle }),
    [on, ready, setOn, toggle],
  );

  return <ProjectorContext.Provider value={value}>{children}</ProjectorContext.Provider>;
}

export function useProjector() {
  return useContext(ProjectorContext);
}
