import React, { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function ClientOnly({ children, ...delegated }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <div {...delegated}>{children}</div>;
}