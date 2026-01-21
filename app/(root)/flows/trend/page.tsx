import FlowTrendExplorer from '@/components/flows/FlowTrendExplorer';
import { createTranslator } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function FlowTrendPage() {
  const t = createTranslator(await getLocale());
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-100">{t('flows.trendPage.title')}</h1>
        <p className="text-sm text-gray-500">{t('flows.trendPage.subtitle')}</p>
      </div>
      <FlowTrendExplorer />
    </div>
  );
}

