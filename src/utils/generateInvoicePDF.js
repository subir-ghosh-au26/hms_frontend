import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable'; // Ensure it's imported for side-effects if needed

const generateInvoicePDF = (billDetails, patientDetails) => {
    const doc = new jsPDF();

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor('#111827');
    doc.text('INVOICE', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor('#6b7280');
    doc.text('Hopewell Hospital', 196, 15, { align: 'right' });
    doc.text('123 Health St, Wellness City', 196, 21, { align: 'right' });

    // --- Bill & Patient Info ---
    doc.setFontSize(11);
    doc.setTextColor('#374151');
    doc.text(`Bill To: ${patientDetails.firstName} ${patientDetails.lastName}`, 14, 40);
    doc.text(`Patient UHID: ${patientDetails.uhid}`, 14, 46);

    doc.text(`Invoice #: ${billDetails._id.slice(-6).toUpperCase()}`, 196, 40, { align: 'right' });
    doc.text(`Date: ${new Date(billDetails.createdAt).toLocaleDateString()}`, 196, 46, { align: 'right' });

    doc.setDrawColor('#dee2e6');
    doc.line(14, 55, 196, 55);

    // --- Line Items Table ---
    const lineItemsColumns = ["Date", "Description", "Category", "Quantity", "Unit Cost", "Total"];
    const lineItemsRows = billDetails.lineItems.map(item => {
        const itemTimestamp = new Date(parseInt(item._id.toString().substring(0, 8), 16) * 1000);

        return [
            itemTimestamp.toLocaleDateString(),
            item.description,
            item.service.category,
            item.quantity,
            `$${item.cost.toFixed(2)}`,
            `$${(item.cost * item.quantity).toFixed(2)}`
        ];
    });

    autoTable(doc, {
        head: [lineItemsColumns],
        body: lineItemsRows,
        startY: 65,
        theme: 'striped',
        headStyles: { fillColor: '#343a40' },
    });

    // --- Payment History Table ---
    let finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Payment History', 14, finalY);

    const paymentColumns = ["Date", "Payment Method", "Recorded By", "Amount Paid"];
    const paymentRows = billDetails.paymentHistory.map(p => [
        new Date(p.paymentDate).toLocaleString(),
        p.paymentMethod,
        p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : 'N/A',
        `$${p.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [paymentColumns],
        body: paymentRows,
        startY: finalY + 5,
        theme: 'striped',
        headStyles: { fillColor: '#343a40' },
    });

    // --- Financial Summary ---
    finalY = doc.lastAutoTable.finalY + 10;
    const summaryX = 150;
    doc.setFontSize(11);
    doc.text('Subtotal:', summaryX, finalY, { align: 'right' });
    doc.text(`$${billDetails.totalAmount.toFixed(2)}`, 196, finalY, { align: 'right' });

    doc.text('Total Paid:', summaryX, finalY + 6, { align: 'right' });
    doc.text(`$${billDetails.amountPaid.toFixed(2)}`, 196, finalY + 6, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#dc3545');
    doc.text('Balance Due:', summaryX, finalY + 12, { align: 'right' });
    doc.text(`$${(billDetails.totalAmount - billDetails.amountPaid).toFixed(2)}`, 196, finalY + 12, { align: 'right' });

    // --- Footer ---
    doc.setFontSize(9);
    doc.setTextColor('#6c757d');
    doc.text('Thank you for choosing Hopewell Hospital. Please contact billing with any questions.', 105, 285, { align: 'center' });

    doc.save(`Invoice-${patientDetails.uhid}-${new Date(billDetails.createdAt).toISOString().slice(0, 10)}.pdf`);
};

export default generateInvoicePDF;