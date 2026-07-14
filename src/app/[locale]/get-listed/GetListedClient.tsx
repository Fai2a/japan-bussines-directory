'use client';

import { useEffect, useMemo, useReducer, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn as nextSignIn, useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LISTING_PLANS, PLAN_LIMITS, type ListingPlan } from '@/lib/plans';
import { CATEGORIES, CATEGORY_GROUPS, GROUP_BY_KEY } from '@/lib/categories';
import { CITIES } from '@/lib/cities';
import { usd, yen } from '@/lib/format';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// ---------------------------------------------------------------------------
// Wizard state
// ---------------------------------------------------------------------------
type PlanId = ListingPlan['id'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type Day = (typeof DAYS)[number];

interface ProductDraft { name: string; price: string; blurb: string }
interface JobDraft { title: string; type: 'Full-time' | 'Part-time' | 'Contract'; salaryMin: string; salaryMax: string }

interface WizardState {
  plan: PlanId;
  account: { name: string; nameJa: string; contact: string; email: string; phone: string; password: string };
  details: {
    citySlug: string;
    address: string;
    addressJa: string;
    website: string;
    publicEmail: string;
    established: string;
    employees: string;
    description: string;
    categories: string[];
    keywords: string[];
    photos: string[];
    products: ProductDraft[];
    jobs: JobDraft[];
    hours: Record<Day, { open: string; close: string; closed: boolean }>;
  };
  payment: { cardName: string; cardNumber: string; expiry: string; cvc: string };
  reference: string | null;
}

const defaultHours = () =>
  DAYS.reduce((acc, d) => {
    acc[d] = { open: '09:00', close: '18:00', closed: d === 'sun' };
    return acc;
  }, {} as WizardState['details']['hours']);

const initialState = (plan: PlanId): WizardState => ({
  plan,
  account: { name: '', nameJa: '', contact: '', email: '', phone: '', password: '' },
  details: {
    citySlug: '', address: '', addressJa: '', website: '', publicEmail: '',
    established: '', employees: '', description: '',
    categories: [], keywords: [], photos: [], products: [], jobs: [], hours: defaultHours(),
  },
  payment: { cardName: '', cardNumber: '', expiry: '', cvc: '' },
  reference: null,
});

type Action =
  | { type: 'set'; path: string; value: unknown }
  | { type: 'replace'; value: WizardState }
  | { type: 'plan'; value: PlanId };

function setIn(obj: any, path: string, value: unknown): any {
  const keys = path.split('.');
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = Array.isArray(cur[keys[i]]) ? [...cur[keys[i]]] : { ...cur[keys[i]] };
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
}

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'set':
      return setIn(state, action.path, action.value);
    case 'replace':
      return action.value;
    case 'plan': {
      // Trim selections that exceed the new plan's limits.
      const lim = PLAN_LIMITS[action.value];
      return {
        ...state,
        plan: action.value,
        details: {
          ...state.details,
          categories: state.details.categories.slice(0, lim.categories),
          keywords: state.details.keywords.slice(0, lim.keywords),
          photos: state.details.photos.slice(0, lim.photos),
          products: state.details.products.slice(0, lim.products),
          jobs: state.details.jobs.slice(0, lim.jobs),
        },
      };
    }
    default:
      return state;
  }
}

const STORAGE_KEY = 'np_get_listed_v1';

