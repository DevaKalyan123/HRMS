
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:5000";

export async function getPayslips() {
  const response = await fetch(`${API_BASE_URL}/payslip/list`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to load payslips: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export function getPayslipViewUrl(id) {
  return `${API_BASE_URL}/payslip/view/${id}`;
}

export function getPayslipDownloadUrl(id) {
  return `${API_BASE_URL}/payslip/download/${id}`;
}
