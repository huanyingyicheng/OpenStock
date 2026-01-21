import { NextResponse } from 'next/server';

type Period = 'day' | 'week' | 'month';
type DayWindow = '1' | '3' | '5';

type EastmoneyFflowResponse = {
  data?: {
    name?: string;
    klines?: string[];
  };
};

type EastmoneySuggestItem = {
  Code?: string;
  Classify?: string;
  SecurityType?: string;
  QuoteID?: string;
};

type EastmoneySuggestResponse = {
  QuotationCodeTable?: {
    Data?: EastmoneySuggestItem[];
    Status?: number;
    Message?: string;
  };
};

type Point = {
  label: string; // date-like label
  net: number;
  inflow: number;
  outflow: number;
  close: number | null;
};

const UT = '8dec03ba335b81bf4ebdf7b29ec27d15';
const DAYKLINE_URL = 'https://push2his.eastmoney.com/api/qt/stock/fflow/daykline/get';
const SUGGEST_URL = 'https://searchapi.eastmoney.com/api/suggest/get';

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  if (!value) return fallback;
  const v = value as T;
  return (allowed as readonly string[]).includes(v) ? v : fallback;
}

function toInt(value: string | null, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

async function resolveSecId(id: string): Promise<string | null> {
  const trimmed = id.trim().toUpperCase();
  if (!trimmed) return null;

  // Allow advanced usage: direct Eastmoney secid (e.g. 105.AAPL / 116.00700 / 1.600519 / 90.BKxxxx)
  if (/^\d+\.[A-Z0-9.\-]+$/.test(trimmed)) return trimmed;

  if (/^BK\d{3,6}$/.test(trimmed)) return `90.${trimmed}`;

  const cn = /^(SSE|SZSE):(\d{6})$/.exec(trimmed);
  if (cn) {
    const ex = cn[1];
    const code = cn[2];
    if (ex === 'SSE') return `1.${code}`;
    if (ex === 'SZSE') return `0.${code}`;
  }

  const us = /^US:([A-Z0-9.\-]{1,12})$/.exec(trimmed);
  if (us) {
    const ticker = us[1];
    const url = new URL(SUGGEST_URL);
    url.searchParams.set('input', ticker);
    url.searchParams.set('type', '14');
    url.searchParams.set('count', '10');
    const res = await fetch(url.toString(), { next: { revalidate } });
    if (!res.ok) return null;
    const json = (await res.json()) as EastmoneySuggestResponse;
    const items = json?.QuotationCodeTable?.Data ?? [];
    const exact = items.find(
      (x) => x?.Classify === 'UsStock' && (x?.Code ?? '').toUpperCase() === ticker && x?.SecurityType === '20' && x?.QuoteID
    );
    return (exact?.QuoteID ?? null) as string | null;
  }

  const hk = /^HK:(\d{4,5})$/.exec(trimmed);
  if (hk) {
    const code = hk[1];
    const url = new URL(SUGGEST_URL);
    url.searchParams.set('input', code);
    url.searchParams.set('type', '14');
    url.searchParams.set('count', '10');
    const res = await fetch(url.toString(), { next: { revalidate } });
    if (!res.ok) return null;
    const json = (await res.json()) as EastmoneySuggestResponse;
    const items = json?.QuotationCodeTable?.Data ?? [];
    const exact = items.find(
      (x) => x?.Classify === 'HK' && (x?.Code ?? '') === code && x?.SecurityType === '19' && x?.QuoteID
    );
    return (exact?.QuoteID ?? null) as string | null;
  }

  return null;
}

function parseRow(row: string): { date: string; net: number; close: number | null } | null {
  // Format: date,superLarge,large,medium,small,mainNet,close
  const parts = row.split(',');
  if (parts.length < 6) return null;
  const date = parts[0];
  const mainNet = Number(parts[5]);
  const close = parts.length >= 7 ? Number(parts[6]) : NaN;
  if (!date || !Number.isFinite(mainNet)) return null;
  return { date, net: mainNet, close: Number.isFinite(close) ? close : null };
}

function groupKey(period: Period, dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;

  if (period === 'month') {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  if (period === 'week') {
    // Use Monday as week key (UTC)
    const day = d.getUTCDay(); // 0=Sun..6=Sat
    const delta = (day + 6) % 7; // Mon=0..Sun=6
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - delta);
    const y = monday.getUTCFullYear();
    const m = String(monday.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(monday.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  return dateStr;
}

function rolling(points: Point[], window: number): Point[] {
  if (window <= 1) return points;
  const out: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - window + 1);
    let net = 0;
    let inflow = 0;
    let outflow = 0;
    for (let j = start; j <= i; j++) {
      net += points[j].net;
      inflow += points[j].inflow;
      outflow += points[j].outflow;
    }
    out.push({ ...points[i], net, inflow, outflow });
  }
  return out;
}

export const revalidate = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const id = (searchParams.get('id') ?? '').trim();
  const secId = await resolveSecId(id);
  if (!secId) {
    return NextResponse.json(
      { ok: false, error: 'Invalid id. Use SSE:xxxxxx / SZSE:xxxxxx / US:TICKER / HK:xxxxx / BKxxxx.' },
      { status: 400 }
    );
  }

  const period = pick<Period>(searchParams.get('period'), ['day', 'week', 'month'], 'day');
  const dayWindow = pick<DayWindow>(searchParams.get('dayWindow'), ['1', '3', '5'], '1');
  const limit = Math.min(240, Math.max(10, toInt(searchParams.get('limit'), period === 'day' ? 60 : period === 'week' ? 104 : 60)));

  const url = new URL(DAYKLINE_URL);
  url.searchParams.set('ut', UT);
  url.searchParams.set('secid', secId);
  url.searchParams.set('lmt', String(Math.max(limit * 3, 120))); // fetch more for grouping/rolling
  url.searchParams.set('fields1', 'f1,f2,f3,f7');
  url.searchParams.set('fields2', 'f51,f52,f53,f54,f55,f56,f62,f66,f72,f78,f84');

  try {
    const res = await fetch(url.toString(), { next: { revalidate } });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ ok: false, error: `Upstream fetch failed (${res.status})`, details: text.slice(0, 500) }, { status: 502 });
    }

    const json = (await res.json()) as EastmoneyFflowResponse;
    const rows = json?.data?.klines ?? [];
    const name = (json?.data?.name ?? '').trim();

    const parsed = rows
      .map(parseRow)
      .filter((x): x is NonNullable<typeof x> => !!x)
      .map((x) => ({
        label: x.date,
        net: x.net,
        inflow: x.net > 0 ? x.net : 0,
        outflow: x.net < 0 ? -x.net : 0,
        close: x.close,
      }));

    // Ensure ascending
    parsed.sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));

    // Aggregate week/month if needed
    let grouped: Point[] = parsed;
    if (period !== 'day') {
      const buckets = new Map<string, Point>();
      for (const p of parsed) {
        const key = groupKey(period, p.label);
        const prev = buckets.get(key);
        if (!prev) {
          buckets.set(key, { ...p, label: key });
        } else {
          prev.net += p.net;
          prev.inflow += p.inflow;
          prev.outflow += p.outflow;
          prev.close = p.close ?? prev.close;
          buckets.set(key, prev);
        }
      }
      grouped = Array.from(buckets.values());
      grouped.sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
    }

    // Rolling only applies to day view (as requested: 1/3/5)
    const windowN = period === 'day' ? Number(dayWindow) : 1;
    const rolled = rolling(grouped, windowN);

    const sliced = rolled.slice(Math.max(0, rolled.length - limit));

    return NextResponse.json({
      ok: true,
      query: { id, secId, period, dayWindow: windowN, limit },
      name,
      points: sliced,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
