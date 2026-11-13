import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { IslandContext } from './island-context';
import { insertEntry, moveEntry, type OrderEntry } from './island-order';

export function IslandProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [items, setItems] = useState<OrderEntry[]>([]);
  const [collapsed, setCollapsed] = useState(true);

  const register = useCallback((entry: OrderEntry) => {
    setItems((current) => insertEntry(current, entry));
    return () =>
      setItems((current) => current.filter((item) => item.id !== entry.id));
  }, []);

  const move = useCallback((id: string, toIndex: number) => {
    setItems((current) => moveEntry(current, id, toIndex));
  }, []);

  const value = useMemo(
    () => ({
      target,
      setTarget,
      items,
      topId: items[0]?.id ?? null,
      register,
      move,
      collapsed,
      setCollapsed,
    }),
    [target, items, register, move, collapsed],
  );

  return (
    <IslandContext.Provider value={value}>{children}</IslandContext.Provider>
  );
}
