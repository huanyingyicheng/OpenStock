'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';

type HealthResponse = {
  ok?: boolean;
  missingEnv?: string[];
  db?: { ok?: boolean; error?: string | null };
};

const REQUIRED_FOR_AUTH = ['MONGODB_URI', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL'] as const;

export default function AuthConfigNotice() {
  const { t } = useI18n();
  const [missing, setMissing] = useState<string[]>([]);
  const [dbOk, setDbOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health', { cache: 'no-store' })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as HealthResponse;
        if (cancelled) return;
        setMissing(Array.isArray(json.missingEnv) ? json.missingEnv : []);
        setDbOk(typeof json?.db?.ok === 'boolean' ? json.db.ok : null);
      })
      .catch(() => {
        if (cancelled) return;
        setMissing([]);
        setDbOk(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const missingForAuth = missing.filter((k) => (REQUIRED_FOR_AUTH as readonly string[]).includes(k));
  const show = missingForAuth.length > 0 || dbOk === false;
  if (!show) return null;

  return (
    <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-200">
      <div className="font-medium">{t('auth.configNotice.title')}</div>
      <div className="mt-1 text-amber-200/80">{t('auth.configNotice.body')}</div>
      {missingForAuth.length > 0 ? (
        <div className="mt-2">
          <div className="text-amber-200/80">{t('auth.configNotice.missing')}:</div>
          <ul className="mt-1 list-disc pl-5">
            {missingForAuth.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {dbOk === false ? <div className="mt-2 text-amber-200/80">{t('auth.configNotice.dbDown')}</div> : null}
    </div>
  );
}

