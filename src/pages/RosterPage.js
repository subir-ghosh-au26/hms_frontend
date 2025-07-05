import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/api';
import { getWeekRange, getWeekDays } from '../utils/dateUtils';
import './RosterPage.css';

const RosterPage = () => {
    const [staffList, setStaffList] = useState([]);
    const [rosterData, setRosterData] = useState([]);
    const [leaveData, setLeaveData] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Memoize the week range calculation to avoid re-running it on every render
    const weekRange = useMemo(() => getWeekRange(currentDate), [currentDate]);
    const weekDays = useMemo(() => getWeekDays(weekRange.startDate), [weekRange.startDate]);

    // Fetch staff list only once on component mount
    useEffect(() => {
        api.get('/rosters/staff')
            .then(res => setStaffList(res.data))
            .catch(() => setError('Failed to fetch staff list.'));
    }, []);

    const fetchDataForWeek = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const startDate = weekRange.startDate.toISOString().slice(0, 10);
            const endDate = weekRange.endDate.toISOString().slice(0, 10);

            // Fetch both sets of data in parallel
            const [rosterRes, leaveRes] = await Promise.all([
                api.get('/rosters', { params: { startDate, endDate } }),
                api.get('/leaves') // Get all leaves; we'll filter them
            ]);

            setRosterData(rosterRes.data);
            setLeaveData(leaveRes.data); // Store the leave data

        } catch (err) {
            setError('Failed to fetch schedule data.');
        } finally {
            setLoading(false);
        }
    }, [weekRange]);

    useEffect(() => {
        fetchDataForWeek();
    }, [fetchDataForWeek]);

    // Fetch roster data whenever the week changes
    const fetchRosterData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/rosters', {
                params: {
                    startDate: weekRange.startDate.toISOString().slice(0, 10),
                    endDate: weekRange.endDate.toISOString().slice(0, 10)
                }
            });
            setRosterData(data);
        } catch (err) {
            setError('Failed to fetch roster data.');
        } finally {
            setLoading(false);
        }
    }, [weekRange]);

    useEffect(() => {
        fetchRosterData();
    }, [fetchRosterData]);

    const handleShiftChange = async (staffId, date, shiftType) => {
        try {
            // Send the date in YYYY-MM-DD format
            const dateString = date.toISOString().slice(0, 10);
            await api.post('/rosters', {
                staffMember: staffId,
                date: dateString,
                shiftType: shiftType
            });
            // Refetch the data to show the update
            fetchRosterData();
        } catch (err) {
            alert('Failed to update shift. Please try again.');
        }
    };

    const leaveMap = useMemo(() => {
        const map = new Map();
        const approvedLeaves = leaveData.filter(l => l.status === 'Approved');

        approvedLeaves.forEach(leave => {
            let currentDate = new Date(leave.startDate);
            let endDate = new Date(leave.endDate);

            while (currentDate <= endDate) {
                const dateString = currentDate.toISOString().slice(0, 10);
                const key = `${leave.staffMember._id}-${dateString}`;
                map.set(key, leave.leaveType); // Store the type of leave (e.g., 'Sick', 'Casual')
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
        return map;
    }, [leaveData]);

    // Create a map for quick lookup of existing shifts
    const rosterMap = useMemo(() => {
        const map = new Map();
        rosterData.forEach(entry => {
            const dateString = new Date(entry.date).toISOString().slice(0, 10);
            const key = `${entry.staffMember._id}-${dateString}`;
            map.set(key, entry.shiftType);
        });
        return map;
    }, [rosterData]);

    const changeWeek = (amount) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + amount);
        setCurrentDate(newDate);
    };

    return (
        <div className="roster-page">
            <h2>Duty Roster Management</h2>
            <div className="roster-controls">
                <button onClick={() => changeWeek(-7)}>Previous Week</button>
                <h3>
                    Week of {weekRange.startDate.toLocaleDateString()} - {weekRange.endDate.toLocaleDateString()}
                </h3>
                <button onClick={() => changeWeek(7)}>Next Week</button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="roster-grid-container">
                {loading ? <p>Loading Roster...</p> : (
                    <table className="roster-grid">
                        <thead>
                            <tr>
                                <th className="staff-name-header">Staff Member</th>
                                {weekDays.map(day => (
                                    <th key={day.toISOString()}>
                                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                        <br />
                                        {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.map(staff => (
                                <tr key={staff._id}>
                                    <td className="staff-name-cell">
                                        {staff.firstName} {staff.lastName}
                                        <span className="staff-role">{staff.role}</span>
                                    </td>
                                    {weekDays.map(day => {
                                        const dateString = day.toISOString().slice(0, 10);
                                        const rosterKey = `${staff._id}-${dateString}`;

                                        // --- THE CORE LOGIC CHANGE ---
                                        const leaveType = leaveMap.get(rosterKey);

                                        if (leaveType) {
                                            // If the user is on leave, render a read-only cell
                                            return (
                                                <td key={day.toISOString()} className="shift-cell on-leave">
                                                    <span>On Leave</span>
                                                    <small>({leaveType})</small>
                                                </td>
                                            );
                                        }

                                        // If not on leave, render the normal editable dropdown
                                        const currentShift = rosterMap.get(rosterKey) || 'Day-Off';
                                        return (
                                            <td key={day.toISOString()} className={`shift-cell shift-${currentShift.toLowerCase().replace('-', '')}`}>
                                                <select
                                                    value={currentShift}
                                                    onChange={(e) => handleShiftChange(staff._id, day, e.target.value)}
                                                >
                                                    <option value="Day-Off">Day-Off</option>
                                                    <option value="Morning">Morning</option>
                                                    <option value="Evening">Evening</option>
                                                    <option value="Night">Night</option>
                                                    <option value="On-Call">On-Call</option>
                                                </select>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default RosterPage;