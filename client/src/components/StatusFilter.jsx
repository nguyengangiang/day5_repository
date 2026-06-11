const OPTIONS = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];

export default function StatusFilter({ value, onChange }) {
  return (
    <label>
      Filter:{' '}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
