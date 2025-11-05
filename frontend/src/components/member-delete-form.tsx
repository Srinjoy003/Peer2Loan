import React, { useState } from 'react';

const MemberDeleteForm = ({ memberId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete member');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleDelete}>
      <button type="submit" disabled={loading}>Delete Member</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default MemberDeleteForm;
