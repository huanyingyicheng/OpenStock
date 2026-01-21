'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { Button } from '@/components/ui/button';

type Period = 'day' | 'week' | 'month';
type DayWindow = '1' | '3' | '5';

type TrendPoint = {
  label: string;
  net: number;
  inflow: number;
  outflow: number;
  close: number | null;
};

type TrendResponse =
  | {
      ok: true;
      name: string;
      points: TrendPoint[];
      query: { id: string; secId: string; period: Period; dayWindow: number; limit: number };
    }
  | { ok: false; error: string; details?: string };

function niceDomain(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: -1, max: 1 };
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: -1, max: 1 };
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.2);
    return { min: min - pad, max: max + pad };
  }
  const pad = (max - min) * 0.1;
  return { min: min - pad, max: max + pad };
}

function formatMoneyZh(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e8) return `${(value / 1e8).toFixed(2)}亿`;
  if (abs >= 1e4) return `${(value / 1e4).toFixed(2)}万`;
  return value.toFixed(0);
}

function formatMoneyEn(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(0);
}

function formatMoney(value: number, locale: 'en' | 'zh'): string {
  return locale === 'zh' ? formatMoneyZh(value) : formatMoneyEn(value);
}

function buildPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
}

export default function FlowTrendChart({
  id,
  defaultPeriod = 'day',
  defaultDayWindow = '1',
  limit = 60,
}: {
  id: string; // SSE:xxxxxx / SZSE:xxxxxx / BKxxxx
  defaultPeriod?: Period;
  defaultDayWindow?: DayWindow;
  limit?: number;
}) {
  const { t, locale } = useI18n();

  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [dayWindow, setDayWindow] = useState<DayWindow>(defaultDayWindow);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [points, setPoints] = useState<TrendPoint[]>([]);

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('id', id);
    params.set('period', period);
    params.set('limit', String(limit));
    if (period === 'day') params.set('dayWindow', dayWindow);
    return `/api/flows/trend?${params.toString()}`;
  }, [id, period, dayWindow, limit]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(requestUrl, { signal: controller.signal })
      .then(async (res) => {
        const json = (await res.json()) as TrendResponse;
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        if (!json.ok) throw new Error(json.error);
        setName(json.name ?? '');
        setPoints(Array.isArray(json.points) ? json.points : []);
      })
      .catch((e) => {
        if (e?.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : String(e));
        setPoints([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [requestUrl]);

  const last = points.length ? points[points.length - 1] : null;
  const netValues = points.map((p) => p.net);
  // Plot inflow as positive, outflow as negative for a symmetric "in/out" view.
  const inValues = points.map((p) => p.inflow);
  const outValues = points.map((p) => -p.outflow);
  const domain = niceDomain([...netValues, ...inValues, ...outValues]);

  const width = 900;
  const height = 220;
  const padding = { l: 10, r: 10, t: 10, b: 24 };
  const innerW = width - padding.l - padding.r;
  const innerH = height - padding.t - padding.b;

  const toX = (idx: number) => (points.length <= 1 ? padding.l : padding.l + (idx / (points.length - 1)) * innerW);
  const toY = (v: number) => {
    const min = domain.min;
    const max = domain.max;
    if (max === min) return padding.t + innerH / 2;
    const ratio = (v - min) / (max - min);
    return padding.t + (1 - ratio) * innerH;
  };

  const netPts = points.map((p, i) => ({ x: toX(i), y: toY(p.net) }));
  const inPts = points.map((p, i) => ({ x: toX(i), y: toY(p.inflow) }));
  const outPts = points.map((p, i) => ({ x: toX(i), y: toY(-p.outflow) }));

  const netPath = buildPath(netPts);
  const inPath = buildPath(inPts);
  const outPath = buildPath(outPts);
  const zeroY = toY(0);

  const inSum = points.reduce((acc, p) => acc + (p.inflow || 0), 0);
  const outSum = points.reduce((acc, p) => acc + (p.outflow || 0), 0);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-100">{t('flows.trend.title')}</div>
          <div className="text-xs text-gray-500">
            {name ? `${name} · ` : ''}
            {period === 'day'
              ? t('flows.trend.period.day')
              : period === 'week'
                ? t('flows.trend.period.week')
                : t('flows.trend.period.month')}
            {period === 'day' ? ` · ${t('flows.trend.dayWindow')}: ${dayWindow}` : ''}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={period === 'day' ? 'default' : 'outline'} onClick={() => setPeriod('day')}>
            {t('flows.trend.period.day')}
          </Button>
          <Button size="sm" variant={period === 'week' ? 'default' : 'outline'} onClick={() => setPeriod('week')}>
            {t('flows.trend.period.week')}
          </Button>
          <Button size="sm" variant={period === 'month' ? 'default' : 'outline'} onClick={() => setPeriod('month')}>
            {t('flows.trend.period.month')}
          </Button>
          {period === 'day' ? (
            <div className="ml-2 flex items-center gap-2 text-xs text-gray-400">
              <span>{t('flows.trend.dayWindow')}</span>
              <select
                className="h-8 rounded-md border border-gray-800 bg-gray-950 px-2 text-gray-200"
                value={dayWindow}
                onChange={(e) => setDayWindow(e.target.value as DayWindow)}
              >
                <option value="1">1</option>
                <option value="3">3</option>
                <option value="5">5</option>
              </select>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3 text-xs">
        <div className="rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-gray-300">
          <div className="text-gray-500">{t('flows.trend.latestNet')}</div>
          <div className={last && last.net < 0 ? 'text-red-400' : 'text-teal-400'}>
            {last ? formatMoney(last.net, locale) : '-'}
          </div>
        </div>
        <div className="rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-gray-300">
          <div className="text-gray-500">{t('flows.trend.sumIn')}</div>
          <div className="text-teal-400">{formatMoney(inSum, locale)}</div>
        </div>
        <div className="rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-gray-300">
          <div className="text-gray-500">{t('flows.trend.sumOut')}</div>
          <div className="text-red-400">{formatMoney(outSum, locale)}</div>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-gray-400">{t('flows.loading')}</div>
        ) : error ? (
          <div className="text-sm text-red-400">
            {t('flows.error')}: {error}
          </div>
        ) : points.length < 2 ? (
          <div className="text-sm text-gray-400">{t('flows.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[680px]">
              <rect x="0" y="0" width={width} height={height} fill="transparent" />
              <line x1={padding.l} y1={zeroY} x2={width - padding.r} y2={zeroY} stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
              <path d={inPath} fill="none" stroke="rgb(34,197,94)" strokeWidth="2" opacity="0.9" />
              <path d={outPath} fill="none" stroke="rgb(248,113,113)" strokeWidth="2" opacity="0.9" />
              <path d={netPath} fill="none" stroke="rgb(45,212,191)" strokeWidth="2.5" />

              {/* last point marker */}
              <circle cx={netPts[netPts.length - 1].x} cy={netPts[netPts.length - 1].y} r="3.5" fill="rgb(45,212,191)" />

              {/* x labels: first / mid / last */}
              <text x={padding.l} y={height - 8} fontSize="12" fill="rgba(148,163,184,0.9)">
                {points[0].label}
              </text>
              <text
                x={padding.l + innerW / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize="12"
                fill="rgba(148,163,184,0.9)"
              >
                {points[Math.floor(points.length / 2)].label}
              </text>
              <text x={width - padding.r} y={height - 8} textAnchor="end" fontSize="12" fill="rgba(148,163,184,0.9)">
                {points[points.length - 1].label}
              </text>
            </svg>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
              <span>
                <span className="inline-block h-2 w-2 rounded-full bg-teal-400 mr-2" />
                {t('flows.trend.legend.net')}
              </span>
              <span>
                <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2" />
                {t('flows.trend.legend.in')}
              </span>
              <span>
                <span className="inline-block h-2 w-2 rounded-full bg-red-400 mr-2" />
                {t('flows.trend.legend.out')}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500">{t('flows.trend.tip')}</div>
    </div>
  );
}
