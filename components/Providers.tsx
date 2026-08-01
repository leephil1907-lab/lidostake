'use client';

import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, sepolia } from '@reown/appkit/networks';
import { ReactNode, useEffect } from 'react';
import { CONFIG } from '@/lib/contracts';

const projectId = CONFIG.REOWN_PROJECT_ID;

const ethersAdapter = new EthersAdapter({
  ethersConfig: {
    rpcUrl: CONFIG.ALCHEMY_RPC,
  },
});

// Initialize AppKit once
createAppKit({
  adapters: [ethersAdapter],
  networks: [mainnet, sepolia],
  defaultNetwork: mainnet,
  projectId,
  metadata: {
    name: 'Lido Stake Pro',
    description: 'Advanced Liquid Staking Platform',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    icons: ['https://lido.fi/favicon.ico'],
  },
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
});

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Set dark mode by default
    document.documentElement.classList.add('dark');
    localStorage.setItem('lido-theme', 'dark');
  }, []);

  return <>{children}</>;
}
