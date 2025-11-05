import React, { useState } from 'react';

const PaymentForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    memberId: '',
    cycleId: '',
    amount: '',
    paymentDate: '',
    proofReferenceId: '',
    penaltyAmount: '',
    penaltyReason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          penaltyAmount: Number(form.penaltyAmount)
        })
      });
      if (!res.ok) throw new Error('Failed to create payment');
      setForm({
        memberId: '', cycleId: '', amount: '', paymentDate: '', proofReferenceId: '', penaltyAmount: '', penaltyReason: ''
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="memberId" value={form.memberId} onChange={handleChange} placeholder="Member ID" required />
      <input name="cycleId" value={form.cycleId} onChange={handleChange} placeholder="Cycle ID" required />
      <input name="amount" value={form.amount} onChange={handleChange} placeholder="Amount" type="number" required />
      <input name="paymentDate" value={form.paymentDate} onChange={handleChange} placeholder="Payment Date (YYYY-MM-DD)" />
      <input name="proofReferenceId" value={form.proofReferenceId} onChange={handleChange} placeholder="Proof Reference ID" />
      <input name="penaltyAmount" value={form.penaltyAmount} onChange={handleChange} placeholder="Penalty Amount" type="number" />
      <input name="penaltyReason" value={form.penaltyReason} onChange={handleChange} placeholder="Penalty Reason" />
      <button type="submit" disabled={loading}>Create Payment</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default PaymentForm;
