'use client';

import React from 'react';
import { useI18n } from '@/components/I18nProvider';
import { Button } from '@/components/ui/button';

export default function LanguageToggle({ variant = 'ghost' }: { variant?: 'ghost' | 'outline' }) {
  const { locale, setLocale, t } = useI18n();

  const next = locale === 'en' ? 'zh' : 'en';

  return (
    <Button
      type="button"
      variant={variant}
      className="text-gray-300 hover:text-teal-500"
      onClick={() => setLocale(next)}
      aria-label={t('common.language')}
    >
      {locale === 'en' ? t('common.chinese') : t('common.english')}
    </Button>
  );
}

