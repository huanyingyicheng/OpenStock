import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
    SYMBOL_INFO_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    BASELINE_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import FlowTrendChart from "@/components/flows/FlowTrendChart";

type EastmoneyQuoteResponse = {
    data?: {
        f57?: string; // code
        f58?: string; // name
        f43?: number; // last
        f170?: number; // change %
        f48?: number; // turnover amount
        f44?: number; // high
        f45?: number; // low
        f46?: number; // open
        f60?: number; // prev close
        f116?: number; // market cap
    };
};

type EastmoneyKlineResponse = {
    data?: {
        klines?: string[];
    };
};

type Kline = { date: string; open: number; close: number; high: number; low: number; volume: number };

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

function toChinaSecId(tvSymbol: string): string | null {
    const m = /^(SSE|SZSE):(\d{6})$/.exec(tvSymbol.toUpperCase());
    if (!m) return null;
    const ex = m[1];
    const code = m[2];
    if (ex === 'SSE') return `1.${code}`;
    return `0.${code}`;
}

async function resolveSecIdBySuggest(symbol: string): Promise<string | null> {
    const s = symbol.trim().toUpperCase();
    const us = /^US:([A-Z0-9.\-]{1,12})$/.exec(s);
    const hk = /^HK:(\d{4,5})$/.exec(s);
    if (!us && !hk) return null;

    const input = us ? us[1] : hk![1];
    const url = new URL('https://searchapi.eastmoney.com/api/suggest/get');
    url.searchParams.set('input', input);
    url.searchParams.set('type', '14');
    url.searchParams.set('count', '10');

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as EastmoneySuggestResponse;
    const items = json?.QuotationCodeTable?.Data ?? [];

    if (us) {
        const exact = items.find(
            (x) => x?.Classify === 'UsStock' && (x?.Code ?? '').toUpperCase() === input && x?.SecurityType === '20' && x?.QuoteID
        );
        return (exact?.QuoteID ?? null) as string | null;
    }

    const exact = items.find(
        (x) => x?.Classify === 'HK' && (x?.Code ?? '') === input && x?.SecurityType === '19' && x?.QuoteID
    );
    return (exact?.QuoteID ?? null) as string | null;
}

async function fetchEastmoneyQuote(secId: string): Promise<EastmoneyQuoteResponse['data'] | null> {
    const url = new URL('https://push2.eastmoney.com/api/qt/stock/get');
    url.searchParams.set('ut', '8dec03ba335b81bf4ebdf7b29ec27d15');
    url.searchParams.set('fltt', '2');
    url.searchParams.set('invt', '2');
    url.searchParams.set('secid', secId);
    url.searchParams.set('fields', 'f57,f58,f43,f170,f48,f44,f45,f46,f60,f116');

    const res = await fetch(url.toString(), { next: { revalidate: 30 } });
    if (!res.ok) return null;
    const json = (await res.json()) as EastmoneyQuoteResponse;
    return json?.data ?? null;
}

function parseKlineRow(row: string): { date: string; open: number; close: number; high: number; low: number; volume: number } | null {
    const parts = row.split(',');
    if (parts.length < 6) return null;
    const [date, open, close, high, low, volume] = parts;
    const o = Number(open);
    const c = Number(close);
    const h = Number(high);
    const l = Number(low);
    const v = Number(volume);
    if (![o, c, h, l, v].every((n) => Number.isFinite(n))) return null;
    return { date, open: o, close: c, high: h, low: l, volume: v };
}

