export type OrderEntry = { id: string; priority: number; draggable: boolean };

// Pinned (non-draggable) entries are always first, then draggable ones.
function pinnedCount(order: OrderEntry[]) {
  return order.filter((entry) => !entry.draggable).length;
}

export function insertEntry(
  order: OrderEntry[],
  entry: OrderEntry,
): OrderEntry[] {
  const rest = order.filter((item) => item.id !== entry.id);
  const pinned = rest.filter((item) => !item.draggable);
  const free = rest.filter((item) => item.draggable);

  if (!entry.draggable) {
    // Ties: newest on top, so insert before the first one that is not higher.
    const index = pinned.findIndex((item) => item.priority <= entry.priority);
    pinned.splice(index === -1 ? pinned.length : index, 0, entry);
  } else {
    const index = free.findIndex((item) => item.priority < entry.priority);
    free.splice(index === -1 ? free.length : index, 0, entry);
  }

  return [...pinned, ...free];
}

export function moveEntry(
  order: OrderEntry[],
  id: string,
  toIndex: number,
): OrderEntry[] {
  const from = order.findIndex((entry) => entry.id === id);

  if (from === -1 || !order[from].draggable) {
    return order;
  }

  const target = Math.min(
    Math.max(toIndex, pinnedCount(order)),
    order.length - 1,
  );
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);

  return next;
}
