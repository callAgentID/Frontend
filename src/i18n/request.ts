import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

import en from '../../messages/en.json';
import de from '../../messages/de.json';

const messages: Record<string, any> = { en, de };

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const resolvedLocale = messages[locale] ? locale : 'en';

  return {
    locale: resolvedLocale,
    messages: messages[resolvedLocale]
  };
});
