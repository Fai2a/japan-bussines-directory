import { Upcoming } from '@/components/site/Upcoming';

export const metadata = { title: 'Global Network' };

export default function NetworkPage() {
  return (
    <Upcoming
      crumb="Global Network"
      phase="Build phase 5"
      title="Global directory network"
      summary="NihonPages is part of a network of local business directories. This page maps our sister sites across other countries."
      points={[
        'Interactive world map of sister directories',
        'Country links with live company counts',
        'Consistent design system across the network',
      ]}
    />
  );
}
