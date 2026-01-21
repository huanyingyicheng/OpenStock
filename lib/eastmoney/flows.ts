export type Scope = 'stock' | 'sector' | 'fund';
export type Market = 'all' | 'sha' | 'sza' | 'kcb' | 'cyb' | 'zxb' | 'us' | 'hk';
export type SectorType = 'industry' | 'concept' | 'region';
export type Window = '1' | '3' | '5' | '10';
export type Metric = 'netInflow' | 'mainInflow' | 'mainOutflow' | 'turnover' | 'superLargeNet' | 'largeNet';
export type Order = 'desc' | 'asc';

export type EastmoneyClistDiff = Record<string, unknown> & {
  f12?: string; // code
  f14?: string; // name
  f2?: number; // last/price
  f3?: number; // change %
  f6?: number; // turnover
  f13?: number; // market id (stocks/funds)
};

export type EastmoneyClistResponse = {
  data?: {
    total?: number;
    diff?: EastmoneyClistDiff[];
  };
  error?: unknown;
};

export const EASTMONEY_CLIST_URL = 'https://push2.eastmoney.com/api/qt/clist/get';
export const EASTMONEY_UT = '8dec03ba335b81bf4ebdf7b29ec27d15';

export const FS_STOCK: Record<Market, string> = {
  all: 'm:0+t:6+f:!2,m:0+t:13+f:!2,m:0+t:80+f:!2,m:1+t:2+f:!2,m:1+t:23+f:!2,m:0+t:7+f:!2,m:1+t:3+f:!2',
  sha: 'm:1+t:2+f:!2',
  sza: 'm:0+t:6+f:!2,m:0+t:13+f:!2',
  kcb: 'm:1+t:23+f:!2',
  cyb: 'm:0+t:80+f:!2',
  zxb: 'm:0+t:13+f:!2',
  // US: multiple exchanges/boards
  us: 'm:105,m:106,m:107',
  // HK: common equities list
  hk: 'm:116+t:3',
};

export const FS_SECTOR: Record<SectorType, string> = {
  industry: 'm:90+t:2',
  concept: 'm:90+t:3',
  region: 'm:90+t:1',
};

// ETF funds: Shanghai (t:9), Shenzhen (t:10)
export const FS_FUND: Record<'all' | 'sha' | 'sza', string> = {
  all: 'm:1+t:9,m:0+t:10',
  sha: 'm:1+t:9',
  sza: 'm:0+t:10',
};

export const FLOW_FIDS_BY_WINDOW: Record<
  Window,
  { mainNet: string; superLargeNet: string; largeNet: string }
> = {
  '1': { mainNet: 'f62', superLargeNet: 'f66', largeNet: 'f72' },
  '3': { mainNet: 'f127', superLargeNet: 'f267', largeNet: 'f269' },
  '5': { mainNet: 'f109', superLargeNet: 'f164', largeNet: 'f166' },
  '10': { mainNet: 'f160', superLargeNet: 'f174', largeNet: 'f176' },
};

export function toInt(value: string | null, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

export function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  if (!value) return fallback;
  const v = value as T;
  return (allowed as readonly string[]).includes(v) ? v : fallback;
}

export function buildFields(window: Window): string {
  const { mainNet, superLargeNet, largeNet } = FLOW_FIDS_BY_WINDOW[window];
  return ['f12', 'f14', 'f2', 'f3', 'f6', 'f13', mainNet, superLargeNet, largeNet].join(',');
}

export function getNumberField(row: Record<string, unknown>, fid: string): number | null {
  const v = row[fid];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function tvSymbolFromMarketId(marketId: number | undefined, code: string | undefined): string | null {
  if (!code) return null;
  if (marketId === 1) return `SSE:${code}`;
  if (marketId === 0) return `SZSE:${code}`;
  if (marketId === 105 || marketId === 106 || marketId === 107) {
    const ticker = code.trim().toUpperCase();
    if (!/^[A-Z0-9.\-]{1,12}$/.test(ticker)) return null;
    return `US:${ticker}`;
  }
  if (marketId === 116) {
    const hk = code.trim();
    if (!/^\d{4,5}$/.test(hk)) return null;
    return `HK:${hk}`;
  }
  if (!/^\d{6}$/.test(code)) return null;
  return null;
}

export function resolveSort(metric: Metric, window: Window, order: Order): { fid: string; po: 0 | 1 } {
  const { mainNet, superLargeNet, largeNet } = FLOW_FIDS_BY_WINDOW[window];

  // `po`: 1 = desc, 0 = asc
  if (metric === 'turnover') return { fid: 'f6', po: order === 'desc' ? 1 : 0 };
  if (metric === 'superLargeNet') return { fid: superLargeNet, po: order === 'desc' ? 1 : 0 };
  if (metric === 'largeNet') return { fid: largeNet, po: order === 'desc' ? 1 : 0 };

  // main inflow/outflow are based on the same mainNet field; we enforce direction.
  if (metric === 'mainInflow') return { fid: mainNet, po: 1 };
  if (metric === 'mainOutflow') return { fid: mainNet, po: 0 };

  // default: main net inflow (signed) by window
  return { fid: mainNet, po: order === 'desc' ? 1 : 0 };
}
