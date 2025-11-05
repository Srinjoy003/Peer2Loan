import React, { useState } from 'react';

const CycleEditForm = ({ cycle, onSuccess }) => {
  const [form, setForm] = useState(cycle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/cycles/${cycle._id || cycle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cycleNumber: Number(form.cycleNumber),
          contributions: Array.isArray(form.contributions) ? form.contributions : (form.contributions ? JSON.parse(form.contributions) : [])
        })
      });
      if (!res.ok) throw new Error('Failed to update cycle');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="groupId" value={form.groupId} onChange={handleChange} placeholder="Group ID" required />
      <input name="cycleNumber" value={form.cycleNumber} onChange={handleChange} placeholder="Cycle Number" type="number" required />
      <input name="targetPayoutMemberId" value={form.targetPayoutMemberId} onChange={handleChange} placeholder="Target Payout Member ID" required />
      <label>
        <input name="payoutConfirmed" type="checkbox" checked={form.payoutConfirmed} onChange={handleChange} />
        Payout Confirmed
      </label>
      <input name="payoutProofReferenceId" value={form.payoutProofReferenceId} onChange={handleChange} placeholder="Payout Proof Reference ID" />
      <textarea name="contributions" value={Array.isArray(form.contributions) ? JSON.stringify(form.contributions) : form.contributions} onChange={handleChange} placeholder='Contributions (JSON array)' />
      <button type="submit" disabled={loading}>Update Cycle</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default CycleEditForm;
