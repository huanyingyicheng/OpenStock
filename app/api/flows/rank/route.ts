import { NextResponse } from 'next/server';

type Scope = 'stock' | 'sector';
type Market = 'all' | 'sha' | 'sza' | 'kcb' | 'cyb' | 'zxb';
type SectorType = 'industry' | 'concept' | 'region';
type Window = '1' | '3' | '5' | '10';
type Metric = 'netInflow' | 'turnover';
type Order = 'desc' | 'asc';

type EastmoneyClistDiff = Record<string, unknown> & {
  f12?: string; // code
  f14?: string; // name
  f2?: number; // last/price
  f3?: number; // change %
  f6?: number; // turnover
  f13?: number; // market id (stocks)
};

type EastmoneyClistResponse = {
  data?: {
    total?: number;
    diff?: EastmoneyClistDiff[];
  };
  error?: unknown;
};

const EASTMONEY_CLIST_URL = 'https://push2.eastmoney.com/api/qt/clist/get';
const UT = '8dec03ba335b81bf4ebdf7b29ec27d15';

const FS_STOCK: Record<Market, string> = {
  all: 'm:0+t:6+f:!2,m:0+t:13+f:!2,m:0+t:80+f:!2,m:1+t:2+f:!2,m:1+t:23+f:!2,m:0+t:7+f:!2,m:1+t:3+f:!2',
  sha: 'm:1+t:2+f:!2',
  sza: 'm:0+t:6+f:!2,m:0+t:13+f:!2',
  kcb: 'm:1+t:23+f:!2',
  cyb: 'm:0+t:80+f:!2',
  zxb: 'm:0+t:13+f:!2',
};

const FS_SECTOR: Record<SectorType, string> = {
  industry: 'm:90+t:2',
  concept: 'm:90+t:3',
  region: 'm:90+t:1',
};

const NET_INFLOW_FID_BY_WINDOW: Record<Window, string> = {
  '1': 'f62',
  '3': 'f127',
  '5': 'f109',
  '10': 'f160',
};

function toInt(value: string | null, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  if (!value) return fallback;
  const v = value as T;
  return (allowed as readonly string[]).includes(v) ? v : fallback;
}

function buildFields(window: Window): string {
  const netFid = NET_INFLOW_FID_BY_WINDOW[window];
  // Keep the payload small but useful for ranking tables.
  // f13 is used to map A-share stocks to TradingView symbols.
  return ['f12', 'f14', 'f2', 'f3', 'f6', 'f13', netFid].join(',');
}

function tvSymbolFromMarketId(marketId: number | undefined, code: string | undefined): string | null {
  if (!code) return null;
  if (!/^\d{6}$/.test(code)) return null;
  if (marketId === 1) return `SSE:${code}`;
  if (marketId === 0) return `SZSE:${code}`;
  return null;
}

export const revalidate = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const scope = pick<Scope>(searchParams.get('scope'), ['stock', 'sector'], 'stock');
  const market = pick<Market>(searchParams.get('market'), ['all', 'sha', 'sza', 'kcb', 'cyb', 'zxb'], 'all');
  const sectorType = pick<SectorType>(searchParams.get('sectorType'), ['industry', 'concept', 'region'], 'industry');
  const window = pick<Window>(searchParams.get('window'), ['1', '3', '5', '10'], '1');
  const metric = pick<Metric>(searchParams.get('metric'), ['netInflow', 'turnover'], 'netInflow');
  const order = pick<Order>(searchParams.get('order'), ['desc', 'asc'], 'desc');
  const page = Math.max(1, toInt(searchParams.get('page'), 1));
  const limit = Math.min(100, Math.max(1, toInt(searchParams.get('limit'), 20)));

  const netInflowFid = NET_INFLOW_FID_BY_WINDOW[window];
  const fid = metric === 'turnover' ? 'f6' : netInflowFid;
  const po = order === 'desc' ? 1 : 0;
  const fs = scope === 'sector' ? FS_SECTOR[sectorType] : FS_STOCK[market];
  const fields = buildFields(window);

  const url = new URL(EASTMONEY_CLIST_URL);
  url.searchParams.set('np', '1');
  url.searchParams.set('fltt', '2');
  url.searchParams.set('invt', '2');
  url.searchParams.set('ut', UT);
  url.searchParams.set('pn', String(page));
  url.searchParams.set('pz', String(limit));
  url.searchParams.set('po', String(po));
  url.searchParams.set('fid', fid);
  url.searchParams.set('fs', fs);
  url.searchParams.set('fields', fields);

  try {
    const res = await fetch(url.toString(), { next: { revalidate } });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json(
        { ok: false, error: `Upstream fetch failed (${res.status})`, details: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = (await res.json()) as EastmoneyClistResponse;
    const diff = data?.data?.diff ?? [];
    const total = data?.data?.total ?? 0;

    const items = diff.map((row, idx) => {
      const code = typeof row.f12 === 'string' ? row.f12 : '';
      const marketId = typeof row.f13 === 'number' ? row.f13 : undefined;
      const tvSymbol = scope === 'stock' ? tvSymbolFromMarketId(marketId, code) : null;
      const netInflowRaw = (row as any)[netInflowFid];
      const netInflow = typeof netInflowRaw === 'number' ? netInflowRaw : null;

      return {
        rank: (page - 1) * limit + idx + 1,
        code,
        name: typeof row.f14 === 'string' ? row.f14 : '',
        price: typeof row.f2 === 'number' ? row.f2 : null,
        changePct: typeof row.f3 === 'number' ? row.f3 : null,
        turnover: typeof row.f6 === 'number' ? row.f6 : null,
        netInflow,
        tvSymbol,
      };
    });

    return NextResponse.json({
      ok: true,
      query: { scope, market, sectorType, window, metric, order, page, limit },
      total,
      items,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

