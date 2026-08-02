import { Types } from 'mongoose';
import { User } from '../user/user.model';
import { Guest } from '../guest/guest.model';
import { Session } from '../session/session.model';

type DateFilter = 'today' | 'yesterday' | 'this_week' | 'this_month';

const getDateRange = (filter?: DateFilter): Date | null => {
  if (!filter) return null;
  const now = new Date();
  switch (filter) {
    case 'today': {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
    }
    case 'yesterday': {
      const d = new Date(now); d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return d;
    }
    case 'this_week': {
      const d = new Date(now);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'this_month': {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    default: return null;
  }
};

const formatDuration = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}h ${m}m ${s}s`;
};

export const getAdminUsersFromDB = async (params: {
  filter?: DateFilter;
  search?: string;
  userType?: string;
  page: number;
  limit: number;
}) => {
  const { filter, search, userType, page, limit } = params;
  const skip = (page - 1) * limit;

  const dateFrom = getDateRange(filter);

  // Build base match for Users
  const userMatch: Record<string, any> = { isDeleted: { $ne: true } };
  if (dateFrom) userMatch.createdAt = { $gte: dateFrom };
  if (search) {
    userMatch.$or = [
      { name: { $regex: search, $options: 'i' } },
      { userName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (userType === 'pro') userMatch.userType = 'pro';
  if (userType === 'free') userMatch.userType = 'free';

  const showGuests = !userType || userType === 'all' || userType === 'guest';
  const showUsers = !userType || userType === 'all' || userType === 'pro' || userType === 'free';

  // Aggregate users with session stats
  const usersPipeline: any[] = [
    { $match: userMatch },
    {
      $lookup: {
        from: 'sessions',
        localField: '_id',
        foreignField: 'user',
        as: 'sessions',
      },
    },
    {
      $addFields: {
        highlightsGripped: { $sum: '$sessions.totalGripped' },
        storageSavedMB: { $sum: '$sessions.storageSavedMB' },
        highlightTimeSec: { $sum: '$sessions.timeSavedSec' },
        sessionLastSeen: { $max: '$sessions.createdAt' },
        role: 'user',
      },
    },
    {
      $project: {
        name: 1, userName: 1, email: 1, image: 1,
        userType: 1, verified: 1, status: 1, os: 1,
        createdAt: 1,
        lastSeen: { $ifNull: ['$lastSeen', '$sessionLastSeen'] },
        highlightsGripped: 1, storageSavedMB: 1, highlightTimeSec: 1,
        role: 1,
      },
    },
  ];

  // Build guest match
  const guestMatch: Record<string, any> = {};
  if (dateFrom) guestMatch.createdAt = { $gte: dateFrom };
  if (search) guestMatch.deviceId = { $regex: search, $options: 'i' };

  const guestsPipeline: any[] = [
    { $match: guestMatch },
    {
      $lookup: {
        from: 'sessions',
        localField: 'deviceId',
        foreignField: 'guestDeviceId',
        as: 'sessions',
      },
    },
    {
      $addFields: {
        name: { $concat: ['Guest_', { $substrCP: ['$deviceId', 0, 6] }] },
        userName: '',
        email: '',
        image: '',
        userType: 'guest',
        verified: false,
        status: 'active',
        os: '',
        highlightsGripped: { $sum: '$sessions.totalGripped' },
        storageSavedMB: { $sum: '$sessions.storageSavedMB' },
        highlightTimeSec: { $sum: '$sessions.timeSavedSec' },
        lastSeen: { $max: '$sessions.createdAt' },
        role: 'guest',
      },
    },
    {
      $project: {
        name: 1, userName: 1, email: 1, image: 1,
        userType: 1, verified: 1, status: 1, os: 1,
        createdAt: 1, lastSeen: 1,
        highlightsGripped: 1, storageSavedMB: 1, highlightTimeSec: 1,
        role: 1,
      },
    },
  ];

  const [userDocs, userTotal, guestDocs, guestTotal] = await Promise.all([
    showUsers ? User.aggregate(usersPipeline) : Promise.resolve([]),
    showUsers ? User.countDocuments(userMatch) : Promise.resolve(0),
    showGuests ? Guest.aggregate(guestsPipeline) : Promise.resolve([]),
    showGuests ? Guest.countDocuments(guestMatch) : Promise.resolve(0),
  ]);

  // Merge, sort by createdAt desc, paginate
  const combined = [...userDocs, ...guestDocs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const total = userTotal + guestTotal;
  const paginated = combined.slice(skip, skip + limit);

  const formatted = paginated.map((u, idx) => ({
    sl: skip + idx + 1,
    _id: u._id,
    name: u.name,
    userName: u.userName,
    email: u.email,
    image: u.image,
    userType: u.userType,
    verified: u.verified,
    status: u.status,
    os: u.os || '',
    role: u.role,
    joinDate: u.createdAt,
    lastSeen: u.lastSeen || null,
    highlightsGripped: u.highlightsGripped || 0,
    highlightTime: formatDuration(u.highlightTimeSec || 0),
    storageSaved: `${((u.storageSavedMB || 0) / 1024).toFixed(2)} GB`,
  }));

  return {
    users: formatted,
    pagination: { total, page, limit, totalPage: Math.ceil(total / limit) },
  };
};

export const AdminUserService = { getAdminUsersFromDB };
