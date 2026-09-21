// src/services/adminService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/* ============================================================
   HELPER
   ============================================================ */

async function handleResponse(response) {
    const responseText = await response.text();

    let data;

    try {
        data = JSON.parse(responseText);
    } catch (error) {
        throw new Error(
            `Server returned HTTP ${response.status}. ` +
            responseText.substring(0, 300)
        );
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            `Request failed with HTTP ${response.status}`
        );
    }

    return data;
}


/* ============================================================
   ADMIN PROFILE
   ============================================================ */

export async function updateAdminProfile(email, faceImage) {
    const formData = new FormData();

    formData.append("email", email);

    if (faceImage) {
        formData.append("face_image", faceImage);
    }

    const response = await fetch(
        `${API_BASE_URL}/admin/update_profile`,
        {
            method: "POST",
            body: formData,
            credentials: "include",
        }
    );

    return handleResponse(response);
}


/* ============================================================
   ATTENDANCE
   ============================================================ */

export async function updateAttendanceStatus(
    attendanceId,
    status
) {
    const formData = new FormData();

    formData.append("status", status);

    const response = await fetch(
        `${API_BASE_URL}/admin/update_attendance_status/${encodeURIComponent(
            attendanceId
        )}`,
        {
            method: "POST",
            body: formData,
            credentials: "include",
        }
    );

    return handleResponse(response);
}


/* ============================================================
   USERS
   ============================================================ */

export async function updateUser(
    userId,
    username,
    email,
    position,
    faceImage
) {
    const formData = new FormData();

    formData.append("username", username);
    formData.append("email", email);
    formData.append("position", position);

    if (faceImage) {
        formData.append("face_image", faceImage);
    }

    const response = await fetch(
        `${API_BASE_URL}/admin/admin_update_user/${encodeURIComponent(
            userId
        )}`,
        {
            method: "POST",
            body: formData,
            credentials: "include",
        }
    );

    return handleResponse(response);
}


export async function deleteUser(userId) {
    const response = await fetch(
        `${API_BASE_URL}/admin/delete_user/${encodeURIComponent(
            userId
        )}`,
        {
            method: "POST",
            credentials: "include",
        }
    );

    return handleResponse(response);
}


/* ============================================================
   ROTA
   ============================================================ */

export async function uploadRota(file) {
    const formData = new FormData();

    formData.append("rota_image", file);

    const response = await fetch(
        `${API_BASE_URL}/admin/upload_rota`,
        {
            method: "POST",
            body: formData,
            credentials: "include",
        }
    );

    return handleResponse(response);
}


/* ============================================================
   HOLIDAY
   ============================================================ */

export async function uploadHoliday(file) {
    const formData = new FormData();

    formData.append("holiday_image", file);

    const response = await fetch(
        `${API_BASE_URL}/admin/upload_holiday`,
        {
            method: "POST",
            body: formData,
            credentials: "include",
        }
    );

    return handleResponse(response);
}


/* ============================================================
   NOTIFICATION
   ============================================================ */

export async function sendNotification(message) {
    const formData = new FormData();

    formData.append("message", message);

    const response = await fetch(
        `${API_BASE_URL}/admin/send_notification`,
        {
            method: "POST",
            body: formData,
            credentials: "include",
        }
    );

    return handleResponse(response);
}


/* ============================================================
   LEAVE APPROVE / REJECT
   ============================================================ */

export async function updateLeaveStatus(
    leaveId,
    status,
    remarks
) {
    const formData = new URLSearchParams();

    formData.append("status", status);
    formData.append("remarks", remarks || "");

    const response = await fetch(
        `${API_BASE_URL}/admin/update_leave_status/${encodeURIComponent(
            leaveId
        )}`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded; charset=UTF-8",

                "X-Requested-With":
                    "XMLHttpRequest",
            },

            body: formData.toString(),

            credentials: "include",
        }
    );

    return handleResponse(response);
}


/* ============================================================
   EXPORT PAGE
   ============================================================ */

export function getExportPageUrl() {
    return `${API_BASE_URL}/admin/export_page`;
}
/* ============================================================
   ADMIN DASHBOARD DATA
   ============================================================ */

export async function getAdminDashboard() {
    const response = await fetch(
        `${API_BASE_URL}/admin/api-data`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        }
    );

    return handleResponse(response);
}
/* ============================================================
   TASKS
   ============================================================ */

export async function approveTask(taskId) {
    const response = await fetch(
        `${API_BASE_URL}/admin/approve-task/${encodeURIComponent(taskId)}`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to approve task (${response.status})`
        );
    }

    return true;
}


export async function rejectTask(taskId) {
    const response = await fetch(
        `${API_BASE_URL}/admin/reject-task/${encodeURIComponent(taskId)}`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to reject task (${response.status})`
        );
    }

    return true;
}