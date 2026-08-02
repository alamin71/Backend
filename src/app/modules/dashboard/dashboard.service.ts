import { User } from '../user/user.model';
import { Guest } from '../guest/guest.model';
import { Session } from '../session/session.model';

type Filter = 'this_month' | 'this_week';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getDateRange = (filter: Filter) =>
  filter === 'this_week' ? getWeekStart() : getMonthStart();

const formatSeconds = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return { hours: h, minutes: m, seconds: s, formatted: `${h}H ${m}M ${s}S` };
};

const fillDailyChart = (
  rows: { _id: string; count: number }[],
  startDate: Date
) => {
  const now = new Date();
  const rowMap: Record<string, number> = {};
  rows.forEach((r) => (rowMap[r._id] = r.count));

  const result = [];
  const current = new Date(startDate);
  while (current <= now) {
    const key = current.toISOString().slice(0, 10);
    result.push({
      date: key,
      day: DAY_LABELS[current.getDay()],
      count: rowMap[key] ?? 0,
    });
    current.setDate(current.getDate() + 1);
  }
  return result;
};

export const getDashboardStats = async (params: {
  signupFilter?: Filter;
  userStatsFilter?: Filter;
  appUsageFilter?: Filter;
  clipFilter?: Filter;
}) => {
  const {
    signupFilter = 'this_month',
    userStatsFilter = 'this_month',
    appUsageFilter = 'this_week',
    clipFilter = 'this_month',
  } = params;

  const signupStart = getDateRange(signupFilter);
  const userStatsStart = getDateRange(userStatsFilter);
  const appUsageStart = getDateRange(appUsageFilter);
  const clipStart = getDateRange(clipFilter);

  const [
    platformSummary,
    signupRows,
    proCount,
    freeCount,
    guestCount,
    totalUserCount,
    totalSignups,
    appUsageRows,
    clipData,
    osStats,
  ] = await Promise.all([

    // 1. Platform summary — all time totals
    Session.aggregate([
      {
        $group: {
          _id: null,
          totalGripped: { $sum: '$totalGripped' },
          storageSavedMB: { $sum: '$storageSavedMB' },
          timeSavedSec: { $sum: '$timeSavedSec' },
        },
      },
    ]),

    // 2. Sign up overview — daily new user registrations
    User.aggregate([
      { $match: { createdAt: { $gte: signupStart }, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 3. User stats — pro
    User.countDocuments({ userType: 'pro', isDeleted: { $ne: true }, createdAt: { $gte: userStatsStart } }),

    // 4. User stats — free
    User.countDocuments({ userType: 'free', isDeleted: { $ne: true }, createdAt: { $gte: userStatsStart } }),

    // 5. User stats — guest
    Guest.countDocuments({ createdAt: { $gte: userStatsStart } }),

    // 6. Total users (pro + free)
    User.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: userStatsStart } }),

    // 7. Total signups all time
    User.countDocuments({ isDeleted: { $ne: true } }),

    // 8. App usage summary — daily session count
    Session.aggregate([
      { $match: { createdAt: { $gte: appUsageStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 9. Clip length stats — grip duration distribution
    Session.aggregate([
      { $match: { createdAt: { $gte: clipStart } } },
      { $unwind: '$grips' },
      {
        $group: {
          _id: null,
          s15:  { $sum: { $cond: [{ $lte: ['$grips.duration', 15] }, 1, 0] } },
          s20:  { $sum: { $cond: [{ $and: [{ $gt: ['$grips.duration', 15] }, { $lte: ['$grips.duration', 20] }] }, 1, 0] } },
          s30:  { $sum: { $cond: [{ $and: [{ $gt: ['$grips.duration', 20] }, { $lte: ['$grips.duration', 30] }] }, 1, 0] } },
          s60:  { $sum: { $cond: [{ $and: [{ $gt: ['$grips.duration', 30] }, { $lte: ['$grips.duration', 60] }] }, 1, 0] } },
          s90:  { $sum: { $cond: [{ $and: [{ $gt: ['$grips.duration', 60] }, { $lte: ['$grips.duration', 90] }] }, 1, 0] } },
          s120: { $sum: { $cond: [{ $gt: ['$grips.duration', 90] }, 1, 0] } },
        },
      },
    ]),

    // 10. OS stats
    User.aggregate([
      { $match: { isDeleted: { $ne: true }, createdAt: { $gte: userStatsStart } } },
      { $group: { _id: '$os', count: { $sum: 1 } } },
    ]),
  ]);

  // Platform summary
  const ps = platformSummary[0] ?? { totalGripped: 0, storageSavedMB: 0, timeSavedSec: 0 };
  const storageTB = parseFloat((ps.storageSavedMB / (1024 * 1024)).toFixed(2));
  const timeSavedHours = Math.floor(ps.timeSavedSec / 3600);

  // Clip length
  const cl = clipData[0] ?? { s15: 0, s20: 0, s30: 0, s60: 0, s90: 0, s120: 0 };

  // OS stats
  const osMap: Record<string, number> = {};
  osStats.forEach((o: { _id: string; count: number }) => { osMap[o._id] = o.count; });

  // Signup chart — bestDay + peak
  const signupChart = fillDailyChart(signupRows, signupStart);
  let bestDay = '';
  let peak = 0;
  signupChart.forEach((d) => {
    if (d.count > peak) { peak = d.count; bestDay = d.day; }
  });

  return {
    platformSummary: {
      liveBuffering: formatSeconds(ps.timeSavedSec),
      totalGripped: ps.totalGripped,
      storageSavedTB: storageTB,
      timeSavedHours,
    },

    signupOverview: {
      filter: signupFilter,
      totalSignups,
      bestDay,
      peak,
      chart: signupChart,
    },

    usersStats: {
      filter: userStatsFilter,
      total: totalUserCount + guestCount,
      proUser: proCount,
      freeUser: freeCount,
      guestUser: guestCount,
    },

    osStats: {
      filter: userStatsFilter,
      ios: osMap['ios'] ?? 0,
      android: osMap['android'] ?? 0,
    },

    appUsageSummary: {
      filter: appUsageFilter,
      chart: fillDailyChart(appUsageRows, appUsageStart),
    },

    clipLengthStats: {
      filter: clipFilter,
      distribution: [
        { duration: '15s', count: cl.s15 },
        { duration: '20s', count: cl.s20 },
        { duration: '30s', count: cl.s30 },
        { duration: '60s', count: cl.s60 },
        { duration: '90s', count: cl.s90 },
        { duration: '120s', count: cl.s120 },
      ],
    },
  };
};
