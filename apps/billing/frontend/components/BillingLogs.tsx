type BillingLog = {
  id: string;
  kind: string;
  message: string;
  created_at: string;
};

export default function BillingLogs({ items }: { items: BillingLog[] }) {
  if (!items?.length) {
    return (
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          background: "#fff",
        }}
      >
        No billing logs yet.
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: 16,
      }}
    >
      <h3 style={{ marginBottom: 12 }}>Billing logs</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}
          >
            <div style={{ fontWeight: 600 }}>{item.kind}</div>
            <div>{item.message}</div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>
              {new Date(item.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
