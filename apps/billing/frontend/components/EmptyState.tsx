type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        textAlign: "center",
        background: "#fff",
      }}
    >
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: "#0f766e",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
