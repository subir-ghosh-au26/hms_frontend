import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import generateInvoicePDF from '../utils/generateInvoicePDF';
import './PatientBillDetail.css';

const PatientBillDetail = () => {
    const { patientId } = useParams();
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash/Card');
    const [paymentMessage, setPaymentMessage] = useState({ text: '', type: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Using useCallback to memoize the fetch function
    const fetchBill = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // This endpoint returns the bill with all details populated from the backend
            const { data } = await api.get(`/bills/patient/${patientId}`);
            setBill(data);
        } catch (err) {
            setError('Failed to fetch bill details. This patient may not have a bill yet.');
            console.error("Failed to fetch bill details", err);
        } finally {
            setLoading(false);
        }
    }, [patientId, bill]);

    useEffect(() => {
        fetchBill();
    }, [patientId]);

    const handleDownload = () => {
        if (bill && bill.patient) {
            // The generateInvoicePDF utility takes the full bill and patient objects
            generateInvoicePDF(bill, bill.patient);
        } else {
            alert("Cannot generate PDF. Bill data is incomplete.");
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setPaymentMessage({ text: '', type: '' });
        setIsSubmitting(true);

        if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
            setPaymentMessage({ text: 'Please enter a valid payment amount.', type: 'error' });
            setIsSubmitting(false);
            return;
        }

        try {
            // The recordPayment endpoint now returns the fully updated bill
            await api.post(`/bills/${bill._id}/payment`, {
                amount: paymentAmount,
                paymentMethod: paymentMethod
            });

            setPaymentMessage({ text: 'Payment recorded successfully!', type: 'success' });
            setPaymentAmount(''); // Reset form

            // Refetch the bill data to show the updated summary and history instantly
            fetchBill();

        } catch (err) {
            setPaymentMessage({ text: err.response?.data?.message || 'Failed to record payment.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) return <div className="dashboard-page"><p>Loading Bill Details...</p></div>;


    if (error) {
        return <div className="dashboard-page"><p className="error-message">{error}</p></div>;
    }

    if (!bill) {
        return (
            <div className="dashboard-page bill-detail-page">
                <header className="bill-detail-header">
                    <h1>Bill Not Found</h1>
                    <Link to="/accountant" className="btn btn-secondary">Back to Dashboard</Link>
                </header>
                <p>No billing record found for this patient.</p>
            </div>
        );
    }

    const balanceDue = bill.totalAmount - bill.amountPaid;

    return (
        <div className="dashboard-page bill-detail-page">
            <header className="bill-detail-header">
                <div>
                    <h1>Invoice for {bill.patient.firstName} {bill.patient.lastName}</h1>
                    <p>
                        UHID: {bill.patient.uhid} | Status:
                        <span className={`status-badge status-${bill.status.toLowerCase().replace(' ', '-')}`}>
                            {bill.status}
                        </span>
                    </p>
                </div>
                <div className="header-actions">
                    <Link to="/accountant" className="btn btn-secondary">Back to Dashboard</Link>
                    <button onClick={handleDownload} className="btn btn-primary">
                        <span className="icon">📄</span> Download Invoice PDF
                    </button>
                </div>
            </header>

            <div className="financial-summary-grid">
                <div className="summary-card">
                    <h4>Total Billed</h4>
                    <p>${bill.totalAmount.toFixed(2)}</p>
                </div>
                <div className="summary-card">
                    <h4>Total Paid</h4>
                    <p style={{ color: 'var(--success-color)' }}>${bill.amountPaid.toFixed(2)}</p>
                </div>
                <div className="summary-card">
                    <h4>Balance Due</h4>
                    <p style={{ color: 'var(--danger-color)' }}>${balanceDue.toFixed(2)}</p>
                </div>
            </div>

            {balanceDue > 0 && (
                <section className="details-section payment-section">
                    <h3>Record New Payment</h3>
                    <div className="dashboard-form-container">
                        <form onSubmit={handlePaymentSubmit} className="dashboard-form">
                            {paymentMessage.text && <p className={`message ${paymentMessage.type}`}>{paymentMessage.text}</p>}
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>Payment Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder={`Max: ${balanceDue.toFixed(2)}`}
                                        step="0.01"
                                        min="0.01"
                                        max={balanceDue.toFixed(2)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                        <option value="Cash/Card">Cash/Card</option>
                                        <option value="Online">Online</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Insurance">Insurance</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                                {isSubmitting ? 'Processing...' : 'Record Payment'}
                            </button>
                        </form>
                    </div>
                </section>
            )}

            <div className="details-section">
                <h3>Itemized Charges</h3>
                <div className="history-table-container">
                    <table className="professional-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Qty</th>
                                <th>Unit Cost</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bill.lineItems.length > 0 ? bill.lineItems.map(item => (
                                <tr key={item._id}>
                                    <td>{new Date(parseInt(item._id.toString().substring(0, 8), 16) * 1000).toLocaleDateString()}</td>
                                    <td>{item.description}</td>
                                    <td>{item.service?.category || 'N/A'}</td>
                                    <td>{item.quantity}</td>
                                    <td>${item.cost.toFixed(2)}</td>
                                    <td><strong>${(item.cost * item.quantity).toFixed(2)}</strong></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="empty-row">No charges have been added to this bill.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="details-section">
                <h3>Payment History</h3>
                <div className="history-table-container">
                    <table className="professional-table">
                        <thead>
                            <tr>
                                <th>Payment Date</th>
                                <th>Payment Method</th>
                                <th>Recorded By</th>
                                <th>Amount Paid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bill.paymentHistory.length > 0 ? bill.paymentHistory.map(p => (
                                <tr key={p._id}>
                                    <td>{new Date(p.paymentDate).toLocaleString()}</td>
                                    <td>{p.paymentMethod}</td>
                                    <td>{p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : 'N/A'}</td>
                                    <td><strong style={{ color: 'var(--success-color)' }}>${p.amount.toFixed(2)}</strong></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="empty-row">No payments have been recorded for this bill.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* You could add the "Record Payment" form from the old modal here as another section if desired */}
        </div>
    );
};

export default PatientBillDetail;