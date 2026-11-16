import { useThree } from '@react-three/fiber';

// Things are placed from the canvas's top left corner, not its centre. A canvas
// resizes a moment after its container grows (Load more), and centre-based
// positions would shift everything by half the change until it catches up.
export function TopLeftAnchor({ children }: { children: React.ReactNode }) {
  const { width, height } = useThree((state) => state.size);

  return <group position={[-width / 2, height / 2, 0]}>{children}</group>;
}
