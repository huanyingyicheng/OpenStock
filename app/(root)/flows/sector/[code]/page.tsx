import Link from 'next/link';
import { createTranslator } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';
import SectorConstituentRankings from '@/components/flows/SectorConstituentRankings';

export const dynamic = 'force-dynamic';

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
  };
};

function tvSymbolFromSuggest(item: EastmoneySuggestItem): string | null {
  const code = (item.Code ?? '').trim();
  if (!/^\d{6}$/.test(code)) return null;
  if (item.MarketType === '1') return `SSE:${code}`;
  if (item.MarketType === '2') return `SZSE:${code}`;
  return null;
}

async function fetchSuggest(input: string, count = 20): Promise<EastmoneySuggestItem[]> {
  const url = new URL('https://searchapi.eastmoney.com/api/suggest/get');
  url.searchParams.set('input', input);
  url.searchParams.set('type', '14');
  url.searchParams.set('count', String(count));

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const json = (await res.json()) as EastmoneySuggestResponse;
  return json?.QuotationCodeTable?.Data ?? [];
}

async function getSectorName(code: string): Promise<string> {
  const items = await fetchSuggest(code, 10);
  const hit = items.find((i) => (i.Code ?? '').toUpperCase() === code.toUpperCase() && i.Classify === 'BK');
  return (hit?.Name ?? code).trim() || code;
}

async function getRelatedFundsByName(sectorName: string): Promise<Array<{ tvSymbol: string; code: string; name: string }>> {
  const items = await fetchSuggest(sectorName, 30);
  const funds: Array<{ tvSymbol: string; code: string; name: string }> = [];
  const seen = new Set<string>();

  for (const i of items) {
    if (i.Classify !== 'Fund') continue;
    const tv = tvSymbolFromSuggest(i);
    if (!tv) continue;
    if (seen.has(tv)) continue;
    seen.add(tv);
    funds.push({ tvSymbol: tv, code: (i.Code ?? '').trim(), name: (i.Name ?? tv).trim() || tv });
  }

  return funds;
}

export default async function SectorDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const t = createTranslator(await getLocale());

  const sectorCode = (code ?? '').trim().toUpperCase();
  const sectorName = await getSectorName(sectorCode);
  const relatedFunds = await getRelatedFundsByName(sectorName);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-100">
            {t('flows.sectorDetail.title')}: {sectorName} ({sectorCode})
          </h1>
          <Link className="text-sm text-gray-400 hover:text-teal-400 underline underline-offset-4" href="/flows">
            {t('flows.sectorDetail.back')}
          </Link>
        </div>
        <p className="text-sm text-gray-500">{t('flows.sectorDetail.subtitle')}</p>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
        <h2 id="funds" className="text-base font-semibold text-gray-100">{t('flows.sectorDetail.relatedFunds')}</h2>
        {relatedFunds.length === 0 ? (
          <div className="mt-2 text-sm text-gray-400">{t('flows.sectorDetail.noFunds')}</div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedFunds.slice(0, 12).map((f) => (
              <Link
                key={f.tvSymbol}
                href={`/stocks/${encodeURIComponent(f.tvSymbol)}`}
                className="rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200 hover:text-teal-400"
              >
                {f.name} ({f.code})
              </Link>
            ))}
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500">{t('flows.sectorDetail.fundsTip')}</div>
      </div>

      <div id="stocks">
        <SectorConstituentRankings sectorCode={sectorCode} />
      </div>
    </div>
  );
}
