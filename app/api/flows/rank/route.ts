import { NextResponse } from 'next/server';
import {
  buildFields,
  EASTMONEY_CLIST_URL,
  EASTMONEY_UT,
  type EastmoneyClistResponse,
  FS_FUND,
  FS_SECTOR,
  FS_STOCK,
  FLOW_FIDS_BY_WINDOW,
  getNumberField,
  pick,
  resolveSort,
  toInt,
  tvSymbolFromMarketId,
  type Market,
  type Metric,
  type Order,
  type Scope,
  type SectorType,
  type Window,
} from '@/lib/eastmoney/flows';

export const revalidate = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const scope = pick<Scope>(searchParams.get('scope'), ['stock', 'sector', 'fund'], 'stock');
  const market = pick<Market>(searchParams.get('market'), ['all', 'sha', 'sza', 'kcb', 'cyb', 'zxb', 'us', 'hk'], 'all');
  const sectorType = pick<SectorType>(searchParams.get('sectorType'), ['industry', 'concept', 'region'], 'industry');
  const window = pick<Window>(searchParams.get('window'), ['1', '3', '5', '10'], '1');
  const metric = pick<Metric>(
    searchParams.get('metric'),
    ['netInflow', 'mainInflow', 'mainOutflow', 'turnover', 'superLargeNet', 'largeNet'],
    'netInflow'
  );
  const order = pick<Order>(searchParams.get('order'), ['desc', 'asc'], 'desc');
  const page = Math.max(1, toInt(searchParams.get('page'), 1));
  const limit = Math.min(100, Math.max(1, toInt(searchParams.get('limit'), 20)));

  const { fid, po } = resolveSort(metric, window, order);
  const fs =
    scope === 'sector'
      ? FS_SECTOR[sectorType]
      : scope === 'fund'
        ? FS_FUND[market === 'sha' ? 'sha' : market === 'sza' ? 'sza' : 'all']
        : FS_STOCK[market];
  const fields = buildFields(window);
  const { mainNet, superLargeNet, largeNet } = FLOW_FIDS_BY_WINDOW[window];

  const url = new URL(EASTMONEY_CLIST_URL);
  url.searchParams.set('np', '1');
  url.searchParams.set('fltt', '2');
  url.searchParams.set('invt', '2');
  url.searchParams.set('ut', EASTMONEY_UT);
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
      const tvSymbol = scope === 'stock' || scope === 'fund' ? tvSymbolFromMarketId(marketId, code) : null;
      const netInflow = getNumberField(row, mainNet);
      const superLarge = getNumberField(row, superLargeNet);
      const large = getNumberField(row, largeNet);
      const mainInflow = typeof netInflow === 'number' && netInflow > 0 ? netInflow : 0;
      const mainOutflow = typeof netInflow === 'number' && netInflow < 0 ? -netInflow : 0;

      return {
        rank: (page - 1) * limit + idx + 1,
        code,
        name: typeof row.f14 === 'string' ? row.f14 : '',
        price: typeof row.f2 === 'number' ? row.f2 : null,
        changePct: typeof row.f3 === 'number' ? row.f3 : null,
        turnover: typeof row.f6 === 'number' ? row.f6 : null,
        netInflow,
        mainInflow,
        mainOutflow,
        superLargeNet: superLarge,
        largeNet: large,
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
