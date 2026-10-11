import type { ReactNode } from 'react';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
export function MarketingShell({ children }: { children: ReactNode }) { return <><Nav/>{children}<Footer/></>; }
