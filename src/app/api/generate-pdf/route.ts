import { NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();
    
    // Add a blank page to the document
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    
    // Draw Header
    page.drawText('Final Employee Evaluation Report', { x: 50, y: height - 50, size: 20 });
    page.drawText(`Employee Name: ${data.employeeName || 'N/A'}`, { x: 50, y: height - 90, size: 12 });
    page.drawText(`Department: ${data.department || 'N/A'}`, { x: 50, y: height - 110, size: 12 });
    
    // Draw Manager Rating
    page.drawText('Manager Overall Rating:', { x: 50, y: height - 150, size: 14 });
    page.drawText(`${data.overallRating || 'N/A'} / 5`, { x: 220, y: height - 150, size: 14, color: rgb(0, 0, 0.8) });

    page.drawText('Manager Comments:', { x: 50, y: height - 190, size: 14 });
    page.drawText(`${data.overallComments || 'No comments provided.'}`, { x: 50, y: height - 210, size: 12, maxWidth: 500 });

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="evaluation_report.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
