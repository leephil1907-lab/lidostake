'use client';

export interface PriceData {
  eth: number;
  steth: number;
  wsteth: number;
  ldo: number;
  ethChange24h: number;
}

export async function fetchLivePrices(): Promise<PriceData | null> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,staked-ether,wrapped-steth,lido-dao&vs_currencies=usd&include_24hr_change=true',
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    return {
      eth: data.ethereum.usd,
      steth: data['staked-ether'].usd,
      wsteth: data['wrapped-steth'].usd,
      ldo: data['lido-dao'].usd,
      ethChange24h: data.ethereum.usd_24h_change,
    };
  } catch (e) {
    console.error('Price fetch failed:', e);
    return null;
  }
}

export function formatPrice(n: number): string {
  return n >= 1
    ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${n.toFixed(6)}`;
}
