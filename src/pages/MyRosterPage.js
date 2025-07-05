import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { getWeekRange, getWeekDays } from '../utils/dateUtils';
import './MyRosterPage.css'; // We'll create this CSS

const MyRosterPage = () => {
    const { user } = useAuth();
    const [rosterData, setRosterData] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const weekRange = useMemo(() => getWeekRange(currentDate), [currentDate]);
    const weekDays = useMemo(() => getWeekDays(weekRange.startDate), [weekRange.startDate]);

    useEffect(() => {
        const fetchMyRoster = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // We can reuse the existing endpoint and filter locally,
                // or create a dedicated '/my-roster' endpoint on the backend.
                // Reusing is simpler for now.
                const { data } = await api.get('/rosters', {
                    params: {
                        startDate: weekRange.startDate.toISOString().slice(0, 10),
                        endDate: weekRange.endDate.toISOString().slice(0, 10)
                    }
                });
                // Filter the results to only show the logged-in user's shifts
                const myShifts = data.filter(entry => entry.staffMember._id === user._id);
                setRosterData(myShifts);
            } catch (error) {
                console.error("Failed to fetch roster data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyRoster();
    }, [user, weekRange]);

    const rosterMap = useMemo(() => {
        const map = new Map();
        rosterData.forEach(entry => {
            const dateString = new Date(entry.date).toISOString().slice(0, 10);
            map.set(dateString, entry.shiftType);
        });
        return map;
    }, [rosterData]);

    const changeWeek = (amount) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + amount);
        setCurrentDate(newDate);
    };

    if (!user) return <p>Loading user information...</p>;

    return (
        <div className="my-roster-page">
            <h2>My Weekly Roster</h2>
            <div className="roster-controls">
                <button onClick={() => changeWeek(-7)}>Previous Week</button>
                <h3>
                    Week of {weekRange.startDate.toLocaleDateString()} - {weekRange.endDate.toLocaleDateString()}
                </h3>
                <button onClick={() => changeWeek(7)}>Next Week</button>
            </div>

            {loading ? <p>Loading your schedule...</p> : (
                <div className="roster-card-container">
                    {weekDays.map(day => {
                        const dateString = day.toISOString().slice(0, 10);
                        const shiftType = rosterMap.get(dateString) || 'Day-Off';
                        return (
                            <div key={dateString} className={`roster-card shift-${shiftType.toLowerCase().replace('-', '')}`}>
                                <div className="card-header">
                                    {day.toLocaleDateString('en-US', { weekday: 'long' })}
                                    <span className="card-date">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className="card-body">
                                    <p>{shiftType}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyRosterPage;