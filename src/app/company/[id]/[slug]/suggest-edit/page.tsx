import { notFound } from 'next/navigation';
import { getBusiness } from '@/lib/queries';
import { SuggestEditClient } from './SuggestEditClient';

export const metadata = { title: 'Suggest an edit' };

export default function SuggestEditPage({ params }: { params: { id: string; slug: string } }) {
  const b = getBusiness(Number(params.id));
  if (!b) notFound();
  return <SuggestEditClient id={b.id} slug={b.slug} name={b.name} />;
}
