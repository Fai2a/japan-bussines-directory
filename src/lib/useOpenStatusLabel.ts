import { useTranslations } from 'next-intl';
import type { Business } from './types';
import { openStatus } from './queries';

/** Renders openStatus()'s result as a properly translated string. */
export function useOpenStatusLabel(b: Business) {
  const t = useTranslations('hours');
  const status = openStatus(b);
  const label =
    status.kind === 'closedToday'
      ? t('closedToday')
      : status.kind === 'openNow'
        ? t('openNow', { time: status.time ?? '' })
        : status.kind === 'opensLater'
          ? t('opensLater', { time: status.time ?? '' })
          : t('closedTomorrow', { time: status.time ?? '' });
  return { ...status, label };
}
