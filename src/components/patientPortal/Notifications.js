import React, { useState, useEffect, useCallback } from 'react';
import { usePatientAuth } from '../../context/PatientAuthContext';
import api from '../../api/api';
import './Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState('');
    const { isPatientAuthenticated } = usePatientAuth();

    const fetchNotifications = useCallback(async () => {
        if (!isPatientAuthenticated) return;

        setError(''); // Reset error on new fetch
        try {
            // --- UPDATED API ENDPOINT ---
            const { data } = await api.get('/notifications/patient');
            setNotifications(data);
        } catch (error) {
            console.error("FETCH FAILED:", error);
            setError('Could not load notifications.');
        }
    }, [isPatientAuthenticated]);

    // Initial fetch on component mount
    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 1500); // Poll every 15 seconds

        // Cleanup function to stop polling when the component unmounts
        return () => clearInterval(intervalId);

    }, [fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleToggle = async () => {
        const nextState = !isOpen;
        setIsOpen(nextState);

        if (nextState && unreadCount > 0) {
            try {
                // --- UPDATED API ENDPOINT ---
                await api.patch('/notifications/patient/mark-read');
                // Optimistically update the UI without waiting for another fetch
                const readNotifications = notifications.map(n => ({ ...n, isRead: true }));
                setNotifications(readNotifications);
                console.log("UI updated to show notifications as read.");
            } catch (err) {
                console.error("MARK AS READ FAILED:", err);
            }
        }
    };

    return (
        <div className="notifications-container">
            <button onClick={handleToggle} className="notifications-bell">
                🔔
                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>
            {isOpen && (
                <div className="notifications-dropdown">
                    {notifications.length > 0 ? (
                        notifications.map(n => (
                            <div key={n._id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`}>
                                <p>{n.message}</p>
                                <small>{new Date(n.createdAt).toLocaleString()}</small>
                            </div>
                        ))
                    ) : (
                        <div className="notification-item">No notifications yet.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notifications;