async function fetchEastmoneyKlines(secId: string, limit = 20): Promise<Kline[]> {
    const url = new URL('https://push2his.eastmoney.com/api/qt/stock/kline/get');
    url.searchParams.set('secid', secId);
    url.searchParams.set('fields1', 'f1,f2,f3,f4,f5,f6');
    url.searchParams.set('fields2', 'f51,f52,f53,f54,f55,f56');
    url.searchParams.set('klt', '101'); // daily
    url.searchParams.set('fqt', '1'); // forward-adjusted
    url.searchParams.set('end', '20500101');
    url.searchParams.set('lmt', String(limit));

    const res = await fetch(url.toString(), { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const json = (await res.json()) as EastmoneyKlineResponse;
    const rows = json?.data?.klines ?? [];
    const parsed: Kline[] = [];
    for (const r of rows) {
        const item = parseKlineRow(r);
        if (item) parsed.push(item);
    }
    return parsed;
}

export default async function StockDetails({ params }: StockDetailsPageProps) {
    const { symbol } = await params;
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
    const t = createTranslator(await getLocale());

    const cnSecId = toChinaSecId(symbol);
    const secId = cnSecId ?? (await resolveSecIdBySuggest(symbol));
    let cnQuote: EastmoneyQuoteResponse['data'] | null = null;
    let cnKlines: Kline[] = [];

    if (secId) {
        try {
            const [q, k] = await Promise.all([fetchEastmoneyQuote(secId), fetchEastmoneyKlines(secId, 20)]);
            cnQuote = q;
            cnKlines = k;
        } catch {
            cnQuote = null;
            cnKlines = [];
        }
    }

    return (
        <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Left column */}
                <div className="flex flex-col gap-6">
                    {secId ? (
                        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-base font-semibold text-gray-100">{t('stock.snapshot.title')}</h2>
                                <a
                                    className="text-xs text-gray-400 hover:text-teal-400 underline underline-offset-4"
                                    href="https://data.eastmoney.com/zjlx/"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {t('stock.snapshot.dataSource')}
                                </a>
                            </div>

                            {cnQuote ? (
                                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                    <div className="text-gray-400">{t('stock.snapshot.name')}</div>
                                    <div className="text-gray-200">{cnQuote.f58 ?? symbol.toUpperCase()}</div>
                                    <div className="text-gray-400">{t('stock.snapshot.price')}</div>
                                    <div className="text-gray-200">{typeof cnQuote.f43 === 'number' ? cnQuote.f43.toFixed(2) : '-'}</div>
                                    <div className="text-gray-400">{t('stock.snapshot.changePct')}</div>
                                    <div className={typeof cnQuote.f170 === 'number' && cnQuote.f170 < 0 ? 'text-red-400' : 'text-teal-400'}>
                                        {typeof cnQuote.f170 === 'number' ? `${cnQuote.f170.toFixed(2)}%` : '-'}
                                    </div>
                                    <div className="text-gray-400">{t('stock.snapshot.turnover')}</div>
                                    <div className="text-gray-200">{typeof cnQuote.f48 === 'number' ? cnQuote.f48.toLocaleString() : '-'}</div>
                                </div>
                            ) : (
                                <div className="mt-3 text-sm text-amber-200/80">{t('stock.snapshot.quoteUnavailable')}</div>
                            )}

                            <div className="mt-4 text-xs text-gray-500">{t('stock.snapshot.widgetsTip')}</div>

                            {cnKlines.length > 0 ? (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                        <thead className="text-gray-400">
                                            <tr>
                                                <th className="py-2 text-left font-medium">{t('stock.snapshot.kline.date')}</th>
                                                <th className="py-2 text-right font-medium">{t('stock.snapshot.kline.open')}</th>
                                                <th className="py-2 text-right font-medium">{t('stock.snapshot.kline.close')}</th>
                                                <th className="py-2 text-right font-medium">{t('stock.snapshot.kline.high')}</th>
                                                <th className="py-2 text-right font-medium">{t('stock.snapshot.kline.low')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800 text-gray-200">
                                            {cnKlines
                                                .slice()
                                                .reverse()
                                                .slice(0, 10)
                                                .map((k) => (
                                                    <tr key={k.date}>
                                                        <td className="py-2">{k.date}</td>
                                                        <td className="py-2 text-right">{k.open.toFixed(2)}</td>
                                                        <td className="py-2 text-right">{k.close.toFixed(2)}</td>
                                                        <td className="py-2 text-right">{k.high.toFixed(2)}</td>
                                                        <td className="py-2 text-right">{k.low.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {secId ? <FlowTrendChart id={secId} defaultPeriod="day" defaultDayWindow="1" limit={60} /> : null}

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}symbol-info.js`}
                        config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
                        height={170}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}advanced-chart.js`}
                        config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
                        className="custom-chart"
                        height={600}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}advanced-chart.js`}
                        config={BASELINE_WIDGET_CONFIG(symbol)}
                        className="custom-chart"
                        height={600}
                    />
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <WatchlistButton symbol={symbol.toUpperCase()} company={symbol.toUpperCase()} isInWatchlist={false} />
                    </div>

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}technical-analysis.js`}
                        config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
                        height={400}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}company-profile.js`}
                        config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
                        height={440}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}financials.js`}
                        config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
                        height={800}
                    />
                </div>
            </section>
        </div>
    );
}
