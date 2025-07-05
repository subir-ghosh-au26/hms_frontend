import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import './ManageSchedule.css'; // We'll create this CSS file

const ManageSchedule = () => {
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const { data } = await api.get('/schedules/my-schedule');
                setSchedule(data);
            } catch (err) {
                setError('Failed to fetch schedule.');
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, []);

    const handleAvailabilityChange = (dayIndex, field, value) => {
        const updatedAvailability = [...schedule.weeklyAvailability];
        updatedAvailability[dayIndex][field] = value;

        // If they toggle availability off, the times are irrelevant but we keep them
        if (field === 'isAvailable' && !value) {
            // You might want to clear times or handle this differently
        }

        setSchedule({ ...schedule, weeklyAvailability: updatedAvailability });
    };

    const handleSaveChanges = async () => {
        setMessage('');
        setError('');
        try {
            const { data } = await api.put('/schedules/my-schedule/availability', {
                weeklyAvailability: schedule.weeklyAvailability
            });
            setSchedule(data);
            setMessage('Schedule updated successfully!');
        } catch (err) {
            setError('Failed to save changes.');
        }
    };

    if (loading) return <p>Loading your schedule...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!schedule) return <p>Could not load schedule data.</p>;

    return (
        <div className="manage-schedule-container">
            <h2 style={{ textAlign: 'center' }}>Manage My Weekly Schedule</h2>
            {message && <p className="success-message">{message}</p>}

            <div className="schedule-table">
                <div className="schedule-header">
                    <div>Day</div>
                    <div>Available?</div>
                    <div>Start Time</div>
                    <div>End Time</div>
                    <div>Slot Duration (min)</div>
                </div>
                {schedule.weeklyAvailability.map((day, index) => (
                    <div key={day.dayOfWeek} className="schedule-row">
                        <div className="day-name">{day.dayOfWeek}</div>
                        <div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={day.isAvailable}
                                    onChange={(e) => handleAvailabilityChange(index, 'isAvailable', e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div>
                            <input
                                type="time"
                                value={day.startTime}
                                disabled={!day.isAvailable}
                                onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="time"
                                value={day.endTime}
                                disabled={!day.isAvailable}
                                onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                value={day.slotDuration}
                                disabled={!day.isAvailable}
                                step="5"
                                min="10"
                                onChange={(e) => handleAvailabilityChange(index, 'slotDuration', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={handleSaveChanges} className="save-button">Save Changes</button>

            {/* We can add the "Block Off Dates" UI here in a future step */}
        </div>
    );
};

export default ManageSchedule;