export interface Holiday {
  date: string; // MM-DD or specific per year
  en: string;
  ja: string;
}

// National holidays (祝日). 2025–2027; Happy-Monday holidays vary by year.
export const HOLIDAYS: Record<number, Holiday[]> = {
  2025: [
    { date: '2025-01-01', en: "New Year's Day", ja: '元日' },
    { date: '2025-01-13', en: 'Coming of Age Day', ja: '成人の日' },
    { date: '2025-02-11', en: 'National Foundation Day', ja: '建国記念の日' },
    { date: '2025-02-23', en: "Emperor's Birthday", ja: '天皇誕生日' },
    { date: '2025-03-20', en: 'Vernal Equinox Day', ja: '春分の日' },
    { date: '2025-04-29', en: 'Shōwa Day', ja: '昭和の日' },
    { date: '2025-05-03', en: 'Constitution Memorial Day', ja: '憲法記念日' },
    { date: '2025-05-04', en: 'Greenery Day', ja: 'みどりの日' },
    { date: '2025-05-05', en: "Children's Day", ja: 'こどもの日' },
    { date: '2025-07-21', en: 'Marine Day', ja: '海の日' },
    { date: '2025-08-11', en: 'Mountain Day', ja: '山の日' },
    { date: '2025-09-15', en: 'Respect for the Aged Day', ja: '敬老の日' },
    { date: '2025-09-23', en: 'Autumnal Equinox Day', ja: '秋分の日' },
    { date: '2025-10-13', en: 'Sports Day', ja: 'スポーツの日' },
    { date: '2025-11-03', en: 'Culture Day', ja: '文化の日' },
    { date: '2025-11-23', en: 'Labour Thanksgiving Day', ja: '勤労感謝の日' },
  ],
  2026: [
    { date: '2026-01-01', en: "New Year's Day", ja: '元日' },
    { date: '2026-01-12', en: 'Coming of Age Day', ja: '成人の日' },
    { date: '2026-02-11', en: 'National Foundation Day', ja: '建国記念の日' },
    { date: '2026-02-23', en: "Emperor's Birthday", ja: '天皇誕生日' },
    { date: '2026-03-20', en: 'Vernal Equinox Day', ja: '春分の日' },
    { date: '2026-04-29', en: 'Shōwa Day', ja: '昭和の日' },
    { date: '2026-05-03', en: 'Constitution Memorial Day', ja: '憲法記念日' },
    { date: '2026-05-04', en: 'Greenery Day', ja: 'みどりの日' },
    { date: '2026-05-05', en: "Children's Day", ja: 'こどもの日' },
    { date: '2026-05-06', en: 'Substitute Holiday', ja: '振替休日' },
    { date: '2026-07-20', en: 'Marine Day', ja: '海の日' },
    { date: '2026-08-11', en: 'Mountain Day', ja: '山の日' },
    { date: '2026-09-21', en: 'Respect for the Aged Day', ja: '敬老の日' },
    { date: '2026-09-22', en: 'Citizens’ Holiday', ja: '国民の休日' },
    { date: '2026-09-23', en: 'Autumnal Equinox Day', ja: '秋分の日' },
    { date: '2026-10-12', en: 'Sports Day', ja: 'スポーツの日' },
    { date: '2026-11-03', en: 'Culture Day', ja: '文化の日' },
    { date: '2026-11-23', en: 'Labour Thanksgiving Day', ja: '勤労感謝の日' },
  ],
  2027: [
    { date: '2027-01-01', en: "New Year's Day", ja: '元日' },
    { date: '2027-01-11', en: 'Coming of Age Day', ja: '成人の日' },
    { date: '2027-02-11', en: 'National Foundation Day', ja: '建国記念の日' },
    { date: '2027-02-23', en: "Emperor's Birthday", ja: '天皇誕生日' },
    { date: '2027-03-21', en: 'Vernal Equinox Day', ja: '春分の日' },
    { date: '2027-03-22', en: 'Substitute Holiday', ja: '振替休日' },
    { date: '2027-04-29', en: 'Shōwa Day', ja: '昭和の日' },
    { date: '2027-05-03', en: 'Constitution Memorial Day', ja: '憲法記念日' },
    { date: '2027-05-04', en: 'Greenery Day', ja: 'みどりの日' },
    { date: '2027-05-05', en: "Children's Day", ja: 'こどもの日' },
    { date: '2027-07-19', en: 'Marine Day', ja: '海の日' },
    { date: '2027-08-11', en: 'Mountain Day', ja: '山の日' },
    { date: '2027-09-20', en: 'Respect for the Aged Day', ja: '敬老の日' },
    { date: '2027-09-23', en: 'Autumnal Equinox Day', ja: '秋分の日' },
    { date: '2027-10-11', en: 'Sports Day', ja: 'スポーツの日' },
    { date: '2027-11-03', en: 'Culture Day', ja: '文化の日' },
    { date: '2027-11-23', en: 'Labour Thanksgiving Day', ja: '勤労感謝の日' },
  ],
};

export const HOLIDAY_YEARS = Object.keys(HOLIDAYS).map(Number);
