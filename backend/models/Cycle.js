// Cycle Model (Mock)
module.exports = [
  {
    id: 'cycle-1',
    groupId: 'group-1',
    cycleNumber: 1,
    targetPayoutMemberId: 'member-1',
    payoutConfirmed: true,
    payoutProofReferenceId: 'TXN-20250110-001',
    contributions: [
      {
        memberId: 'member-1',
        hasPaid: true,
        paymentDate: '2025-01-01',
        proofReferenceId: 'PROOF-2025-01-1',
        penaltyAmount: 0,
        penaltyReason: ''
      },
      // ...other members
    ]
  },
  // ...other cycles
];