/** Has the user entered anything worth restoring? (avoids "restored" on empty state) */
function hasContent(s: WizardState): boolean {
  const a = s.account;
  const d = s.details;
  return Boolean(
    a.name || a.nameJa || a.contact || a.email || a.phone || a.password ||
      d.citySlug || d.address || d.description || d.categories.length || d.keywords.length ||
      d.photos.length || d.products.length || d.jobs.length,
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function stepErrors(step: number, s: WizardState, t: (k: string) => string): string[] {
  const e: string[] = [];
  if (step === 1) {
    if (!s.account.name.trim()) e.push(t('errBusinessName'));
    if (!s.account.contact.trim()) e.push(t('errYourName'));
    if (!emailOk(s.account.email)) e.push(t('errValidEmail'));
    if (!s.account.phone.trim()) e.push(t('errPhone'));
    if (s.account.password.length < 8) e.push(t('errPassword'));
  }
  if (step === 2) {
    if (!s.details.citySlug) e.push(t('errCity'));
    if (!s.details.address.trim()) e.push(t('errAddress'));
    if (s.details.categories.length === 0) e.push(t('errCategory'));
    if (!s.details.description.trim() || s.details.description.trim().length < 20)
      e.push(t('errDescription'));
  }
  if (step === 3) {
    const digits = s.payment.cardNumber.replace(/\s/g, '');
    if (!s.payment.cardName.trim()) e.push(t('errCardName'));
    if (digits.length < 15) e.push(t('errCardNumber'));
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(s.payment.expiry)) e.push(t('errExpiry'));
    if (!/^\d{3,4}$/.test(s.payment.cvc)) e.push(t('errCvc'));
  }
  return e;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function GetListedClient() {
  const params = useSearchParams();
  const { data: session } = useSession();
  const t = useTranslations('wizard');
  const tc = useTranslations('common');
  const initialPlan = (LISTING_PLANS.some((p) => p.id === params.get('plan')) ? params.get('plan') : 'premium') as PlanId;

  const STEPS = [t('stepChoosePlan'), t('stepCreateAccount'), t('stepCompanyDetails'), t('stepPayment'), t('stepReview')];

  const [state, dispatch] = useReducer(reducer, initialPlan, initialState);
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [restored, setRestored] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [stripeCanceled, setStripeCanceled] = useState(false);
  const [stripeReference, setStripeReference] = useState<{ id: number; name: string; email: string } | null>(null);

  // Returning from Stripe: ?paid=1&ref=<draftId> means payment succeeded and
  // the webhook is converting the draft into a real listing right now (or
  // already has). Poll briefly rather than trusting the query string outright
  // — the businessId only ever comes from the server. ?canceled=1 just clears
  // itself; the wizard resumes from the localStorage-restored draft below.
  useEffect(() => {
    if (params.get('canceled') === '1') { setStripeCanceled(true); return; }
    const ref = params.get('ref');
    if (params.get('paid') !== '1' || !ref) return;

    setConfirmingPayment(true);
    let cancelled = false;
    let tries = 0;
    const poll = async () => {
      if (cancelled) return;
      tries += 1;
      const res = await fetch(`/api/listings/draft?id=${ref}`);
      const data = (await res.json().catch(() => null)) as { status?: string; businessId?: number; name?: string; email?: string } | null;
      if (data?.status === 'COMPLETED' && data.businessId) {
        setStripeReference({ id: data.businessId, name: data.name ?? '', email: data.email ?? '' });
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        setConfirmingPayment(false);
        return;
      }
      if (tries < 10) setTimeout(poll, 1500);
      else setConfirmingPayment(false); // give up politely; webhook may just be slow
    };
    void poll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore saved progress on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { state: WizardState; step: number; maxReached: number };
        if (saved.state && !saved.state.reference && hasContent(saved.state)) {
          dispatch({ type: 'replace', value: saved.state });
          setStep(saved.step ?? 0);
          setMaxReached(saved.maxReached ?? 0);
          setRestored(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist progress between steps (spec: “save progress between steps”). Only
  // after mount/restore has settled, and only once there's real content to save.
  useEffect(() => {
    if (!hydrated || state.reference) return;
    try {
      if (hasContent(state)) localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, step, maxReached }));
    } catch {}
  }, [hydrated, state, step, maxReached]);

  const errors = useMemo(() => stepErrors(step, state, t), [step, state, t]);
  const canAdvance = errors.length === 0;

  function goTo(target: number) {
    if (target <= maxReached) {
      setShowErrors(false);
      setStep(target);
    }
  }

  function next() {
    if (!canAdvance) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    const n = Math.min(step + 1, STEPS.length - 1);
    setStep(n);
    setMaxReached((m) => Math.max(m, n));
  }

  async function submit() {
    setProcessing(true);
    try {
      // 1) Create (or sign into) the business account, so the listing we're
      //    about to create is owned by this user from the start.
      if (!session?.user) {
        const reg = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: state.account.contact, email: state.account.email, password: state.account.password, role: 'OWNER' }),
        });
        if (!reg.ok && reg.status !== 409) {
          const d = (await reg.json().catch(() => null)) as { error?: string } | null;
          throw new Error(d?.error ?? 'Could not create your account.');
        }
        // 409 = email already registered — try signing in with the password
        // they entered (covers a returning owner filling the form again).
        const signed = await nextSignIn('credentials', { email: state.account.email, password: state.account.password, redirect: false });
        if (signed?.error) {
          throw new Error(
            reg.status === 409
              ? 'An account with this email already exists and the password doesn’t match. Sign in first, or use a different email.'
              : 'Account created, but automatic sign-in failed. Please sign in manually.',
          );
        }
      }

      // 2) Stash the listing details as a draft. The webhook (or the
      //    simulated path below) is what actually creates the Business —
      //    never this request directly — so an abandoned payment never
      //    produces a listing.
      const draftRes = await fetch('/api/listings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: state.plan,
          name: state.account.name,
          nameJa: state.account.nameJa,
          email: state.account.email,
          phone: state.account.phone,
          citySlug: state.details.citySlug,
          address: state.details.address,
          addressJa: state.details.addressJa,
          website: state.details.website,
          description: state.details.description,
          established: state.details.established,
          employees: state.details.employees,
          categories: state.details.categories,
          keywords: state.details.keywords,
          hours: state.details.hours,
          products: state.details.products,
          jobs: state.details.jobs,
        }),
      });
      const draftData = (await draftRes.json().catch(() => null)) as { ok?: boolean; draftId?: string; error?: string } | null;
      if (!draftRes.ok || !draftData?.ok || !draftData.draftId) throw new Error(draftData?.error ?? 'Could not save your details.');

      // 3) Payment. Real Stripe test-mode Checkout when STRIPE_SECRET_KEY is
      //    configured (redirects to Stripe; the webhook converts the draft
      //    once payment succeeds). Simulated charge converts it immediately.
      const pay = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: state.plan, email: state.account.email, draftId: draftData.draftId }),
      });
      const payData = (await pay.json().catch(() => null)) as { url?: string; simulated?: boolean; id?: number; error?: string } | null;
      if (!pay.ok) throw new Error(payData?.error ?? 'Payment failed.');
      if (payData?.url) {
        window.location.href = payData.url; // Stripe-hosted checkout takes over
        return;
      }

      dispatch({ type: 'set', path: 'reference', value: `NP-${payData?.id}` });
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setProcessing(false);
    }
  }

  if (confirmingPayment) return <ConfirmingPayment />;
  if (stripeReference) {
    return (
      <Confirmation
        reference={`NP-${stripeReference.id}`}
        planId={state.plan}
        contact={state.account.contact}
        business={stripeReference.name || state.account.name}
        email={stripeReference.email || state.account.email}
      />
    );
  }
  if (state.reference) {
    return (
      <Confirmation
        reference={state.reference}
        planId={state.plan}
        contact={state.account.contact}
        business={state.account.name}
        email={state.account.email}
      />
    );
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('title') }]} />
      <header className="mb-6 mt-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 max-w-xl text-ink-soft">{t('subtitle')}</p>
        {stripeCanceled && (
          <p className="mt-3 rounded-sm bg-warn/15 px-3 py-1.5 text-sm text-warn">{t('paymentCanceled')}</p>
        )}
        {restored && step === 0 && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-sm bg-indigo-wash px-3 py-1.5 text-sm text-indigo">
            ↩︎ {t('restoredNotice')}
            <button onClick={() => { try { localStorage.removeItem(STORAGE_KEY); } catch {}; window.location.reload(); }} className="font-semibold underline">{t('startOver')}</button>
          </p>
        )}
      </header>

      {/* Stepper */}
      <ol className="mb-8 flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const reachable = i <= maxReached;
          return (
            <li key={s}>
              <button
                onClick={() => goTo(i)}
                disabled={!reachable}
                className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                  active ? 'border-seal bg-seal-wash text-seal-ink'
                    : done ? 'border-rule bg-panel text-ink hover:border-[#c9c8bf]'
                    : 'border-rule bg-panel text-meta'
                } ${reachable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <span className={`tnum grid h-5 w-5 place-items-center rounded-full text-2xs font-bold ${active ? 'bg-seal text-white' : done ? 'bg-ok text-white' : 'bg-[#ecebe4] text-meta'}`}>
                  {done ? '✓' : i + 1}
                </span>
                {s}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          {showErrors && errors.length > 0 && (
            <div className="mb-5 rounded-md border border-seal/40 bg-seal-wash/60 p-4" role="alert">
              <p className="text-sm font-semibold text-seal-ink">{t('fixFollowing')}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-seal-ink">
                {errors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          )}

          {step === 0 && <PlanStep state={state} dispatch={dispatch} />}
          {step === 1 && <AccountStep state={state} dispatch={dispatch} />}
          {step === 2 && <DetailsStep state={state} dispatch={dispatch} />}
          {step === 3 && <PaymentStep state={state} dispatch={dispatch} />}
          {step === 4 && <ReviewStep state={state} goTo={goTo} />}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between border-t border-rule pt-5">
            <button onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0} className="btn btn-secondary disabled:opacity-40">← {t('back')}</button>
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="btn btn-primary">
                {step === 0 ? t('continue') : t('saveContinue')} →
              </button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                {submitError && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">{submitError}</p>}
                <button onClick={submit} disabled={processing} className="btn btn-primary disabled:opacity-60">
                  {processing ? t('processing') : t('submitForReview')}
                </button>
              </div>
            )}
          </div>
        </div>

        <aside>
          <div className="panel sticky top-24 p-5">
            <h2 className="eyebrow mb-3">{t('yourOrder')}</h2>
            <OrderSummary planId={state.plan} />
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------
type StepProps = { state: WizardState; dispatch: React.Dispatch<Action> };

