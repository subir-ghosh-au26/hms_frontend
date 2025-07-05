import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import generateStaffReportPDF from '../../utils/generateStaffReportPDF';
import { exportStaffData } from '../../utils/exportToExcel';
import Modal from '../../components/layout/Modal';
import './StaffDirectory.css';

// ===================================================================
// SUB-COMPONENT: Staff Registration Form (for the modal)
// ===================================================================
const RegisterUserForm = ({ onUserAdded, closeModal }) => {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Doctor', specialization: '', phone: '', address: '', dateOfBirth: '', bloodGroup: '', qualifications: '', photo: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setMessage(''); setError('');
        try {
            const { data } = await api.post('/auth/register', formData);
            setMessage('User registered successfully!');
            onUserAdded(data);
            setTimeout(() => {
                closeModal();
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="dashboard-form">
            {message && <p className="message success">{message}</p>}
            {error && <p className="message error">{error}</p>}
            <form onSubmit={onSubmit}>
                <div className="form-group-row">
                    <div className="form-group"><label>First Name</label><input type="text" name="firstName" value={formData.firstName} onChange={onChange} required /></div>
                    <div className="form-group"><label>Last Name</label><input type="text" name="lastName" value={formData.lastName} onChange={onChange} required /></div>
                </div>
                <div className="form-group"><label>Email Address</label><input type="email" name="email" value={formData.email} onChange={onChange} required /></div>
                <div className="form-group-row">
                    <div className="form-group"><label>Password</label><input type="password" name="password" value={formData.password} onChange={onChange} required /></div>
                    <div className="form-group"><label>Role</label><select name="role" value={formData.role} onChange={onChange}><option value="Doctor">Doctor</option><option value="Receptionist">Receptionist</option><option value="Nurse">Nurse</option><option value="Pharmacist">Pharmacist</option><option value="LabTechnician">Lab Technician</option><option value="Accountant">Accountant</option></select></div>
                </div>
                {formData.role === 'Doctor' && (
                    <div className="form-group">
                        <label>Specialization</label>
                        <input
                            type="text"
                            name="specialization"
                            value={formData.specialization}
                            onChange={onChange}
                            placeholder="e.g., Cardiology"
                            required // Make it required on the frontend as well
                        />
                    </div>
                )}
                <div className="form-group-row">
                    <div className="form-group"><label>Phone</label><input type="text" name="phone" value={formData.phone} onChange={onChange} required /></div>
                    <div className="form-group"><label>Address</label><input type="text" name="address" value={formData.address} onChange={onChange} required /></div>
                </div>
                <div className="form-group-row">
                    <div className="form-group"><label>Date of Birth</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={onChange} required /></div>
                    <div className="form-group"><label>Blood Group</label><input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={onChange} required /></div>
                    <div className="form-group"><label>Qualifications</label><input type="text" name="qualifications" value={formData.qualifications} onChange={onChange} required /></div>
                    <div className="form-group"><label>Photo</label><input type="file" name="photo" value={formData.photo} onChange={onChange} required /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">Register User</button>
                </div>
            </form>
        </div>
    );
};

// ===================================================================
// SUB-COMPONENT: Staff Card for the grid view
// ===================================================================
const StaffCard = ({ staff, isSelected, onSelect }) => {
    const avatarUrl = staff.photoUrl === 'default_avatar.png'
        ? `https://ui-avatars.com/api/?name=${staff.firstName}+${staff.lastName}&background=4f46e5&color=fff`
        : staff.photoUrl;

    return (
        <div className={`staff-grid-card ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(staff)}>
            <img src={avatarUrl} alt={`${staff.firstName} ${staff.lastName}`} className="staff-card-avatar" />
            <div className="staff-card-info">
                <span className="staff-name">{staff.firstName} {staff.lastName}</span>
                <span className="staff-role">{staff.role}</span>
            </div>
        </div>
    );
};


// ===================================================================
// MAIN StaffDirectory COMPONENT
// ===================================================================
const StaffDirectory = () => {
    const [allStaff, setAllStaff] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState(null);

    const fetchStaff = async () => {
        setLoadingList(true);
        try {
            const res = await api.get('/staff');
            setAllStaff(res.data);
        } catch (error) { console.error("Failed to fetch staff", error); }
        finally { setLoadingList(false); }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const filteredStaff = useMemo(() => {
        if (!searchTerm.trim()) return allStaff;
        const searchLower = searchTerm.toLowerCase();
        return allStaff.filter(s => (s.phone || '').includes(searchLower) || `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchLower));
    }, [allStaff, searchTerm]);

    const handleSelectStaff = async (staff) => {
        if (selectedStaff?._id === staff._id) {
            setSelectedStaff(null);
            return;
        }
        setSelectedStaff(null);
        setLoadingDetails(true);
        try {
            const res = await api.get(`/staff/${staff._id}`);
            setSelectedStaff(res.data);
        } catch (error) { console.error("Failed to fetch staff details", error); }
        finally { setLoadingDetails(false); }
    };

    const handleUserAdded = (newUser) => {
        // Add the new user to the list for an instant UI update
        setAllStaff(prevStaff => [...prevStaff, newUser].sort((a, b) => a.firstName.localeCompare(b.firstName)));
    };

    const openEditModal = () => {
        if (!selectedStaff) return;
        setEditFormData(selectedStaff); // Pre-fill form with current data
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        try {
            const { data: updatedStaff } = await api.put(`/staff/${editFormData._id}`, editFormData);

            // Update the state for both the main list and the detail view
            setSelectedStaff(updatedStaff);
            setAllStaff(allStaff.map(s => s._id === updatedStaff._id ? updatedStaff : s));

            setIsEditModalOpen(false); // Close modal on success
        } catch (error) {
            alert('Failed to update staff details.');
        }
    };

    const handleDeleteStaff = async () => {
        if (!selectedStaff) return;
        // Use a confirmation dialog for destructive actions
        if (window.confirm(`Are you sure you want to delete ${selectedStaff.firstName} ${selectedStaff.lastName}? This action cannot be undone.`)) {
            try {
                await api.delete(`/staff/${selectedStaff._id}`);
                // Remove the user from the list and clear the detail view
                setAllStaff(allStaff.filter(s => s._id !== selectedStaff._id));
                setSelectedStaff(null);
            } catch (error) {
                alert('Failed to delete staff member.');
            }
        }
    };

    return (
        <div className="dashboard-page staff-directory-layout">
            <aside className="directory-sidebar">
                <header className="directory-sidebar-header">
                    <h3>Staff Directory ({filteredStaff.length})</h3>
                    <div className="search-bar-container">
                        <input type="text" placeholder="Search by Name or Phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="history-search-input" />
                    </div>
                    <div className="export-actions">
                        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary full-width-btn" style={{ marginBottom: '0.5rem' }}><span className="icon">➕</span> Add New Staff</button>
                        <button onClick={() => exportStaffData(allStaff)} className="btn btn-success full-width-btn"><span className="icon">📄</span> Export to Excel</button>
                    </div>
                </header>
                <div className="staff-grid-container">
                    {loadingList ? <p>Loading...</p> : filteredStaff.map(s => (
                        <StaffCard key={s._id} staff={s} isSelected={selectedStaff?._id === s._id} onSelect={handleSelectStaff} />
                    ))}
                </div>
            </aside>

            <main className="directory-main-content">
                {loadingDetails ? (
                    <div className="placeholder-container"><p>Loading Details...</p></div>
                ) : selectedStaff ? (
                    <div className="staff-details-view">
                        <header className="staff-details-header">
                            <div className="staff-header-info">
                                <img
                                    src={
                                        selectedStaff.photoUrl === 'default_avatar.png'
                                            ? `https://ui-avatars.com/api/?name=${selectedStaff.firstName}+${selectedStaff.lastName}&size=128&background=4f46e5&color=fff`
                                            : selectedStaff.photoUrl
                                    }
                                    alt={`${selectedStaff.firstName} ${selectedStaff.lastName}`}
                                    className="staff-detail-avatar"
                                />
                                <div>
                                    <h2>{selectedStaff.firstName} {selectedStaff.lastName}</h2>
                                    <p>{selectedStaff.role} | Joined: {new Date(selectedStaff.joiningDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button onClick={openEditModal} className="btn btn-secondary">Edit Profile</button>
                                <button onClick={handleDeleteStaff} className="btn btn-danger">Delete Staff</button>
                                <button onClick={() => generateStaffReportPDF(selectedStaff)} className="btn btn-primary">
                                    <span className="icon">📄</span> Download Report
                                </button>
                            </div>
                        </header>

                        <div className="details-grid">
                            <div className="dashboard-card">
                                <h3>Contact Information</h3>
                                <p><strong>Email:</strong> {selectedStaff.email}</p>
                                <p><strong>Phone:</strong> {selectedStaff.phone || 'N/A'}</p>
                                <p><strong>Address:</strong> {selectedStaff.address || 'N/A'}</p>
                            </div>
                            <div className="dashboard-card">
                                <h3>Personal Details</h3>
                                <p><strong>Date of Birth:</strong> {selectedStaff.dateOfBirth ? new Date(selectedStaff.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Blood Group:</strong> {selectedStaff.bloodGroup || 'N/A'}</p>
                            </div>
                            <div className="dashboard-card">
                                <h3>Leave Balance</h3>
                                <p><strong>Total Allotment:</strong> {selectedStaff.totalLeaveDays} days</p>
                                <p><strong>Leave Taken:</strong> {selectedStaff.leaveTaken} days</p>
                                <p><strong>Balance:</strong> {selectedStaff.leaveBalance} days</p>
                            </div>
                        </div>

                        <div className="dashboard-card full-width">
                            <h3>Leave History</h3>
                            {selectedStaff.leaves && selectedStaff.leaves.length > 0 ? (
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedStaff.leaves.map(l => (
                                            <tr key={l._id}>
                                                <td>{l.leaveType}</td>
                                                <td>{new Date(l.startDate).toLocaleDateString()}</td>
                                                <td>{new Date(l.endDate).toLocaleDateString()}</td>
                                                <td>{l.reason}</td>
                                                <td><span className={`status-badge status-${l.status.toLowerCase()}`}>{l.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No leave history found.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="placeholder-container">
                        <span className="placeholder-icon">👨‍⚕️</span>
                        <p>Select a staff member from the directory to view their details.</p>
                    </div>
                )}
            </main>
            {/* --- NEW MODAL for Editing Staff --- */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Staff Details">
                {editFormData && (
                    <form onSubmit={handleUpdateStaff} className="dashboard-form">
                        <div className="form-group-row">
                            <div className="form-group"><label>First Name</label><input type="text" name="firstName" value={editFormData.firstName} onChange={handleEditFormChange} required /></div>
                            <div className="form-group"><label>Last Name</label><input type="text" name="lastName" value={editFormData.lastName} onChange={handleEditFormChange} required /></div>
                        </div>
                        <div className="form-group"><label>Email</label><input type="email" name="email" value={editFormData.email} onChange={handleEditFormChange} required /></div>
                        <div className="form-group"><label>Phone</label><input type="tel" name="phone" value={editFormData.phone} onChange={handleEditFormChange} /></div>
                        <div className="form-group"><label>Total Leave Days Allotment</label><input type="number" name="totalLeaveDays" value={editFormData.totalLeaveDays} onChange={handleEditFormChange} required min="0" /></div>
                        {/* Add other editable fields here: address, blood group, etc. */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Staff Member">
                <RegisterUserForm onUserAdded={handleUserAdded} closeModal={() => setIsAddModalOpen(false)} />
            </Modal>
        </div >
    );
};

export default StaffDirectory;