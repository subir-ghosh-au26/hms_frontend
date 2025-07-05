import * as XLSX from 'xlsx';

// A generic utility to export an array of objects to an Excel file
export const exportToExcel = (data, fileName, sheetName) => {
    // 1. Create a new workbook
    const wb = XLSX.utils.book_new();

    // 2. Convert the array of objects to a worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Optional: Set column widths for better readability
    // This is an example; you might need to adjust based on your data
    const columnWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, 15) // Set width to at least 15 characters or length of the header
    }));
    ws['!cols'] = columnWidths;

    // 3. Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1');

    // 4. Generate the Excel file and trigger the download
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// A specific function tailored for exporting staff data
export const exportStaffData = (staffList) => {
    // 1. Format the data to be more human-readable for the Excel sheet
    const formattedData = staffList.map(staff => ({
        'First Name': staff.firstName,
        'Last Name': staff.lastName,
        'Role': staff.role,
        'Email': staff.email,
        'Phone Number': staff.phone || 'N/A',
        'Joining Date': new Date(staff.joiningDate).toLocaleDateString(),
        'Date of Birth': staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : 'N/A',
        'Blood Group': staff.bloodGroup || 'N/A',
        'Address': staff.address || 'N/A',
        'Specialization': staff.specialization || 'N/A',
        'Qualifications': staff.qualifications || 'N/A',
    }));

    // 2. Call the generic export utility with the formatted data
    exportToExcel(formattedData, `Staff_Directory_${new Date().toISOString().slice(0, 10)}`, 'Staff List');
};