function PlanStep({ state, dispatch }: StepProps) {
  const t = useTranslations('wizard');
  return (
    <section>
      <h2 className="mb-4 font-display text-xl font-bold text-ink">{t('step1Title')}</h2>
      <div className="space-y-3">
        {LISTING_PLANS.map((p) => {
          const on = state.plan === p.id;
          return (
            <button key={p.id} onClick={() => dispatch({ type: 'plan', value: p.id })}
              className={`flex w-full items-center gap-4 rounded-md border p-4 text-left transition-colors ${on ? 'border-seal ring-1 ring-seal/25' : 'border-rule hover:border-[#c9c8bf]'}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-seal' : 'border-rule'}`}>
                {on && <span className="h-2.5 w-2.5 rounded-full bg-seal" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-display font-bold text-ink">{p.name}</span>
                  {p.highlighted && <span className="rounded-sm bg-seal px-1.5 py-0.5 text-2xs font-bold uppercase text-white">{t('popular')}</span>}
                </span>
                <span className="block text-sm text-ink-soft">{p.tagline}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="tnum block font-display text-xl font-extrabold text-ink">{usd(p.price)}</span>
                <span className="text-2xs text-meta">{p.cadence}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', jp, required, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; jp?: boolean; required?: boolean; hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}{required && <span className="text-seal"> *</span>}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo ${jp ? 'font-jp' : ''}`} />
      {hint && <span className="mt-1 block text-xs text-meta">{hint}</span>}
    </label>
  );
}

function AccountStep({ state, dispatch }: StepProps) {
  const t = useTranslations('wizard');
  const set = (path: string) => (v: string) => dispatch({ type: 'set', path, value: v });
  return (
    <section>
      <h2 className="mb-4 font-display text-xl font-bold text-ink">{t('step2Title')}</h2>
      <div className="panel grid gap-4 p-5 sm:grid-cols-2">
        <Field label={t('businessName')} required value={state.account.name} onChange={set('account.name')} placeholder="e.g. Tanaka Shokudō" />
        <Field label={t('businessNameJa')} jp value={state.account.nameJa} onChange={set('account.nameJa')} placeholder="田中食堂" />
        <Field label={t('yourName')} required value={state.account.contact} onChange={set('account.contact')} placeholder={t('yourNamePlaceholder')} />
        <Field label={t('email')} required type="email" value={state.account.email} onChange={set('account.email')} placeholder="you@business.jp" />
        <Field label={t('phone')} required value={state.account.phone} onChange={set('account.phone')} placeholder="03-1234-5678" />
        <Field label={t('password')} required type="password" value={state.account.password} onChange={set('account.password')} placeholder={t('passwordPlaceholder')} hint={t('passwordHint')} />
      </div>
      <p className="mt-3 text-xs text-meta">{t('alreadyListed')} <Link href="/claim" className="link">{t('claimExistingProfile')}</Link> {t('insteadOfDuplicate')}</p>
    </section>
  );
}

function DetailsStep({ state, dispatch }: StepProps) {
  const t = useTranslations('wizard');
  const locale = useLocale();
  const ja = locale === 'ja';
  const d = state.details;
  const lim = PLAN_LIMITS[state.plan];
  const set = (path: string) => (v: string) => dispatch({ type: 'set', path, value: v });

  const toggleCategory = (slug: string) => {
    const has = d.categories.includes(slug);
    if (has) dispatch({ type: 'set', path: 'details.categories', value: d.categories.filter((c) => c !== slug) });
    else if (d.categories.length < lim.categories) dispatch({ type: 'set', path: 'details.categories', value: [...d.categories, slug] });
  };

  return (
    <section className="space-y-6">
      <h2 className="font-display text-xl font-bold text-ink">{t('step3Title')}</h2>

      <div className="panel grid gap-4 p-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">{t('city')} <span className="text-seal">*</span></span>
          <select value={d.citySlug} onChange={(e) => set('details.citySlug')(e.target.value)} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo">
            <option value="">{t('selectCity')}</option>
            {CITIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}（{c.nameJa}）</option>)}
          </select>
        </label>
        <Field label={t('streetAddress')} required value={d.address} onChange={set('details.address')} placeholder="Ginza 1-2-3" />
        <Field label={t('addressJa')} jp value={d.addressJa} onChange={set('details.addressJa')} placeholder="銀座1-2-3" />
        <Field label={t('website')} value={d.website} onChange={set('details.website')} placeholder="https://…" />
        <Field label={t('publicEmail')} type="email" value={d.publicEmail} onChange={set('details.publicEmail')} placeholder="info@business.jp" />
        <Field label={t('yearEstablished')} value={d.established} onChange={set('details.established')} placeholder="1998" />
        <Field label={t('employees')} value={d.employees} onChange={set('details.employees')} placeholder="12" />
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">{t('description')} <span className="text-seal">*</span></span>
          <textarea value={d.description} onChange={(e) => set('details.description')(e.target.value)} rows={3} placeholder={t('descriptionPlaceholder')} className="w-full rounded-md border border-rule bg-panel p-3 text-sm focus:outline-none focus-visible:border-indigo" />
          <span className="mt-1 block text-xs text-meta">{t('charsMinimum', { count: d.description.trim().length })}</span>
        </label>
      </div>

      {/* Categories — enforced to the plan's slot count */}
      <LimitBlock title={t('categories')} used={d.categories.length} limit={lim.categories}>
        <div className="space-y-3">
          {CATEGORY_GROUPS.map((g) => {
            const cats = CATEGORIES.filter((c) => c.group === g.key);
            return (
              <div key={g.key}>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <span className="h-2 w-2 rounded-full" style={{ background: g.hue }} />{ja ? g.nameJa : g.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cats.map((c) => {
                    const on = d.categories.includes(c.slug);
                    const full = !on && d.categories.length >= lim.categories;
                    return (
                      <button key={c.slug} onClick={() => toggleCategory(c.slug)} disabled={full}
                        className={`rounded-sm border px-2 py-1 text-xs font-medium transition-colors ${on ? 'border-transparent text-white' : full ? 'border-rule text-meta opacity-50' : 'border-rule text-ink-soft hover:border-[#c9c8bf]'}`}
                        style={on ? { background: g.hue } : undefined}>
                        {ja ? c.nameJa : c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </LimitBlock>

      <ChipBlock title={t('keywords')} hint={t('keywordsHint')} used={d.keywords.length} limit={lim.keywords}
        items={d.keywords} placeholder={t('keywordPlaceholder')}
        onAdd={(v) => dispatch({ type: 'set', path: 'details.keywords', value: [...d.keywords, v] })}
        onRemove={(i) => dispatch({ type: 'set', path: 'details.keywords', value: d.keywords.filter((_, x) => x !== i) })} />

      <ChipBlock title={t('photos')} hint={t('photosHint')} used={d.photos.length} limit={lim.photos}
        items={d.photos} placeholder={t('photoPlaceholder')} mono
        onAdd={(v) => dispatch({ type: 'set', path: 'details.photos', value: [...d.photos, v] })}
        onRemove={(i) => dispatch({ type: 'set', path: 'details.photos', value: d.photos.filter((_, x) => x !== i) })} />

      <ProductsBlock state={state} dispatch={dispatch} limit={lim.products} />
      <JobsBlock state={state} dispatch={dispatch} limit={lim.jobs} />
      <HoursBlock state={state} dispatch={dispatch} />
    </section>
  );
}

function LimitBlock({ title, used, limit, children }: { title: string; used: number; limit: number; children: React.ReactNode }) {
  const t = useTranslations('wizard');
  const full = used >= limit;
  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-bold text-ink">{title}</h3>
        <span className={`tnum rounded-sm px-2 py-0.5 text-xs font-semibold ${full ? 'bg-warn/15 text-warn' : 'bg-[#f1f0ea] text-meta'}`}>{t('usedOf', { used, limit })}</span>
      </div>
      {children}
    </div>
  );
}

function ChipBlock({ title, hint, used, limit, items, placeholder, mono, onAdd, onRemove }: {
  title: string; hint: string; used: number; limit: number; items: string[]; placeholder: string; mono?: boolean;
  onAdd: (v: string) => void; onRemove: (i: number) => void;
}) {
  const t = useTranslations('wizard');
  const [val, setVal] = useState('');
  const full = used >= limit;
  const add = () => { const v = val.trim(); if (v && !full) { onAdd(v); setVal(''); } };
  return (
    <LimitBlock title={title} used={used} limit={limit}>
      <p className="-mt-1 mb-2 text-xs text-meta">{hint}</p>
      <div className="flex gap-2">
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={full ? t('limitReached') : placeholder} disabled={full}
          className={`flex-1 rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo ${mono ? 'font-mono' : ''}`} />
        <button onClick={add} disabled={full || !val.trim()} className="btn btn-secondary disabled:opacity-40">{t('add')}</button>
      </div>
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <span key={i} className={`inline-flex items-center gap-1.5 rounded-sm bg-[#f1f0ea] px-2 py-1 text-xs text-ink ${mono ? 'font-mono max-w-full truncate' : ''}`}>
              <span className="truncate">{it}</span>
              <button onClick={() => onRemove(i)} aria-label={t('remove', { item: it })} className="text-meta hover:text-seal">✕</button>
            </span>
          ))}
        </div>
      )}
    </LimitBlock>
  );
}

function ProductsBlock({ state, dispatch, limit }: StepProps & { limit: number }) {
  const t = useTranslations('wizard');
  const products = state.details.products;
  const full = products.length >= limit;
  const [draft, setDraft] = useState<ProductDraft>({ name: '', price: '', blurb: '' });
  const add = () => {
    if (!draft.name.trim() || full) return;
    dispatch({ type: 'set', path: 'details.products', value: [...products, draft] });
    setDraft({ name: '', price: '', blurb: '' });
  };
  return (
    <LimitBlock title={t('productsServices')} used={products.length} limit={limit}>
      <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={t('productName')} disabled={full} className="rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
        <input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/\D/g, '') })} placeholder={t('productPrice')} disabled={full} className="tnum rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
        <button onClick={add} disabled={full || !draft.name.trim()} className="btn btn-secondary disabled:opacity-40">{t('add')}</button>
      </div>
      {products.length > 0 && (
        <ul className="mt-3 divide-y divide-rule">
          {products.map((p, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-ink">{p.name}</span>
              <span className="flex items-center gap-3">
                <span className="tnum font-mono text-ink-soft">{p.price ? yen(Number(p.price)) : '—'}</span>
                <button onClick={() => dispatch({ type: 'set', path: 'details.products', value: products.filter((_, x) => x !== i) })} className="text-meta hover:text-seal">✕</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </LimitBlock>
  );
}

function JobsBlock({ state, dispatch, limit }: StepProps & { limit: number }) {
  const t = useTranslations('wizard');
  const jobs = state.details.jobs;
  const full = jobs.length >= limit;
  const [draft, setDraft] = useState<JobDraft>({ title: '', type: 'Full-time', salaryMin: '', salaryMax: '' });
  const add = () => {
    if (!draft.title.trim() || full) return;
    dispatch({ type: 'set', path: 'details.jobs', value: [...jobs, draft] });
    setDraft({ title: '', type: 'Full-time', salaryMin: '', salaryMax: '' });
  };
  return (
    <LimitBlock title={t('jobOffers')} used={jobs.length} limit={limit}>
      <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={t('jobTitle')} disabled={full} className="rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
        <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as JobDraft['type'] })} disabled={full} className="rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo">
          <option value="Full-time">{t('fullTime')}</option><option value="Part-time">{t('partTime')}</option><option value="Contract">{t('contract')}</option>
        </select>
        <button onClick={add} disabled={full || !draft.title.trim()} className="btn btn-secondary disabled:opacity-40">{t('add')}</button>
      </div>
      {jobs.length > 0 && (
        <ul className="mt-3 divide-y divide-rule">
          {jobs.map((j, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-ink">{j.title} <span className="text-2xs text-meta">· {j.type}</span></span>
              <button onClick={() => dispatch({ type: 'set', path: 'details.jobs', value: jobs.filter((_, x) => x !== i) })} className="text-meta hover:text-seal">✕</button>
            </li>
          ))}
        </ul>
      )}
    </LimitBlock>
  );
}

function HoursBlock({ state, dispatch }: StepProps) {
  const t = useTranslations('wizard');
  const th = useTranslations('hours');
  const hours = state.details.hours;
  return (
    <div className="panel p-5">
      <h3 className="mb-3 font-display font-bold text-ink">{t('openingHours')}</h3>
      <div className="space-y-1.5">
        {DAYS.map((day) => {
          const h = hours[day];
          return (
            <div key={day} className="flex items-center gap-3">
              <span className="tnum w-14 text-sm font-medium text-ink">{th(day)}</span>
              <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                <input type="checkbox" checked={h.closed} onChange={(e) => dispatch({ type: 'set', path: `details.hours.${day}.closed`, value: e.target.checked })} />
                {t('closed')}
              </label>
              {!h.closed && (
                <div className="flex items-center gap-2">
                  <input type="time" value={h.open} onChange={(e) => dispatch({ type: 'set', path: `details.hours.${day}.open`, value: e.target.value })} className="tnum rounded-md border border-rule bg-panel px-2 py-1 text-sm" />
                  <span className="text-meta">–</span>
                  <input type="time" value={h.close} onChange={(e) => dispatch({ type: 'set', path: `details.hours.${day}.close`, value: e.target.value })} className="tnum rounded-md border border-rule bg-panel px-2 py-1 text-sm" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaymentStep({ state, dispatch }: StepProps) {
  const t = useTranslations('wizard');
  const plan = LISTING_PLANS.find((p) => p.id === state.plan)!;
  const set = (path: string) => (v: string) => dispatch({ type: 'set', path, value: v });
  const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v: string) => { const x = v.replace(/\D/g, '').slice(0, 4); return x.length > 2 ? `${x.slice(0, 2)}/${x.slice(2)}` : x; };
  return (
    <section>
      <h2 className="mb-4 font-display text-xl font-bold text-ink">{t('step4Title')}</h2>
      <div className="mb-4 flex items-start gap-2 rounded-md border border-indigo/30 bg-indigo-wash/60 p-3 text-sm text-indigo">
        <span aria-hidden>🔒</span>
        <p><span className="font-semibold">{t('stripeTestMode')}</span> {t('stripeTestBody')}</p>
      </div>
      <div className="panel grid gap-4 p-5">
        <Field label={t('nameOnCard')} required value={state.payment.cardName} onChange={set('payment.cardName')} placeholder={t('nameOnCardPlaceholder')} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">{t('cardNumber')} <span className="text-seal">*</span></span>
          <input inputMode="numeric" value={state.payment.cardNumber} onChange={(e) => set('payment.cardNumber')(fmtCard(e.target.value))} placeholder="4242 4242 4242 4242" className="tnum w-full rounded-md border border-rule bg-panel px-3 py-2 font-mono text-sm focus:outline-none focus-visible:border-indigo" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">{t('expiry')} <span className="text-seal">*</span></span>
            <input inputMode="numeric" value={state.payment.expiry} onChange={(e) => set('payment.expiry')(fmtExp(e.target.value))} placeholder="MM/YY" className="tnum w-full rounded-md border border-rule bg-panel px-3 py-2 font-mono text-sm focus:outline-none focus-visible:border-indigo" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">{t('cvc')} <span className="text-seal">*</span></span>
            <input inputMode="numeric" value={state.payment.cvc} onChange={(e) => set('payment.cvc')(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" className="tnum w-full rounded-md border border-rule bg-panel px-3 py-2 font-mono text-sm focus:outline-none focus-visible:border-indigo" />
          </label>
        </div>
        <div className="flex items-center justify-between border-t border-rule pt-4 text-sm">
          <span className="text-ink-soft">{plan.name} · {plan.cadence === 'per year' ? t('renewsYearly') : t('oneTime')}</span>
          <span className="tnum font-display text-xl font-extrabold text-ink">{usd(plan.price)}</span>
        </div>
      </div>
    </section>
  );
}

function ReviewStep({ state, goTo }: { state: WizardState; goTo: (n: number) => void }) {
  const t = useTranslations('wizard');
  const locale = useLocale();
  const ja = locale === 'ja';
  const plan = LISTING_PLANS.find((p) => p.id === state.plan)!;
  const d = state.details;
  const cityName = CITIES.find((c) => c.slug === d.citySlug)?.name ?? '—';
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="flex justify-between gap-4 border-b border-rule py-2 text-sm last:border-0">
      <dt className="text-meta">{k}</dt><dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
  return (
    <section>
      <h2 className="mb-4 font-display text-xl font-bold text-ink">{t('step5Title')}</h2>
      <div className="space-y-4">
        <ReviewCard title={t('plan')} onEdit={() => goTo(0)}>
          <dl><Row k={t('plan')} v={`${plan.name} · ${usd(plan.price)} ${plan.cadence}`} /></dl>
        </ReviewCard>
        <ReviewCard title={t('account')} onEdit={() => goTo(1)}>
          <dl>
            <Row k={t('business')} v={<>{state.account.name}{state.account.nameJa && <span className="font-jp text-meta"> · {state.account.nameJa}</span>}</>} />
            <Row k={t('contact')} v={state.account.contact} />
            <Row k={t('email')} v={state.account.email} />
            <Row k={t('phone')} v={<span className="tnum">{state.account.phone}</span>} />
          </dl>
        </ReviewCard>
        <ReviewCard title={t('companyDetails')} onEdit={() => goTo(2)}>
          <dl>
            <Row k={t('city2')} v={cityName} />
            <Row k={t('address')} v={d.address || '—'} />
            <Row k={t('categoriesLabel')} v={d.categories.length ? d.categories.map((s) => { const c = CATEGORIES.find((x) => x.slug === s); return c ? (ja ? c.nameJa : c.name) : s; }).join(', ') : '—'} />
            <Row k={t('keywordsLabel')} v={d.keywords.length || '—'} />
            <Row k={t('photosLabel')} v={d.photos.length || '—'} />
            <Row k={t('productsLabel')} v={d.products.length || '—'} />
            <Row k={t('jobOffersLabel')} v={d.jobs.length || '—'} />
          </dl>
        </ReviewCard>
        <ReviewCard title={t('payment')} onEdit={() => goTo(3)}>
          <dl>
            <Row k={t('card')} v={<span className="tnum">•••• {state.payment.cardNumber.replace(/\s/g, '').slice(-4) || '••••'}</span>} />
            <Row k={t('total')} v={<span className="tnum font-bold">{usd(plan.price)} {plan.cadence}</span>} />
          </dl>
        </ReviewCard>
        <p className="text-xs text-meta">{t('agreeTerms')} <Link href="/legal/terms-of-service" className="link">{t('termsOfService')}</Link>. {t('moderationNote')}</p>
      </div>
    </section>
  );
}

function ReviewCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  const t = useTranslations('wizard');
  return (
    <div className="panel p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display font-bold text-ink">{title}</h3>
        <button onClick={onEdit} className="link text-sm font-semibold">{t('edit')}</button>
      </div>
      {children}
    </div>
  );
}

function Confirmation({ reference, planId, contact, business, email }: {
  reference: string; planId: PlanId; contact: string; business: string; email: string;
}) {
  const t = useTranslations('wizard');
  const plan = LISTING_PLANS.find((p) => p.id === planId)!;
  return (
    <div className="shell py-16">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok/10">
          <svg viewBox="0 0 24 24" width="34" height="34" className="text-ok" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-ink">{t('submittedForReview')}</h1>
        <p className="mt-2 text-ink-soft">{t('thanksBody', { name: contact.split(' ')[0] || t('there'), business, email })}</p>
        <div className="panel mt-6 p-5 text-left">
          <div className="flex justify-between border-b border-rule py-2 text-sm"><span className="text-meta">{t('reference')}</span><span className="tnum font-mono font-semibold text-ink">{reference}</span></div>
          <div className="flex justify-between border-b border-rule py-2 text-sm"><span className="text-meta">{t('plan')}</span><span className="font-medium text-ink">{plan.name} · {usd(plan.price)} {plan.cadence}</span></div>
          <div className="flex justify-between py-2 text-sm"><span className="text-meta">{t('paymentDone')}</span><span className="tnum font-medium text-ok">{t('paidTestMode')}</span></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/account" className="btn btn-primary">{t('goToDashboard2')}</Link>
          <Link href="/" className="btn btn-secondary">{t('backToHome')}</Link>
        </div>
      </div>
    </div>
  );
}

function ConfirmingPayment() {
  const t = useTranslations('wizard');
  return (
    <div className="shell py-16 text-center">
      <div className="mx-auto max-w-md">
        <div className="skeleton mx-auto h-16 w-16 rounded-full" />
        <p className="mt-5 text-ink-soft">{t('confirmingPayment')}</p>
      </div>
    </div>
  );
}

function OrderSummary({ planId }: { planId: PlanId }) {
  const t = useTranslations('wizard');
  const plan = LISTING_PLANS.find((p) => p.id === planId)!;
  const lim = PLAN_LIMITS[planId];
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-lg font-bold text-ink">{plan.name}</span>
        <span className="tnum font-display text-2xl font-extrabold text-ink">{usd(plan.price)}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm">
        <span className="tnum text-meta line-through">{usd(plan.wasPrice)}</span>
        <span className="rounded-sm bg-seal-wash px-1.5 py-0.5 text-2xs font-bold uppercase text-seal-ink">{t('offBadge')}</span>
        <span className="text-meta">{plan.cadence}</span>
      </div>
      <ul className="mt-4 space-y-2 border-t border-rule pt-4 text-sm">
        <li className="flex justify-between"><span className="text-ink-soft">{t('categorySlots')}</span><span className="tnum font-medium text-ink">{lim.categories}</span></li>
        <li className="flex justify-between"><span className="text-ink-soft">{t('keywords')}</span><span className="tnum font-medium text-ink">{lim.keywords}</span></li>
        <li className="flex justify-between"><span className="text-ink-soft">{t('photos')}</span><span className="tnum font-medium text-ink">{lim.photos}</span></li>
        <li className="flex justify-between"><span className="text-ink-soft">{t('productsLabel')}</span><span className="tnum font-medium text-ink">{lim.products}</span></li>
        <li className="flex justify-between"><span className="text-ink-soft">{t('jobOffersLabel')}</span><span className="tnum font-medium text-ink">{lim.jobs}</span></li>
      </ul>
    </div>
  );
}
