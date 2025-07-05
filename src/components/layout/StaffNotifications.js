import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import '../patientPortal/Notifications.css';

const StaffNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated } = useAuth(); // Use staff auth context

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            // Call the new staff-specific endpoint
            const { data } = await api.get('/notifications/staff');
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch staff notifications", error);
        }
    }, [isAuthenticated]);

    // This is the core of the real-time update
    useEffect(() => {
        // Fetch immediately on mount
        fetchNotifications();

        // Then, set up an interval to poll for new notifications
        const intervalId = setInterval(() => {
            fetchNotifications();
        }, 1500); // Poll every 15 seconds

        // Cleanup function: This is crucial to prevent memory leaks
        return () => {
            clearInterval(intervalId);
        };
    }, [fetchNotifications]); // Rerun effect if the fetch function changes

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleToggle = async () => {
        const nextState = !isOpen;
        setIsOpen(nextState);

        if (nextState && unreadCount > 0) {
            try {
                // Call the new staff-specific endpoint
                await api.patch('/notifications/staff/mark-read');
                const readNotifications = notifications.map(n => ({ ...n, isRead: true }));
                setNotifications(readNotifications);
            } catch (error) {
                console.error("Failed to mark staff notifications as read", error);
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

export default StaffNotifications;