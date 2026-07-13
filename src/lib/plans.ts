export interface ListingPlan {
  id: 'basic' | 'premium' | 'lifetime';
  name: string;
  price: number;
  wasPrice: number;
  cadence: 'one-time' | 'per year';
  tagline: string;
  highlighted: boolean;
  features: { label: string; value: string | boolean }[];
  cta: string;
}

export const LISTING_PLANS: ListingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 20,
    wasPrice: 40,
    cadence: 'one-time',
    tagline: 'Get on the map with a clean, standard listing.',
    highlighted: false,
    features: [
      { label: 'Listing type', value: 'Standard' },
      { label: 'Placement', value: 'Search & categories' },
      { label: 'Top placement', value: false },
      { label: 'Category slots', value: '3' },
      { label: 'Keywords', value: '5' },
      { label: 'Photos', value: '4' },
      { label: 'Products', value: '10' },
      { label: 'Job offers', value: '10' },
      { label: 'Monthly leads', value: '5' },
    ],
    cta: 'Get Listed',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 65,
    wasPrice: 130,
    cadence: 'per year',
    tagline: 'Highlighted, top-placed, and built to convert.',
    highlighted: true,
    features: [
      { label: 'Listing type', value: 'Highlighted' },
      { label: 'Placement', value: 'Search, categories & keywords' },
      { label: 'Top placement', value: true },
      { label: 'Category slots', value: '6' },
      { label: 'Keywords', value: '10' },
      { label: 'Photos', value: '15' },
      { label: 'Products', value: '20' },
      { label: 'Job offers', value: '30' },
      { label: 'Monthly leads', value: '40' },
    ],
    cta: 'Get Listed',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 145,
    wasPrice: 290,
    cadence: 'one-time',
    tagline: 'Pay once. Stay highlighted and top-placed forever.',
    highlighted: false,
    features: [
      { label: 'Listing type', value: 'Highlighted' },
      { label: 'Placement', value: 'Search, categories & keywords' },
      { label: 'Top placement', value: true },
      { label: 'Category slots', value: '8' },
      { label: 'Keywords', value: '15' },
      { label: 'Photos', value: '100' },
      { label: 'Products', value: '100' },
      { label: 'Job offers', value: '100' },
      { label: 'Monthly leads', value: 'Unlimited' },
    ],
    cta: 'Get Listed',
  },
];

export const PLAN_BY_ID = Object.fromEntries(LISTING_PLANS.map((p) => [p.id, p]));

/** Hard limits enforced in the Get-Listed wizard (categories/keywords/photos/etc.). */
export interface PlanLimits {
  categories: number;
  keywords: number;
  photos: number;
  products: number;
  jobs: number;
}

export const PLAN_LIMITS: Record<ListingPlan['id'], PlanLimits> = {
  basic: { categories: 3, keywords: 5, photos: 4, products: 10, jobs: 10 },
  premium: { categories: 6, keywords: 10, photos: 15, products: 20, jobs: 30 },
  lifetime: { categories: 8, keywords: 15, photos: 100, products: 100, jobs: 100 },
};

export interface DataHubPlan {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  price: number;
  cadence: 'per month';
  contacts: string;
  exports: string;
  features: string[];
  highlighted: boolean;
}

export const DATAHUB_PLANS: DataHubPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    cadence: 'per month',
    contacts: '2,000 / mo',
    exports: '1,000 rows / mo',
    features: ['Full table interface', 'Advanced filters', 'Column sorting', 'No ads'],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    cadence: 'per month',
    contacts: '25,000 / mo',
    exports: '15,000 rows / mo',
    features: ['Everything in Starter', 'Saved searches', 'CSV export', 'Priority support'],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    cadence: 'per month',
    contacts: 'Unlimited',
    exports: '200,000 rows / mo',
    features: ['Everything in Pro', 'Read-only public API', 'Bulk export', 'Dedicated account manager'],
    highlighted: false,
  },
];
