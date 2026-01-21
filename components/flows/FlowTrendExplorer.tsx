'use client';

import React, { useMemo, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { Button } from '@/components/ui/button';
import FlowTrendChart from '@/components/flows/FlowTrendChart';

function normalizeInput(raw: string): string {
  return raw.trim();
}

export default function FlowTrendExplorer() {
  const { t } = useI18n();
  const [input, setInput] = useState<string>('SSE:600879');
  const [current, setCurrent] = useState<string>('SSE:600879');

  const examples = useMemo(
    () => [
      { id: 'SSE:600879', label: 'SSE:600879' },
      { id: 'SZSE:000001', label: 'SZSE:000001' },
      { id: 'BK1036', label: 'BK1036' },
      { id: 'SSE:512480', label: 'SSE:512480 (ETF)' },
      { id: 'SZSE:159915', label: 'SZSE:159915 (ETF)' },
      { id: 'US:AAPL', label: 'US:AAPL' },
      { id: 'HK:00700', label: 'HK:00700' },
    ],
    []
  );

  const apply = () => {
    const v = normalizeInput(input);
    if (!v) return;
    setCurrent(v);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm flex-1 min-w-[240px]">
            <span className="text-gray-400">{t('flows.trendPage.inputLabel')}</span>
            <input
              className="h-9 rounded-md border border-gray-800 bg-gray-950 px-3 text-gray-200"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('flows.trendPage.inputPlaceholder')}
            />
          </label>
          <Button onClick={apply} size="sm">
            {t('flows.trendPage.apply')}
          </Button>
        </div>

        <div className="mt-3 text-xs text-gray-500">{t('flows.trendPage.examples')}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <Button
              key={ex.id}
              size="sm"
              variant="outline"
              onClick={() => {
                setInput(ex.id);
                setCurrent(ex.id);
              }}
            >
              {ex.label}
            </Button>
          ))}
        </div>
      </div>

      <FlowTrendChart id={current} />
    </div>
  );
}
