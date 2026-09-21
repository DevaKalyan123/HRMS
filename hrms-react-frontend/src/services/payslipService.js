const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getPayslips() {
    try {
        const response = await fetch(`${API_BASE_URL}/payslip/list`, {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Payslip API error:", response.status, text);

            throw new Error(
                `Failed to load payslips. Status: ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Payslip API response:", data);

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error loading payslips:", error);
        throw error;
    }
}

export function getPayslipViewUrl(id) {
    return `${API_BASE_URL}/payslip/view/${id}`;
}

export function getPayslipDownloadUrl(id) {
    return `${API_BASE_URL}/payslip/download/${id}`;
}