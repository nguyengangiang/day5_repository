// Maps a row's current status to its single available action (mirrors the
// server transition map PENDING -> IN_PROGRESS -> COMPLETED).
const NEXT_ACTION = {
  PENDING: { label: 'Start', next: 'IN_PROGRESS' },
  IN_PROGRESS: { label: 'Complete', next: 'COMPLETED' },
  COMPLETED: null,
};

export default function WorkOrderTable({ rows, onAction, busyId }) {
  if (rows.length === 0) {
    return <p>No work orders.</p>;
  }
  return (
    <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th>Order No</th>
          <th>Style</th>
          <th>Qty</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const action = NEXT_ACTION[row.status];
          return (
            <tr key={row.id}>
              <td>{row.order_no}</td>
              <td>{row.style_code}</td>
              <td>{row.qty}</td>
              <td>{row.status}</td>
              <td>
                {action ? (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => onAction(row.id, action.next)}
                  >
                    {action.label}
                  </button>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
