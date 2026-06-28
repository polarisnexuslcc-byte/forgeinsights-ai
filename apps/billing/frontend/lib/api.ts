const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const DEMO_HEADERS: Record<string, string> = {
  "X-User-Id": "11111111-1111-1111-1111-111111111111",
  "X-Organization-Id": "22222222-2222-2222-2222-222222222222",
};

async function parseJson(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function getUsage() {
  const res = await fetch(API_BASE_URL + "/api/org/me/usage", {
    headers: DEMO_HEADERS,
    cache: "no-store",
  });
  return parseJson(res);
}

export async function getFiles(limit = 20, offset = 0) {
  const res = await fetch(
    API_BASE_URL + "/api/org/me/files?limit=" + limit + "&offset=" + offset,
    {
      headers: DEMO_HEADERS,
      cache: "no-store",
    }
  );
  return parseJson(res);
}

export async function getExtraStatus() {
  const res = await fetch(API_BASE_URL + "/api/org/me/extras/status", {
    headers: DEMO_HEADERS,
    cache: "no-store",
  });
  return parseJson(res);
}

export async function createExtraCheckoutLink() {
  const res = await fetch(API_BASE_URL + "/api/org/me/extras/checkout-link", {
    method: "POST",
    headers: DEMO_HEADERS,
  });
  return parseJson(res);
}

export async function getBillingLogs() {
  const res = await fetch(API_BASE_URL + "/api/org/me/billing/logs", {
    headers: DEMO_HEADERS,
    cache: "no-store",
  });
  return parseJson(res);
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(API_BASE_URL + "/api/org/me/files/upload", {
    method: "POST",
    headers: DEMO_HEADERS,
    body: formData,
  });
  return parseJson(res);
}

export async function deleteFile(fileId: string) {
  const res = await fetch(API_BASE_URL + "/api/org/me/files/" + fileId, {
    method: "DELETE",
    headers: DEMO_HEADERS,
  });
  return parseJson(res);
}

export async function reprocessFile(fileId: string) {
  const res = await fetch(
    API_BASE_URL + "/api/org/me/files/" + fileId + "/reprocess",
    {
      method: "POST",
      headers: DEMO_HEADERS,
    }
  );
  return parseJson(res);
}
