import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const generateLabReportPDF = (testDetails, patientDetails, doctorDetails) => {
    const doc = new jsPDF();

    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor('#111827');
    doc.text('Laboratory Report', 105, 22, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor('#6b7280');
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });

    // --- PATIENT & TEST INFO TABLE ---
    const patientInfo = [
        ['Patient Name', `${patientDetails.name} (${patientDetails.gender}, ${patientDetails.age} Yrs)`],
        ['Patient UHID', patientDetails.uhid],
        ['Test Name', testDetails.testName],
        ['Referring Doctor', `Dr. ${doctorDetails.firstName} ${doctorDetails.lastName}`]
    ];

    autoTable(doc, {
        body: patientInfo,
        startY: 40,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: '#374151' },
        }
    });

    // --- RESULT SECTION ---
    let finalY = doc.lastAutoTable.finalY + 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor('#111827');
    doc.text('Test Result', 14, finalY);

    doc.setDrawColor('#dee2e6');
    doc.line(14, finalY + 2, 196, finalY + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor('#374151');
    // The 'split_text_to_size' option is crucial for handling long text blocks
    const resultText = doc.splitTextToSize(testDetails.result, 180);
    doc.text(resultText, 14, finalY + 10);

    // --- FOOTER & SIGNATURE ---
    finalY = doc.getTextDimensions(resultText).h > 200 ? 250 : finalY + doc.getTextDimensions(resultText).h + 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#6b7280');
    doc.text('Verified By:', 196, finalY, { align: 'right' });
    doc.text(`${testDetails.technicianName}`, 196, finalY + 5, { align: 'right' });
    doc.text('Licensed Lab Technician', 196, finalY + 10, { align: 'right' });

    // Add a footer line
    doc.line(14, 280, 196, 280);
    doc.text('Hopewell Hospital - Pathology Department', 105, 285, { align: 'center' });

    // Save the PDF
    doc.save(`Lab_Report-${patientDetails.name.replace(' ', '_')}-${testDetails.testName.replace(' ', '_')}.pdf`);
};

export default generateLabReportPDF;