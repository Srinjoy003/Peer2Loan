import React, { useState } from 'react';

const MemberEditForm = ({ member, onSuccess }) => {
  const [form, setForm] = useState(member);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('payoutAccount.')) {
      setForm({
        ...form,
        payoutAccount: {
          ...form.payoutAccount,
          [name.split('.')[1]]: value
        }
      });
    } else if (name.startsWith('emergencyContact.')) {
      setForm({
        ...form,
        emergencyContact: {
          ...form.emergencyContact,
          [name.split('.')[1]]: value
        }
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/members/${member._id || member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          groups: typeof form.groups === 'string' ? form.groups.split(',').map(g => g.trim()) : form.groups
        })
      });
      if (!res.ok) throw new Error('Failed to update member');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
      <input name="role" value={form.role} onChange={handleChange} placeholder="Role" />
      <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Contact Number" />
      <input name="payoutAccount.accountNumber" value={form.payoutAccount?.accountNumber || ''} onChange={handleChange} placeholder="Account Number" />
      <input name="payoutAccount.ifscCode" value={form.payoutAccount?.ifscCode || ''} onChange={handleChange} placeholder="IFSC Code" />
      <input name="payoutAccount.accountHolderName" value={form.payoutAccount?.accountHolderName || ''} onChange={handleChange} placeholder="Account Holder Name" />
      <input name="emergencyContact.name" value={form.emergencyContact?.name || ''} onChange={handleChange} placeholder="Emergency Contact Name" />
      <input name="emergencyContact.phoneNumber" value={form.emergencyContact?.phoneNumber || ''} onChange={handleChange} placeholder="Emergency Contact Phone" />
      <input name="groups" value={typeof form.groups === 'string' ? form.groups : form.groups?.join(',') || ''} onChange={handleChange} placeholder="Groups (comma separated)" />
      <input name="joinedAt" value={form.joinedAt || ''} onChange={handleChange} placeholder="Joined At (YYYY-MM-DD)" />
      <button type="submit" disabled={loading}>Update Member</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default MemberEditForm;
