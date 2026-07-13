import { Upcoming } from '@/components/site/Upcoming';

export const metadata = { title: 'Report a problem' };

export default function ReportPage() {
  return (
    <Upcoming
      crumb="Report"
      phase="Build phase 2"
      title="Report a problem with a listing"
      summary="Spotted wrong details, a closed business, or an abusive review? Tell us and we’ll investigate."
      points={[
        'Structured report reasons (wrong info, closed, spam, abuse)',
        'Optional evidence upload',
        'Routes into the moderation queue',
      ]}
      primary={{ href: '/contact', label: 'Contact support' }}
    />
  );
}
