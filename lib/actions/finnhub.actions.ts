'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';
const EASTMONEY_SUGGEST_URL = 'https://searchapi.eastmoney.com/api/suggest/get';

type EastmoneySuggestItem = {
    Code?: string;
    Name?: string;
    Classify?: string;
    MarketType?: string;
    SecurityTypeName?: string;
};

type EastmoneySuggestResponse = {
    QuotationCodeTable?: {
        Data?: EastmoneySuggestItem[];
        Status?: number;
        Message?: string;
    };
};

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
    const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
        ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
        : { cache: 'no-store' };

    const res = await fetch(url, options);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Fetch failed ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
}

export { fetchJSON };

function isChinaQuery(query: string): boolean {
    if (!query) return false;
    if (/[\u4e00-\u9fff]/.test(query)) return true; // CJK chars
    const q = query.trim().toUpperCase();
    if (/^(SSE|SZSE):\d{6}$/.test(q)) return true;
    if (/^\d{6}$/.test(q)) return true;
    if (/^\d{6}\.(SH|SS|SZ)$/.test(q)) return true;
    return false;
}

function normalizeToTradingViewSymbol(marketType: string | undefined, code: string): string | null {
    // Eastmoney: MarketType "1" = Shanghai, "2" = Shenzhen
    if (marketType === '1') return `SSE:${code}`;
    if (marketType === '2') return `SZSE:${code}`;
    return null;
}

function normalizeChinaInputSymbol(query: string): string | null {
    const q = query.trim().toUpperCase();
    const direct = /^(SSE|SZSE):(\d{6})$/.exec(q);
    if (direct) return `${direct[1]}:${direct[2]}`;

    const suffix = /^(\d{6})\.(SH|SS|SZ)$/.exec(q);
    if (suffix) {
        const code = suffix[1];
        const s = suffix[2];
        if (s === 'SZ') return `SZSE:${code}`;
        return `SSE:${code}`;
    }

    const digits = /^(\d{6})$/.exec(q);
    if (digits) {
        const code = digits[1];
        // Heuristic: 6xxxx/9xxxx => Shanghai, 0xxxx/3xxxx => Shenzhen
        if (/^[69]/.test(code)) return `SSE:${code}`;
        if (/^[03]/.test(code)) return `SZSE:${code}`;
    }

    return null;
}

