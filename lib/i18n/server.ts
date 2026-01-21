import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { isLocale, type Locale, normalizeLocale } from '@/lib/i18n';

export const getLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  // Fallback: detect from Accept-Language when user hasn't picked a locale yet.
  const reqHeaders = await headers();
  const acceptLanguage = (reqHeaders.get('accept-language') ?? '').toLowerCase();
  if (acceptLanguage.includes('zh')) return 'zh';

  return normalizeLocale(cookieLocale);
};
