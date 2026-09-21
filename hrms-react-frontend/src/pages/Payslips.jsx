import { useEffect, useMemo, useState } from "react";
import {
    getPayslips,
    getPayslipViewUrl,
    getPayslipDownloadUrl,
} from "../services/payslipService";
import "../styles/payslip.css";


function Payslips() {
    const [payslips, setPayslips] = useState([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadPayslips();
    }, []);

    async function loadPayslips() {
        try {
            setLoading(true);
            setError("");

            const data = await getPayslips();

            setPayslips(data);

            if (data.length > 0) {
                setSelectedYear(String(data[0].year));
            }
        } catch (err) {
            console.error("Payslip loading error:", err);
            setError("Unable to load payslips");
        } finally {
            setLoading(false);
        }
    }

    const years = useMemo(() => {
        return [
            ...new Set(
                payslips.map((payslip) =>
                    String(payslip.year)
                )
            ),
        ].sort((a, b) => Number(b) - Number(a));
    }, [payslips]);

    const filteredPayslips = useMemo(() => {
        if (!selectedYear) {
            return payslips;
        }

        return payslips.filter(
            (payslip) =>
                String(payslip.year) === selectedYear
        );
    }, [payslips, selectedYear]);

    const latestPayslip =
        payslips.length > 0
            ? payslips[0]
            : null;

    const totalSalary = payslips.reduce(
        (sum, payslip) =>
            sum + Number(payslip.net_salary || 0),
        0
    );

    function formatCurrency(value) {
        return `₹${Number(value || 0).toLocaleString(
            "en-IN"
        )}`;
    }

    return (
        <div className="payslips-page">

            {/* Header */}

            <div className="section-heading">

                <div>
                    <h2>
                        <i className="fas fa-file-invoice-dollar"></i>{" "}
                        Payslips
                    </h2>

                    <p>
                        View and download your salary
                        payslips.
                    </p>
                </div>

            </div>

            {/* Summary Cards */}

            <div className="payslip-summary-grid">

                <div className="payslip-summary-card">

                    <div className="payslip-card-icon">
                        <i className="fas fa-file-invoice"></i>
                    </div>

                    <div className="payslip-card-content">

                        <span className="payslip-card-label">
                            Total Payslips
                        </span>

                        <strong>
                            {payslips.length}
                        </strong>

                    </div>

                </div>

                <div className="payslip-summary-card">

                    <div className="payslip-card-icon">
                        <i className="fas fa-calendar-check"></i>
                    </div>

                    <div className="payslip-card-content">

                        <span className="payslip-card-label">
                            Latest Payslip
                        </span>

                        <strong>
                            {latestPayslip
                                ? "Available"
                                : "—"}
                        </strong>

                        <small>
                            {latestPayslip
                                ? `${latestPayslip.month} ${latestPayslip.year}`
                                : "—"}
                        </small>

                    </div>

                </div>

                <div className="payslip-summary-card">

                    <div className="payslip-card-icon">
                        <i className="fas fa-calendar"></i>
                    </div>

                    <div className="payslip-card-content">

                        <span className="payslip-card-label">
                            Latest Year
                        </span>

                        <strong>
                            {latestPayslip
                                ? latestPayslip.year
                                : "—"}
                        </strong>

                    </div>

                </div>

                <div className="payslip-summary-card">

                    <div className="payslip-card-icon">
                        <i className="fas fa-rupee-sign"></i>
                    </div>

                    <div className="payslip-card-content">

                        <span className="payslip-card-label">
                            Total Earnings
                        </span>

                        <strong>
                            {formatCurrency(
                                totalSalary
                            )}
                        </strong>

                    </div>

                </div>

            </div>

            {/* Payslip Table */}

            <div className="payslip-table-card">

                <div className="payslip-table-header">

                    <div>
                        <h3>
                            <i className="fas fa-list"></i>{" "}
                            Payslip History
                        </h3>

                        <p>
                            View or download your
                            payslips.
                        </p>
                    </div>

                    <div className="payslip-filter">

                        <label>
                            Year
                        </label>

                        <select
                            value={selectedYear}
                            onChange={(event) =>
                                setSelectedYear(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                All
                            </option>

                            {years.map((year) => (
                                <option
                                    key={year}
                                    value={year}
                                >
                                    {year}
                                </option>
                            ))}

                        </select>

                    </div>

                </div>

                <div className="table-wrapper">

                    <table className="payslip-table">

                        <thead>
                            <tr>
                                <th>
                                    Month
                                </th>

                                <th>
                                    Year
                                </th>

                                <th>
                                    Net Salary
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading && (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="empty-table"
                                    >
                                        <i className="fas fa-spinner fa-spin"></i>{" "}
                                        Loading payslips...
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                error && (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="empty-table"
                                        >
                                            {error}
                                        </td>
                                    </tr>
                                )}

                            {!loading &&
                                !error &&
                                filteredPayslips.length ===
                                    0 && (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="empty-table"
                                        >
                                            No Payslips
                                            Available
                                        </td>
                                    </tr>
                                )}

                            {!loading &&
                                !error &&
                                filteredPayslips.map(
                                    (payslip) => (
                                        <tr
                                            key={
                                                payslip.id
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        payslip.month
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    payslip.year
                                                }
                                            </td>

                                            <td>
                                                {formatCurrency(
                                                    payslip.net_salary
                                                )}
                                            </td>

                                            <td>
                                                <span className="status-badge approved">
                                                    Available
                                                </span>
                                            </td>

                                            <td>

                                                <a
                                                    href={getPayslipViewUrl(
                                                        payslip.id
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="payslip-action view"
                                                >
                                                    <i className="fas fa-eye"></i>{" "}
                                                    View
                                                </a>

                                                <a
                                                    href={getPayslipDownloadUrl(
                                                        payslip.id
                                                    )}
                                                    className="payslip-action download"
                                                >
                                                    <i className="fas fa-download"></i>{" "}
                                                    Download
                                                </a>

                                            </td>

                                        </tr>
                                    )
                                )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default Payslips;