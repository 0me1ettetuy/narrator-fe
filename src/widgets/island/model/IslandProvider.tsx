import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { IslandContext } from './island-context';

export function IslandProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(true);

  const register = useCallback((id: string) => {
    setIds((current) => (current.includes(id) ? current : [...current, id]));
    return () => setIds((current) => current.filter((item) => item !== id));
  }, []);

  const value = useMemo(
    () => ({ target, setTarget, ids, register, collapsed, setCollapsed }),
    [target, ids, register, collapsed],
  );

  return (
    <IslandContext.Provider value={value}>{children}</IslandContext.Provider>
  );
}
