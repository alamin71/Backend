import { Types } from 'mongoose';
import { Session } from '../session/session.model';

type FilterPeriod = 'last7days' | 'last15days' | 'last30days';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatSeconds = (totalSec: number) => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  return { hours: h, minutes: m, seconds: s, formatted: `${h}h ${m}m ${s}s` };
};

const buildDailyChart = (
  dbRows: { _id: string; storageSavedMB: number; timeSavedSec: number }[],
  startDate: Date,
  days: number
) => {
  const rowMap: Record<string, { storageSavedMB: number; timeSavedSec: number }> = {};
  dbRows.forEach((r) => (rowMap[r._id] = r));

  const storageChart: { date: string; day: string; storageSavedMB: number }[] = [];
  const timeChart: { date: string; day: string; timeSavedSec: number }[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const dayLabel = DAY_LABELS[d.getDay()];
    const row = rowMap[key];

    storageChart.push({ date: key, day: dayLabel, storageSavedMB: row?.storageSavedMB ?? 0 });
    timeChart.push({ date: key, day: dayLabel, timeSavedSec: row?.timeSavedSec ?? 0 });
  }

  return { storageChart, timeChart };
};

export const getStatsFromDB = async (
  userId: string | null,
  guestDeviceId: string | null,
  filter: FilterPeriod = 'last7days'
) => {
  const days = filter === 'last7days' ? 7 : filter === 'last15days' ? 15 : 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const userFilter: Record<string, any> = userId
    ? { user: new Types.ObjectId(userId) }
    : { guestDeviceId };

  const matchStage = { ...userFilter, createdAt: { $gte: startDate } };

  // 1. Savings overview
  const [overview, gripsDistRaw, dailyRaw] = await Promise.all([
    Session.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalGrips: { $sum: '$totalGripped' },
          storageSavedMB: { $sum: '$storageSavedMB' },
          timeSavedSec: { $sum: '$timeSavedSec' },
        },
      },
    ]),

    // 2. Grips duration distribution
    Session.aggregate([
      { $match: matchStage },
      { $unwind: '$grips' },
      {
        $group: {
          _id: null,
          grip15: { $sum: { $cond: [{ $lte: ['$grips.duration', 15] }, 1, 0] } },
          grip20: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$grips.duration', 15] }, { $lte: ['$grips.duration', 20] }] },
                1, 0,
              ],
            },
          },
          grip30: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$grips.duration', 20] }, { $lte: ['$grips.duration', 30] }] },
                1, 0,
              ],
            },
          },
          grip60: { $sum: { $cond: [{ $gt: ['$grips.duration', 30] }, 1, 0] } },
        },
      },
    ]),

    // 3. Daily breakdown for charts
    Session.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          storageSavedMB: { $sum: '$storageSavedMB' },
          timeSavedSec: { $sum: '$timeSavedSec' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Build savings overview
  const ov = overview[0] ?? { totalGrips: 0, storageSavedMB: 0, timeSavedSec: 0 };
  const savingsOverview = {
    totalGrips: ov.totalGrips,
    storageSavedGB: parseFloat((ov.storageSavedMB / 1024).toFixed(2)),
    timeSaved: formatSeconds(ov.timeSavedSec),
  };

  // Build grips stat
  const gd = gripsDistRaw[0] ?? { grip15: 0, grip20: 0, grip30: 0, grip60: 0, grip90:0, grip120:0  };
  const distribution = [
    { duration: '15s', count: gd.grip15 },
    { duration: '20s', count: gd.grip20 },
    { duration: '30s', count: gd.grip30 },
    { duration: '60s', count: gd.grip60 },
    { duration: '90s', count: gd.grip90 },
    { duration: '120s', count: gd.grip120 },
  ];
  const sorted = [...distribution].sort((a, b) => b.count - a.count);
  const gripsStat = {
    total: distribution.reduce((s, d) => s + d.count, 0),
    distribution,
    highest: sorted[0] ?? null,
    lowest: sorted[sorted.length - 1] ?? null,
  };

  // Build daily charts
  const { storageChart, timeChart } = buildDailyChart(
    dailyRaw.map((r) => ({ _id: r._id as string, storageSavedMB: r.storageSavedMB, timeSavedSec: r.timeSavedSec })),
    startDate,
    days
  );

  return { savingsOverview, gripsStat, storageSavedChart: storageChart, timeSavedChart: timeChart };
};
