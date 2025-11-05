import React, { useState } from 'react';

const PaymentDeleteForm = ({ paymentId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete payment');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleDelete}>
      <button type="submit" disabled={loading}>Delete Payment</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default PaymentDeleteForm;
