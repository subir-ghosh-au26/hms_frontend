import React, { useState } from 'react';
import api from '../../api/api';

const UpdateItemForm = ({ item, onUpdateItem, onClose }) => {
    const [formData, setFormData] = useState({
        quantity: item.quantity,
        reorderLevel: item.reorderLevel
        // Add other fields you want to be updatable, e.g., supplier
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { data } = await api.patch(`/inventory/${item._id}`, formData);
            onUpdateItem(data); // Pass the updated item back to the parent
            onClose(); // Close the modal
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update item.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="inventory-form">
            {error && <p className="error-message">{error}</p>}
            <h4>Updating: {item.name}</h4>
            <div className="form-group">
                <label>Current Quantity</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="0" required />
            </div>
            <div className="form-group">
                <label>Re-order Level</label>
                <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} min="0" required />
            </div>
            <button type="submit" className="submit-button">Update Item</button>
        </form>
    );
};

export default UpdateItemForm;