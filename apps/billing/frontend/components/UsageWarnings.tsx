type WarningItem = {
  type: string;
  level: number;
  message: string;
};

export default function UsageWarnings({ warnings }: { warnings: WarningItem[] }) {
  if (!warnings?.length) return null;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {warnings.map((warning, idx) => (
        <div
          key={warning.type + "-" + idx}
          style={{
            borderRadius: 10,
            padding: 14,
            background:
              warning.level >= 100
                ? "#fef2f2"
                : warning.level >= 95
                ? "#fff7ed"
                : "#fffbeb",
            border: "1px solid #e5e7eb",
          }}
        >
          <strong>{warning.level}%</strong> - {warning.message}
        </div>
      ))}
    </div>
  );
}
