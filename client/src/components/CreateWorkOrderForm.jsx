import { useState } from 'react';

const EMPTY = { order_no: '', style_code: '', qty: '' };

export default function CreateWorkOrderForm({ onCreate }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({
        order_no: form.order_no.trim(),
        style_code: form.style_code.trim(),
        // Send a number so server-side integer validation behaves as specified.
        qty: form.qty === '' ? undefined : Number(form.qty),
      });
      setForm(EMPTY);
    } catch (err) {
      const detail = Array.isArray(err.details) ? `: ${err.details.join('; ')}` : '';
      setError(`${err.message}${detail}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ margin: '12px 0' }}>
      <input
        placeholder="Order No (WO-YYYY-NNNN)"
        value={form.order_no}
        onChange={(e) => set('order_no', e.target.value)}
      />{' '}
      <input
        placeholder="Style"
        value={form.style_code}
        onChange={(e) => set('style_code', e.target.value)}
      />{' '}
      <input
        placeholder="Qty"
        type="number"
        value={form.qty}
        onChange={(e) => set('qty', e.target.value)}
      />{' '}
      <button type="submit" disabled={submitting}>
        Create
      </button>
      {error && (
        <div style={{ color: 'crimson', marginTop: 6 }} role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
