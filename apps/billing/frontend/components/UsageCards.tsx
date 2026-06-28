function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div
      style={{
        background: "#e5e7eb",
        height: 10,
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: safeValue + "%",
          height: "100%",
          background:
            safeValue >= 100
              ? "#dc2626"
              : safeValue >= 95
              ? "#ea580c"
              : safeValue >= 80
              ? "#ca8a04"
              : "#0f766e",
        }}
      />
    </div>
  );
}

function bytesToReadable(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + " MB";
  return (bytes / 1024 ** 3).toFixed(2) + " GB";
}

export default function UsageCards({ usage }: { usage: any }) {
  const filesPct = usage.files_limit
    ? (usage.files_count / usage.files_limit) * 100
    : 0;
  const storagePct = usage.storage_limit_bytes
    ? (usage.storage_bytes / usage.storage_limit_bytes) * 100
    : 0;
  const questionsPct = usage.base_questions_limit
    ? (usage.base_questions_used / usage.base_questions_limit) * 100
    : 0;

  const cards = [
    {
      title: "Files",
      used: String(usage.files_count),
      total: String(usage.files_limit),
      pct: filesPct,
    },
    {
      title: "Storage",
      used: bytesToReadable(usage.storage_bytes),
      total: bytesToReadable(usage.storage_limit_bytes),
      pct: storagePct,
    },
    {
      title: "Monthly questions",
      used: String(usage.base_questions_used),
      total: String(usage.base_questions_limit),
      pct: questionsPct,
    },
    {
      title: "Extra questions",
      used: String(usage.extra_questions_remaining),
      total: "remaining",
      pct: usage.extra_questions_remaining > 0 ? 100 : 0,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
          }}
        >
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
            {card.title}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            {card.used}{" "}
            <span style={{ fontSize: 14, color: "#6b7280" }}>
              / {card.total}
            </span>
          </div>
          <ProgressBar value={card.pct} />
        </div>
      ))}
    </div>
  );
}
