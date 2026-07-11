import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateCasePDF = (caseData: any) => {
  if (!caseData) return false;

  try {
    const doc = new jsPDF();
    
    // Header
    // Small header text at the very top
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 190, 15, { align: "right" });
    doc.text("Rakshak-AI Intelligence System", 20, 15);

    // Main Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102);
    doc.text("CONFIDENTIAL CASE REPORT", 105, 27, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 51, 102);
    doc.line(20, 32, 190, 32);
    
    // Case Details title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("1. Case Information", 20, 45);
    
    // Use autotable for standardized format
    autoTable(doc, {
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      body: [
        ['Case ID', caseData.id || 'N/A'],
        ['Incident Type', caseData.type || 'N/A'],
        ['Status', caseData.status || 'N/A'],
        ['Date Filed', caseData.date || 'N/A'],
        ['Assignee', caseData.assignee || 'Unassigned'],
        ['District', caseData.district || 'N/A'],
        ['Location', caseData.location || 'N/A']
      ]
    });
    
    let nextY = (doc as any).lastAutoTable.finalY + 15;
    
    // People Involved
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. People Involved", 20, nextY);
    
    const formatNames = (names: any): string => {
      if (!names) return 'Unknown';
      if (Array.isArray(names)) return names.length > 0 ? names.join(', ') : 'Unknown';
      return String(names);
    };

    autoTable(doc, {
      startY: nextY + 5,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      body: [
        ['Complainant Name(s)', formatNames(caseData.complainantName)],
        ['Victim Name(s)', formatNames(caseData.victimName)],
        ['Primary Suspect(s)', formatNames(caseData.suspectName)],
        ['Filing Officer', caseData.creator || 'Unknown']
      ]
    });
    
    nextY = (doc as any).lastAutoTable.finalY + 15;

    // Evidence Required
    let requiredEvidence = 'Standard physical & digital evidence';
    const cType = (caseData.type || '').toLowerCase();
    if (cType.includes('cyber')) requiredEvidence = 'Server Logs, IP Traces, Device Forensics';
    else if (cType.includes('theft') || cType.includes('burglary')) requiredEvidence = 'CCTV Footage, Fingerprints, Witness Statements';
    else if (cType.includes('assault') || cType.includes('violence')) requiredEvidence = 'Medical Reports, Weapon Recovery, Witness Statements';
    else if (cType.includes('fraud') || cType.includes('financial')) requiredEvidence = 'Bank Statements, Transaction Logs, Audit Reports';
    else if (cType.includes('missing')) requiredEvidence = 'Recent Photographs, Last Known Cell Tower Data, CCTV';
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. Investigation Details", 20, nextY);
    
    autoTable(doc, {
      startY: nextY + 5,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      body: [
        ['Required Evidence', requiredEvidence],
        ['Case Resolution Notes', caseData.status === 'Completed' ? 'Investigation concluded successfully.' : 'Investigation ongoing.']
      ]
    });
    
    nextY = (doc as any).lastAutoTable.finalY + 20;

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("This document contains sensitive intelligence and is for official use only.", 105, 280, { align: "center" });
    
    doc.save(`Case_Report_${caseData.id}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation failed:", err);
    return false;
  }
};
