import { NextResponse } from 'next/server';
import {
  buildFields,
  EASTMONEY_CLIST_URL,
  EASTMONEY_UT,
  type EastmoneyClistResponse,
  FLOW_FIDS_BY_WINDOW,
  getNumberField,
  pick,
  resolveSort,
  toInt,
  tvSymbolFromMarketId,
  type Metric,
  type Order,
  type Window,
} from '@/lib/eastmoney/flows';

export const revalidate = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const code = (searchParams.get('code') ?? '').trim().toUpperCase();
  if (!/^BK\d{3,6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: 'Invalid sector code (expected BKxxxx).' }, { status: 400 });
  }

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
  const { mainNet, superLargeNet, largeNet } = FLOW_FIDS_BY_WINDOW[window];
  const fields = buildFields(window);
  const fs = `b:${code}`;

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
      const stockCode = typeof row.f12 === "string" ? row.f12 : '';
      const marketId = typeof row.f13 === 'number' ? row.f13 : undefined;
      const tvSymbol = tvSymbolFromMarketId(marketId, stockCode);

      const netInflow = getNumberField(row, mainNet);
      const superLarge = getNumberField(row, superLargeNet);
      const large = getNumberField(row, largeNet);
      const mainInflow = typeof netInflow === 'number' && netInflow > 0 ? netInflow : 0;
      const mainOutflow = typeof netInflow === 'number' && netInflow < 0 ? -netInflow : 0;

      return {
        rank: (page - 1) * limit + idx + 1,
        code: stockCode,
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
      query: { code, window, metric, order, page, limit },
      total,
      items,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

