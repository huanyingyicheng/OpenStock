import { cookies } from 'next/headers';
import { normalizeLocale, type Locale } from '@/lib/i18n';

export const getLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  return normalizeLocale(cookieLocale);
};
