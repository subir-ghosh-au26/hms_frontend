// A simple utility to get the start and end dates of a week for a given date
export const getWeekRange = (date) => {
    const d = new Date(date);
    // Set to the beginning of the day to avoid timezone issues
    d.setHours(0, 0, 0, 0);

    // 0 = Sunday, 1 = Monday, etc.
    const dayOfWeek = d.getDay();
    // If day is Sunday (0), we subtract 0. If Monday (1), we subtract 1, etc.
    const startDate = new Date(d);
    startDate.setDate(d.getDate() - dayOfWeek);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return { startDate, endDate };
};

// Generates an array of all 7 date objects for a given week's start date
export const getWeekDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
    }
    return days;
};