// Member Model (Mock)
module.exports = [
  {
    id: 'member-1',
    name: 'Asha Kumar',
    email: 'asha@example.com',
    passwordHash: 'hashed_pw',
    role: 'admin',
    contactNumber: '+91-9876543210',
    payoutAccount: {
      accountNumber: 'XXXX-1234',
      ifscCode: 'IFSC0001',
      accountHolderName: 'Asha Kumar'
    },
    emergencyContact: {
      name: 'Raj Kumar',
      phoneNumber: '+91-9876543211'
    },
    groups: ['group-1'],
    joinedAt: '2024-12-01'
  },
  // ...other members (same structure)
];