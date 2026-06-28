type FileItem = {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  processing_status: string;
  created_at: string;
};

function bytesToReadable(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + " MB";
  return (bytes / 1024 ** 3).toFixed(2) + " GB";
}

export default function FilesTable({
  items,
  onDelete,
  onReprocess,
}: {
  items: FileItem[];
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f9fafb", textAlign: "left" }}>
            <th style={{ padding: 12 }}>Name</th>
            <th style={{ padding: 12 }}>Type</th>
            <th style={{ padding: 12 }}>Size</th>
            <th style={{ padding: 12 }}>Status</th>
            <th style={{ padding: 12 }}>Created</th>
            <th style={{ padding: 12 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((file) => (
            <tr key={file.id} style={{ borderTop: "1px solid #e5e7eb" }}>
              <td style={{ padding: 12 }}>{file.filename}</td>
              <td style={{ padding: 12 }}>{file.mime_type}</td>
              <td style={{ padding: 12 }}>{bytesToReadable(file.size_bytes)}</td>
              <td style={{ padding: 12 }}>{file.processing_status}</td>
              <td style={{ padding: 12 }}>
                {new Date(file.created_at).toLocaleString()}
              </td>
              <td style={{ padding: 12, display: "flex", gap: 8 }}>
                <button onClick={() => onReprocess(file.id)}>Reprocess</button>
                <button onClick={() => onDelete(file.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
