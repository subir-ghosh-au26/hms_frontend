import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const generateStaffReportPDF = (staffDetails) => {
    const doc = new jsPDF();

    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Staff Member Profile', 105, 22, { align: 'center' });

    // --- PROFILE PICTURE PLACEHOLDER ---
    doc.setDrawColor('#dee2e6');
    doc.rect(14, 30, 40, 40); // x, y, width, height
    doc.setTextColor('#6c757d');
    doc.setFontSize(10);
    doc.text('Photo', 34, 52, { align: 'center' });

    // --- PERSONAL DETAILS ---
    autoTable(doc, {
        body: [
            ['Name', `${staffDetails.firstName} ${staffDetails.lastName}`],
            ['Role', staffDetails.role],
            ['Joining Date', new Date(staffDetails.joiningDate).toLocaleDateString()],
            ['Phone', staffDetails.phone || 'N/A'],
            ['Email', staffDetails.email],
            ['Blood Group', staffDetails.bloodGroup || 'N/A'],
        ],
        startY: 30,
        startX: 60,
        theme: 'plain',
        styles: { fontSize: 11 },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });

    let finalY = doc.lastAutoTable.finalY;

    // --- LEAVE BALANCE SECTION ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Leave Summary', 14, finalY + 15);

    autoTable(doc, {
        head: [['Total Entitlement', 'Leave Taken', 'Leave Balance']],
        body: [[
            `${staffDetails.totalLeaveDays} days`,
            `${staffDetails.leaveTaken} days`,
            `${staffDetails.leaveBalance} days`
        ]],
        startY: finalY + 20,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
    });

    finalY = doc.lastAutoTable.finalY;

    // --- LEAVE HISTORY TABLE ---
    if (staffDetails.leaves && staffDetails.leaves.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Leave History', 14, finalY + 15);

        const tableColumn = ["Leave Type", "Start Date", "End Date", "Reason", "Status"];
        const tableRows = staffDetails.leaves.map(leave => [
            leave.leaveType,
            new Date(leave.startDate).toLocaleDateString(),
            new Date(leave.endDate).toLocaleDateString(),
            leave.reason,
            leave.status
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: finalY + 20,
            theme: 'grid',
        });
    }

    // --- FOOTER ---
    doc.setFontSize(8);
    doc.setTextColor('#6c757d');
    doc.text(`Report generated on ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

    doc.save(`Staff_Profile-${staffDetails.firstName}_${staffDetails.lastName}.pdf`);
};

export default generateStaffReportPDF;