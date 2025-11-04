// Group Model (Mock)
module.exports = {
  id: 'group-1',
  name: 'Community Savings Circle',
  currency: 'INR',
  monthlyAmount: 10000,
  startMonth: '2025-01-01',
  durationMonths: 12,
  rules: {
    gracePeriodDays: 2,
    lateFeeAmount: 100,
    defaultPenaltyType: 'fixed',
    sendReminders: true
  },
  payoutOrder: [
    'member-1','member-2','member-3','member-4','member-5','member-6','member-7','member-8','member-9','member-10','member-11','member-12'
  ],
  members: [
    'member-1','member-2','member-3','member-4','member-5','member-6','member-7','member-8','member-9','member-10','member-11','member-12'
  ],
  admin: 'member-1'
};