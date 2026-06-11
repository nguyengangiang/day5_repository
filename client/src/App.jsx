import { useCallback, useEffect, useState } from 'react';
import StatusFilter from './components/StatusFilter.jsx';
import WorkOrderTable from './components/WorkOrderTable.jsx';
import CreateWorkOrderForm from './components/CreateWorkOrderForm.jsx';
import { listWorkOrders, createWorkOrder, updateStatus } from './api.js';

export default function App() {
  const [filter, setFilter] = useState('ALL');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(async (status) => {
    setError(null);
    try {
      setRows(await listWorkOrders(status));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh(filter);
  }, [filter, refresh]);

  async function handleCreate(payload) {
    await createWorkOrder(payload); // throws → form shows the error
    await refresh(filter);
  }

  async function handleAction(id, nextStatus) {
    setBusyId(id);
    setError(null);
    try {
      await updateStatus(id, nextStatus);
      await refresh(filter);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760, margin: '24px auto', padding: '0 16px' }}>
      <h1>Work Orders</h1>
      <CreateWorkOrderForm onCreate={handleCreate} />
      <div style={{ margin: '12px 0' }}>
        <StatusFilter value={filter} onChange={setFilter} />
      </div>
      {error && (
        <div style={{ color: 'crimson', marginBottom: 12 }} role="alert">
          {error}
        </div>
      )}
      <WorkOrderTable rows={rows} onAction={handleAction} busyId={busyId} />
    </main>
  );
}
