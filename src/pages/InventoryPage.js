import React, { useState, useEffect } from 'react';
import api from '../api/api';
import Modal from '../components/layout/Modal';
import AddItemForm from '../components/inventory/AddItemForm';
import UpdateItemForm from '../components/inventory/UpdateItemForm';
import './InventoryPage.css';

const InventoryPage = () => {
    const [items, setItems] = useState([]);
    const [view, setView] = useState('all');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            let url = '/inventory';
            const params = {};
            if (view === 'pharmacy') params.category = 'Pharmacy';
            if (view === 'surgical') params.category = 'Surgical Supplies';
            if (view === 'general') params.category = 'General Supplies';
            if (view === 'equipment') params.category = 'Equipment';
            if (view === 'low') url = '/inventory/low-stock';

            try {
                const { data } = await api.get(url, { params });
                setItems(data);
            } catch (error) {
                console.error("Failed to fetch inventory", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [view]);

    const handleAddItem = (newItem) => {
        setItems([...items, newItem]);
    };

    const handleUpdateItem = (updatedItem) => {
        setItems(items.map(item => item._id === updatedItem._id ? updatedItem : item));
    };

    const openUpdateModal = (item) => {
        setSelectedItem(item);
        setIsUpdateModalOpen(true);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="inventory-page">
            <h2>Inventory Management</h2>
            <div className="top-bar">
                <div className="view-controls">
                    <button onClick={() => setView('all')} className={view === 'all' ? 'active' : ''}>All Items</button>
                    <button onClick={() => setView('pharmacy')} className={view === 'pharmacy' ? 'active' : ''}>Pharmacy</button>
                    <button onClick={() => setView('surgical')} className={view === 'surgical' ? 'active' : ''}>Surgical</button>
                    <button onClick={() => setView('general')} className={view === 'general' ? 'active' : ''}>General</button>
                    <button onClick={() => setView('equipment')} className={view === 'equipment' ? 'active' : ''}>Equipment</button>
                    <button onClick={() => setView('low')} className={view === 'low' ? 'active' : ''}>Low Stock Alerts</button>
                </div>
                <div className="actions-bar">
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button onClick={() => setIsAddModalOpen(true)} className="add-item-button">Add New Item</button>
                </div>
            </div>

            {loading ? <p>Loading items...</p> : (
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Re-order Level</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length > 0 ? filteredItems.map(item => (
                            <tr key={item._id} className={item.quantity <= item.reorderLevel ? 'low-stock-row' : ''}>
                                <td>{item.name}</td>
                                <td>{item.category}</td>
                                <td>{item.quantity}</td>
                                <td>{item.unit}</td>
                                <td>{item.reorderLevel}</td>
                                <td>
                                    {item.quantity > item.reorderLevel ?
                                        <span className="status-badge status-ok">In Stock</span> :
                                        <span className="status-badge status-low">Low Stock</span>
                                    }
                                </td>
                                <td>
                                    <button onClick={() => openUpdateModal(item)} className="action-button">Update</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="7">No items found for this view.</td></tr>
                        )}
                    </tbody>
                </table>
            )}

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Inventory Item">
                <AddItemForm onAddItem={handleAddItem} onClose={() => setIsAddModalOpen(false)} />
            </Modal>

            <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Update Inventory Item">
                {selectedItem && (
                    <UpdateItemForm item={selectedItem} onUpdateItem={handleUpdateItem} onClose={() => setIsUpdateModalOpen(false)} />
                )}
            </Modal>
        </div>
    );
};

export default InventoryPage;