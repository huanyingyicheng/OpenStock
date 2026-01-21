import { enMessages } from '@/lib/i18n/messages/en';
import { zhMessages } from '@/lib/i18n/messages/zh';

export type Locale = 'en' | 'zh';

export const defaultLocale: Locale = 'en';

export const isLocale = (value: string | undefined | null): value is Locale =>
  value === 'en' || value === 'zh';

export const normalizeLocale = (value: string | undefined | null): Locale =>
  isLocale(value) ? value : defaultLocale;

const dictionaries: Record<Locale, Record<string, unknown>> = {
  en: enMessages,
  zh: zhMessages,
};

const getByPath = (obj: Record<string, unknown>, key: string): unknown => {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

const interpolate = (template: string, vars?: Record<string, string | number>) => {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
};

export const createTranslator = (locale: Locale) => {
  const dict = dictionaries[locale];
  const fallback = dictionaries[defaultLocale];

  return (key: string, vars?: Record<string, string | number>) => {
    const value = getByPath(dict, key) ?? getByPath(fallback, key) ?? key;
    if (typeof value !== 'string') return key;
    return interpolate(value, vars);
  };
};

