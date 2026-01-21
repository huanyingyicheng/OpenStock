'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { createTranslator, type Locale, normalizeLocale } from '@/lib/i18n';

type I18nContextValue = {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) => {
  const [locale, setLocaleState] = useState<Locale>(normalizeLocale(initialLocale));
  const t = useMemo(() => createTranslator(locale), [locale]);

  const setLocale = (nextLocale: Locale) => {
    document.cookie = `locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setLocaleState(nextLocale);
    window.location.reload();
  };

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

