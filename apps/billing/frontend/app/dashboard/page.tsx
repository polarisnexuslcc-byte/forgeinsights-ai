"use client";

import { useEffect, useState } from "react";
import {
  getUsage,
  getFiles,
  getBillingLogs,
  createExtraCheckoutLink,
  uploadFile,
  deleteFile,
  reprocessFile,
} from "../../lib/api";
import UsageCards from "../../components/UsageCards";
import UsageWarnings from "../../components/UsageWarnings";
import FilesTable from "../../components/FilesTable";
import EmptyState from "../../components/EmptyState";
import BillingLogs from "../../components/BillingLogs";

export default function DashboardPage() {
  const [usage, setUsage] = useState<any>(null);
  const [files, setFiles] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    try {
      setError(null);
      setLoading(true);
      const [usageData, filesData, logsData] = await Promise.all([
        getUsage(),
        getFiles(),
        getBillingLogs(),
      ]);
      setUsage(usageData);
      setFiles(filesData);
      setLogs(logsData);
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleBuyExtra() {
    try {
      const result = await createExtraCheckoutLink();
      window.open(result.url, "_blank");
    } catch (e: any) {
      alert(e.message || "Could not create checkout link");
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadFile(file);
      await loadAll();
    } catch (e: any) {
      alert(e.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(fileId: string) {
    try {
      await deleteFile(fileId);
      await loadAll();
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  }

  async function handleReprocess(fileId: string) {
    try {
      await reprocessFile(fileId);
      await loadAll();
    } catch (e: any) {
      alert(e.message || "Reprocess failed");
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: 24 }}>Error: {error}</div>;
  }

  return (
    <main
      style={{
        padding: 24,
        display: "grid",
        gap: 24,
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: "#6b7280" }}>Plan: {usage?.plan_code}</p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleBuyExtra}
            disabled={!usage?.can_buy_extra}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: usage?.can_buy_extra ? "#0f766e" : "#94a3b8",
              color: "white",
              cursor: usage?.can_buy_extra ? "pointer" : "not-allowed",
            }}
          >
            Buy extra questions
          </button>

          <label
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#111827",
              color: "white",
              cursor: "pointer",
            }}
          >
            {uploading ? "Uploading..." : "Upload file"}
            <input type="file" hidden onChange={handleUpload} />
          </label>
        </div>
      </section>

      <UsageWarnings warnings={usage?.warnings || []} />

      <section>
        <UsageCards usage={usage} />
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2>Files</h2>
        {!files?.items?.length ? (
          <EmptyState
            title="No files yet"
            description="Upload your first document to start using the workspace."
          />
        ) : (
          <FilesTable
            items={files.items}
            onDelete={handleDelete}
            onReprocess={handleReprocess}
          />
        )}
      </section>

      <section>
        <BillingLogs items={logs} />
      </section>
    </main>
  );
}