async function searchChinaStocks(query: string): Promise<StockWithWatchlistStatus[]> {
    const normalizedDirect = normalizeChinaInputSymbol(query);
    if (normalizedDirect) {
        return [
            {
                symbol: normalizedDirect,
                name: normalizedDirect,
                exchange: normalizedDirect.split(':')[0],
                type: 'CN',
                isInWatchlist: false,
            },
        ];
    }

    try {
        const url = `${EASTMONEY_SUGGEST_URL}?input=${encodeURIComponent(query)}&type=14&count=10`;
        const data = await fetchJSON<EastmoneySuggestResponse>(url, 3600);

        const items = data?.QuotationCodeTable?.Data ?? [];
        const mapped: StockWithWatchlistStatus[] = [];
        const seen = new Set<string>();

        for (const item of items) {
            const code = (item?.Code ?? '').trim();
            if (!/^\d{6}$/.test(code)) continue;

            const classify = item?.Classify ?? '';
            // Focus on A-share stocks and indices; skip funds, HK/US/LSE, etc.
            if (classify !== 'AStock' && classify !== 'Index') continue;

            const marketType = item?.MarketType ?? '';
            const tvSymbol = normalizeToTradingViewSymbol(marketType, code);
            if (!tvSymbol) continue;

            if (seen.has(tvSymbol)) continue;
            seen.add(tvSymbol);

            const name = (item?.Name ?? tvSymbol).trim() || tvSymbol;
            const exchange = (item?.SecurityTypeName ?? tvSymbol.split(':')[0]).trim() || tvSymbol.split(':')[0];
            const type = classify === 'Index' ? 'Index' : 'A-Share';

            mapped.push({
                symbol: tvSymbol,
                name,
                exchange,
                type,
                isInWatchlist: false,
            });
        }

        return mapped;
    } catch (err) {
        console.error('China stock search error:', err);
        return [];
    }
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
    try {
        const range = getDateRange(5);
        const token = NEXT_PUBLIC_FINNHUB_API_KEY;
        if (!token) {
            throw new Error('FINNHUB API key is not configured');
        }
        const cleanSymbols = (symbols || [])
            .map((s) => s?.trim().toUpperCase())
            .filter((s): s is string => Boolean(s));

        const maxArticles = 6;

        // If we have symbols, try to fetch company news per symbol and round-robin select
        if (cleanSymbols.length > 0) {
            const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

            await Promise.all(
                cleanSymbols.map(async (sym) => {
                    try {
                        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
                        const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
                        perSymbolArticles[sym] = (articles || []).filter(validateArticle);
                    } catch (e) {
                        console.error('Error fetching company news for', sym, e);
                        perSymbolArticles[sym] = [];
                    }
                })
            );

            const collected: MarketNewsArticle[] = [];
            // Round-robin up to 6 picks
            for (let round = 0; round < maxArticles; round++) {
                for (let i = 0; i < cleanSymbols.length; i++) {
                    const sym = cleanSymbols[i];
                    const list = perSymbolArticles[sym] || [];
                    if (list.length === 0) continue;
                    const article = list.shift();
                    if (!article || !validateArticle(article)) continue;
                    collected.push(formatArticle(article, true, sym, round));
                    if (collected.length >= maxArticles) break;
                }
                if (collected.length >= maxArticles) break;
            }

            if (collected.length > 0) {
                // Sort by datetime desc
                collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
                return collected.slice(0, maxArticles);
            }
            // If none collected, fall through to general news
        }

        // General market news fallback or when no symbols provided
        const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
        const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

        const seen = new Set<string>();
        const unique: RawNewsArticle[] = [];
        for (const art of general || []) {
            if (!validateArticle(art)) continue;
            const key = `${art.id}-${art.url}-${art.headline}`;
            if (seen.has(key)) continue;
            seen.add(key);
            unique.push(art);
            if (unique.length >= 20) break; // cap early before final slicing
        }

        const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
        return formatted;
    } catch (err) {
        console.error('getNews error:', err);
        throw new Error('Failed to fetch news');
    }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
        const token = NEXT_PUBLIC_FINNHUB_API_KEY;
        const trimmed = typeof query === 'string' ? query.trim() : '';

        // Support CN A-shares/indices via Eastmoney (no API key), since Finnhub doesn't cover them well.
        if (trimmed && isChinaQuery(trimmed)) {
            const cn = await searchChinaStocks(trimmed);
            if (cn.length > 0) return cn;
        }

        if (!token) {
            // If no token, provide a small set of defaults so search UI isn't empty.
            if (!trimmed) {
                return [
                    { symbol: 'SSE:000001', name: '上证指数', exchange: 'SSE', type: 'Index', isInWatchlist: false },
                    { symbol: 'SZSE:399001', name: '深证成指', exchange: 'SZSE', type: 'Index', isInWatchlist: false },
                    { symbol: 'SSE:600519', name: '贵州茅台', exchange: 'SSE', type: 'A-Share', isInWatchlist: false },
                    { symbol: 'SZSE:000001', name: '平安银行', exchange: 'SZSE', type: 'A-Share', isInWatchlist: false },
                ];
            }

            // If query isn't CN-like and no Finnhub token, return empty.
            console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
            return [];
        }

        let results: FinnhubSearchResult[] = [];

        if (!trimmed) {
            // Fetch top 10 popular symbols' profiles
            const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
            const profiles = await Promise.all(
                top.map(async (sym) => {
                    try {
                        const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
                        // Revalidate every hour
                        const profile = await fetchJSON<any>(url, 3600);
                        return { sym, profile } as { sym: string; profile: any };
                    } catch (e) {
                        console.error('Error fetching profile2 for', sym, e);
                        return { sym, profile: null } as { sym: string; profile: any };
                    }
                })
            );

            results = profiles
                .map(({ sym, profile }) => {
                    const symbol = sym.toUpperCase();
                    const name: string | undefined = profile?.name || profile?.ticker || undefined;
                    const exchange: string | undefined = profile?.exchange || undefined;
                    if (!name) return undefined;
                    const r: FinnhubSearchResult = {
                        symbol,
                        description: name,
                        displaySymbol: symbol,
                        type: 'Common Stock',
                    };
                    // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
                    // To keep pipeline simple, attach exchange via closure map stage
                    // We'll reconstruct exchange when mapping to final type
                    (r as any).__exchange = exchange; // internal only
                    return r;
                })
                .filter((x): x is FinnhubSearchResult => Boolean(x));
        } else {
            const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
            const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
            results = Array.isArray(data?.result) ? data.result : [];
        }

        const mapped: StockWithWatchlistStatus[] = results
            .map((r) => {
                const upper = (r.symbol || '').toUpperCase();
                const name = r.description || upper;
                const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
                const exchangeFromProfile = (r as any).__exchange as string | undefined;
                const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
                const type = r.type || 'Stock';
                const item: StockWithWatchlistStatus = {
                    symbol: upper,
                    name,
                    exchange,
                    type,
                    isInWatchlist: false,
                };
                return item;
            })
            .slice(0, 15);

        return mapped;
    } catch (err) {
        console.error('Error in stock search:', err);
        return [];
    }
});
