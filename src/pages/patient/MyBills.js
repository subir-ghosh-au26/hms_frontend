import React, { useState, useEffect } from 'react';
import patientApi from '../../api/patientApi';
import './PatientPortal.css';

const MyBills = () => {
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const res = await patientApi.get('/patient/my-bill');
                setBill(res.data);
            } catch (error) {
                // It's common for new patients to not have a bill, so we don't treat 404 as a critical error
                if (error.response?.status !== 404) {
                    console.error("Failed to fetch bill", error);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchBill();
    }, []);

    if (loading) return <p>Loading your billing information...</p>;
    if (!bill) return (
        <div className="patient-portal-page">
            <h2>My Bills</h2>
            <p>You do not have any bills at this time.</p>
        </div>
    );


    return (
        <div className="patient-portal-page">
            <h2>My Bills</h2>
            <div className="bill-summary-card">
                <div>
                    <h4>Total Amount</h4>
                    <p>₹{bill.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                    <h4>Amount Paid</h4>
                    <p>₹{bill.amountPaid.toFixed(2)}</p>
                </div>
                <div className="outstanding">
                    <h4>Outstanding Balance</h4>
                    <p>₹{(bill.totalAmount - bill.amountPaid).toFixed(2)}</p>
                </div>
                <div>
                    <h4>Status</h4>
                    <p>{bill.status}</p>
                </div>
            </div>

            <h3>Itemized Details</h3>
            <table className="itemized-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Service Description</th>
                        <th>Cost</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.lineItems.map(item => (
                        <tr key={item._id}>
                            <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                            <td>{item.description}</td>
                            <td>₹{item.cost.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Payment Gateway integration would go here */}
        </div>
    );
};

export default MyBills;