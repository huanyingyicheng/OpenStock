import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { normalizeLocale, type Locale } from '@/lib/i18n';

export const getLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  const normalizedCookie = normalizeLocale(cookieLocale);
  if (cookieLocale && normalizedCookie !== 'en') return normalizedCookie;
  if (cookieLocale && normalizedCookie === 'en') return normalizedCookie;

  // Fallback: detect from Accept-Language when user hasn't picked a locale yet.
  const reqHeaders = await headers();
  const acceptLanguage = (reqHeaders.get('accept-language') ?? '').toLowerCase();
  if (acceptLanguage.includes('zh')) return 'zh';

  return normalizedCookie;
};
