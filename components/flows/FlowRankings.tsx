'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { Button } from '@/components/ui/button';

type ScopeTab = 'stocks' | 'sectors';
type Market = 'all' | 'sha' | 'sza' | 'kcb' | 'cyb' | 'zxb';
type SectorType = 'industry' | 'concept' | 'region';
type Window = '1' | '3' | '5' | '10';
type Metric = 'netInflow' | 'turnover';
type Order = 'desc' | 'asc';

type RankItem = {
  rank: number;
  code: string;
  name: string;
  price: number | null;
  changePct: number | null;
  turnover: number | null;
  netInflow: number | null;
  tvSymbol: string | null;
};

type RankResponse =
  | { ok: true; total: number; items: RankItem[]; query: Record<string, unknown> }
  | { ok: false; error: string; details?: string };

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

function formatMoney(value: number | null, locale: 'en' | 'zh'): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return locale === 'zh' ? formatMoneyZh(value) : formatMoneyEn(value);
}

function formatPct(value: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${value.toFixed(2)}%`;
}

export default function FlowRankings() {
  const { t, locale } = useI18n();

  const [tab, setTab] = useState<ScopeTab>('stocks');
  const [market, setMarket] = useState<Market>('all');
  const [sectorType, setSectorType] = useState<SectorType>('industry');
  const [window, setWindow] = useState<Window>('1');
  const [metric, setMetric] = useState<Metric>('netInflow');
  const [order, setOrder] = useState<Order>('desc');
  const [limit, setLimit] = useState<number>(20);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<RankItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (tab === 'sectors') {
      params.set('scope', 'sector');
      params.set('sectorType', sectorType);
    } else {
      params.set('scope', 'stock');
      params.set('market', market);
    }
    params.set('window', window);
    params.set('metric', metric);
    params.set('order', order);
    params.set('limit', String(limit));
    params.set('page', '1');
    return `/api/flows/rank?${params.toString()}`;
  }, [tab, sectorType, market, window, metric, order, limit]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(requestUrl, { signal: controller.signal })
      .then(async (res) => {
        const json = (await res.json()) as RankResponse;
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        if (!json.ok) throw new Error(json.error);
        setItems(json.items);
        setTotal(json.total);
        setUpdatedAt(new Date().toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US'));
      })
      .catch((e) => {
        if (e?.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : String(e));
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [requestUrl, locale]);

  const marketOptions = useMemo(
    () =>
      [
        { value: 'all', label: t('flows.market.all') },
        { value: 'sha', label: t('flows.market.sha') },
        { value: 'sza', label: t('flows.market.sza') },
        { value: 'kcb', label: t('flows.market.kcb') },
        { value: 'cyb', label: t('flows.market.cyb') },
        { value: 'zxb', label: t('flows.market.zxb') },
      ] as const,
    [t]
  );

  const sectorTypeOptions = useMemo(
    () =>
      [
        { value: 'industry', label: t('flows.sector.industry') },
        { value: 'concept', label: t('flows.sector.concept') },
        { value: 'region', label: t('flows.sector.region') },
      ] as const,
    [t]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={tab === 'stocks' ? 'default' : 'outline'}
          onClick={() => setTab('stocks')}
        >
          {t('flows.tabs.stocks')}
        </Button>
        <Button
          size="sm"
          variant={tab === 'sectors' ? 'default' : 'outline'}
          onClick={() => setTab('sectors')}
        >
          {t('flows.tabs.sectors')}
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {updatedAt ? (
            <span className="text-xs text-gray-500">
              {t('flows.updatedAt')}: {updatedAt}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-800 bg-gray-900/40 p-3">
        {tab === 'stocks' ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-400">{t('flows.filters.market')}</span>
            <select
              className="h-9 rounded-md border border-gray-800 bg-gray-950 px-3 text-gray-200"
              value={market}
              onChange={(e) => setMarket(e.target.value as Market)}
            >
              {marketOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-400">{t('flows.filters.sectorType')}</span>
            <select
              className="h-9 rounded-md border border-gray-800 bg-gray-950 px-3 text-gray-200"
              value={sectorType}
              onChange={(e) => setSectorType(e.target.value as SectorType)}
            >
              {sectorTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-400">{t('flows.filters.window')}</span>
          <select
            className="h-9 rounded-md border border-gray-800 bg-gray-950 px-3 text-gray-200"
            value={window}
            onChange={(e) => setWindow(e.target.value as Window)}
          >
            <option value="1">{t('flows.window.1')}</option>
            <option value="3">{t('flows.window.3')}</option>
            <option value="5">{t('flows.window.5')}</option>
            <option value="10">{t('flows.window.10')}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-400">{t('flows.filters.metric')}</span>
          <select
            className="h-9 rounded-md border border-gray-800 bg-gray-950 px-3 text-gray-200"
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
          >
            <option value="netInflow">{t('flows.metric.netInflow')}</option>
            <option value="turnover">{t('flows.metric.turnover')}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-400">{t('flows.filters.order')}</span>
          <select
            className="h-9 rounded-md border border-gray-800 bg-gray-950 px-3 text-gray-200"
            value={order}
            onChange={(e) => setOrder(e.target.value as Order)}
          >
            <option value="desc">{t('flows.order.desc')}</option>
            <option value="asc">{t('flows.order.asc')}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-400">{t('flows.filters.limit')}</span>
          <input
            className="h-9 w-24 rounded-md border border-gray-800 bg-gray-950 px-3 text-gray-200"
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="rounded-lg border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between bg-gray-950 px-4 py-3">
          <div className="text-sm text-gray-400">
            {t('flows.dataSource')}{' '}
            <a
              className="underline underline-offset-4 hover:text-teal-400"
              href="https://data.eastmoney.com/zjlx/"
              target="_blank"
              rel="noreferrer"
            >
              Eastmoney
            </a>
          </div>
          <div className="text-xs text-gray-500">{total ? `${t('flows.total')}: ${total}` : ''}</div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-400">{t('flows.loading')}</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-400">
            {t('flows.error')}: {error}
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-gray-400">{t('flows.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-950 text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t('flows.table.rank')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('flows.table.name')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('flows.table.code')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('flows.table.turnover')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('flows.table.netInflow')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('flows.table.changePct')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-900/20">
                {items.map((row) => {
                  const changeClass =
                    typeof row.changePct === 'number'
                      ? row.changePct > 0
                        ? 'text-teal-400'
                        : row.changePct < 0
                          ? 'text-red-400'
                          : 'text-gray-300'
                      : 'text-gray-300';
                  const flowClass =
                    typeof row.netInflow === 'number'
                      ? row.netInflow > 0
                        ? 'text-teal-400'
                        : row.netInflow < 0
                          ? 'text-red-400'
                          : 'text-gray-300'
                      : 'text-gray-300';

                  return (
                    <tr key={`${row.rank}-${row.code}`} className="hover:bg-gray-900/40">
                      <td className="px-4 py-3 text-gray-400">{row.rank}</td>
                      <td className="px-4 py-3">
                        {row.tvSymbol ? (
                          <Link
                            className="text-gray-100 hover:text-teal-400 underline-offset-4 hover:underline"
                            href={`/stocks/${encodeURIComponent(row.tvSymbol)}`}
                          >
                            {row.name || row.tvSymbol}
                          </Link>
                        ) : (
                          <span className="text-gray-100">{row.name || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{row.code || '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-200">
                        {formatMoney(row.turnover, locale)}
                      </td>
                      <td className={`px-4 py-3 text-right ${flowClass}`}>
                        {formatMoney(row.netInflow, locale)}
                      </td>
                      <td className={`px-4 py-3 text-right ${changeClass}`}>
                        {formatPct(row.changePct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
