import FlowRankings from '@/components/flows/FlowRankings';
import { createTranslator } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function FlowsPage() {
  const t = createTranslator(await getLocale());

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-100">{t('flows.title')}</h1>
          <Button asChild size="sm" variant="outline">
            <Link href="/flows/trend">{t('flows.trendPage.open')}</Link>
          </Button>
        </div>
        <p className="text-sm text-gray-500">{t('flows.subtitle')}</p>
      </div>
      <FlowRankings />
    </div>
  );
}
