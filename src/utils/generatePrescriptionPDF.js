import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// This function generates the PDF
const generatePrescriptionPDF = (prescriptionDetails, patientDetails, doctorDetails) => {
    // 1. Create a new PDF document
    const doc = new jsPDF();

    // 2. Define colors and fonts
    const primaryColor = '#007bff'; // Or from your CSS variables
    const secondaryColor = '#6c757d';
    const text_color_dark = '#111827';

    // --- HEADER SECTION ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text('Prescription', 105, 20, { align: 'center' });

    // Doctor's Details
    doc.setFontSize(12);
    doc.setTextColor(text_color_dark);
    doc.text(`Dr. ${doctorDetails.firstName} ${doctorDetails.lastName}`, 14, 35);
    doc.setFont('helvetica', 'normal');
    doc.text('MBBS, MD (Cardiology)', 14, 41); // You can pull this from doctor's profile later
    doc.text('Reg. No: 12345', 14, 47);

    // Hospital Details (you can hardcode or fetch this)
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text('Hopewell Hospital', 196, 35, { align: 'right' });
    doc.text('123 Health St, Wellness City', 196, 41, { align: 'right' });
    doc.text('contact@hopewell.com', 196, 47, { align: 'right' });

    // Line separator
    doc.setDrawColor(primaryColor);
    doc.line(14, 55, 196, 55);

    // --- PATIENT DETAILS SECTION ---
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor);
    doc.text('Patient Name:', 14, 65);
    doc.text('Age / Gender:', 14, 71);
    doc.text('Date:', 14, 77);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(text_color_dark);
    doc.text(patientDetails.name, 45, 65);
    doc.text(`${patientDetails.age} / ${patientDetails.gender}`, 45, 71);
    doc.text(new Date(prescriptionDetails.date).toLocaleDateString(), 45, 77);

    doc.text('Patient UHID:', 140, 65);
    doc.text(patientDetails.uhid, 165, 65);

    // --- MEDICATION TABLE SECTION ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    // The "Rx" symbol is standard for prescriptions
    doc.text('Rx', 14, 95);

    const tableColumn = ["Medicine", "Dosage", "Frequency", "Duration"];
    const tableRows = [];

    prescriptionDetails.medications.forEach(med => {
        const medData = [
            med.medicineName,
            med.dosage,
            med.frequency,
            med.duration,
        ];
        tableRows.push(medData);
    });

    // Use autoTable plugin for a professional table
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 100,
        theme: 'grid',
        headStyles: {
            fillColor: [79, 70, 229], // --primary-color in RGB
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            cellPadding: 3,
            fontSize: 11,
        },
        alternateRowStyles: {
            fillColor: [243, 246, 246] // Light gray
        }
    });

    let finalY = doc.lastAutoTable.finalY || 100; // Get the Y position after the table

    // --- FOOTER SECTION ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text('Doctor\'s Signature:', 14, finalY + 30);
    // Draw a line for signature
    doc.setDrawColor(secondaryColor);
    doc.line(14, finalY + 32, 80, finalY + 32);

    doc.setFontSize(8);
    doc.text('This is a digitally generated prescription and does not require a physical signature.', 105, 280, { align: 'center' });


    // 3. Save the PDF
    doc.save(`Prescription-${patientDetails.name.replace(' ', '_')}-${prescriptionDetails.date}.pdf`);
};

export default generatePrescriptionPDF;