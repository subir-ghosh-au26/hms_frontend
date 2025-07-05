import React, { useState } from 'react';
import api from '../../api/api';

const AddItemForm = ({ onAddItem, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'General Supplies',
        quantity: 0,
        unit: '',
        supplier: '',
        reorderLevel: 10,
        batchNumber: '',
        expiryDate: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { data } = await api.post('/inventory', formData);
            onAddItem(data); // Pass the new item back to the parent
            onClose(); // Close the modal
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add item.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="inventory-form">
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
                <label>Item Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="General Supplies">General Supplies</option>
                    <option value="Surgical Supplies">Surgical Supplies</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Equipment">Equipment</option>
                </select>
            </div>
            <div className="form-group-row">
                <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="0" required />
                </div>
                <div className="form-group">
                    <label>Unit (e.g., box, pcs)</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleChange} required />
                </div>
            </div>
            <div className="form-group">
                <label>Re-order Level</label>
                <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} min="0" required />
            </div>
            {formData.category === 'Pharmacy' && (
                <>
                    <div className="form-group">
                        <label>Batch Number</label>
                        <input type="text" name="batchNumber" value={formData.batchNumber} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Expiry Date</label>
                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
                    </div>
                </>
            )}
            <button type="submit" className="submit-button">Add Item</button>
        </form>
    );
};

export default AddItemForm;