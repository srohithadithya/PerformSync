import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/utils/rate-limit';

const PdfRequestSchema = z.record(z.any()); // Accept standard object format, validate deeply if needed

export async function POST(request: Request) {
  try {
    // 1. Authentication Check (Zero Trust)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Secure session required.' }, { status: 401 });
    }

    // 2. Rate Limiting (Abuse Protection - max 5 per minute)
    const isAllowed = checkRateLimit(`generate-pdf:${user.id}`, 5, 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too Many Requests for PDF Generation.' }, { status: 429 });
    }

    // 3. Basic Input Validation
    const rawData = await request.json();
    const validationResult = PdfRequestSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }

    const data = validationResult.data;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([600, 800]);
    let { width, height } = page.getSize();
    let currentY = height - 50;
    const margin = 50;

    const addNewPage = () => {
      page = pdfDoc.addPage([600, 800]);
      currentY = height - 50;
    };

    const drawText = (text: string, size = 10, isBold = false, color = rgb(0,0,0)) => {
      if (currentY < 50) addNewPage();
      page.drawText(String(text || 'N/A'), {
        x: margin,
        y: currentY,
        size,
        font: isBold ? boldFont : font,
        color
      });
      currentY -= (size + 6);
    };

    const drawWrappedText = (text: string, maxWidth = 500, size = 10) => {
      const words = String(text || '').split(' ');
      let line = '';
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const textWidth = font.widthOfTextAtSize(testLine, size);
        if (textWidth > maxWidth && i > 0) {
          drawText(line, size);
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      drawText(line, size);
    };

    // --- Header ---
    drawText('OFFICIAL PERFORMANCE EVALUATION REPORT', 18, true, rgb(0, 0.2, 0.6));
    currentY -= 10;
    drawText(`Employee Name: ${data.employeeName || 'N/A'}`, 12, true);
    drawText(`Employee ID: ${data.employeeId || 'N/A'}`, 12);
    drawText(`Department: ${data.department || 'N/A'}`, 12);
    drawText(`Designation: ${data.designation || 'N/A'}`, 12);
    drawText(`Review Period: ${data.reviewPeriod || 'N/A'}`, 12);
    drawText(`Date: ${data.date || 'N/A'}`, 12);
    drawText(`Employment Type: ${data.employmentType || 'N/A'}`, 12);
    
    currentY -= 20;

    // --- Employee Assessment Sections ---
    drawText('PART 1: EMPLOYEE SELF-ASSESSMENT', 14, true, rgb(0.2, 0.2, 0.2));
    currentY -= 10;

    // Achievements
    drawText('Key Achievements & Results:', 12, true);
    drawWrappedText(data.keyAchievements || 'None provided.', 500, 10);
    currentY -= 15;

    // Self Reflection
    drawText('Self-Reflection:', 12, true);
    drawText('Challenges Encountered:', 10, true);
    drawWrappedText(data.selfReflection?.challenges || 'N/A', 500, 10);
    currentY -= 10;
    
    drawText('Areas for Development:', 10, true);
    drawWrappedText(data.selfReflection?.areasForDevelopment || 'N/A', 500, 10);
    currentY -= 20;

    // --- Manager Review Sections ---
    if (currentY < 200) addNewPage(); // Ensure manager review starts on a good page
    drawText('PART 2: MANAGER REVIEW & FEEDBACK', 14, true, rgb(0.2, 0.2, 0.2));
    currentY -= 10;
    
    const mgr = data.managerReview || {};
    
    drawText('Manager Overall Comments:', 12, true);
    drawWrappedText(mgr.overallComments || 'No comments provided.', 500, 10);
    currentY -= 10;
    
    drawText('Development Recommendations:', 12, true);
    drawWrappedText(mgr.developmentRecommendations || 'No recommendations provided.', 500, 10);
    currentY -= 10;

    drawText(`OVERALL RATING: ${mgr.overallRating || 'N/A'} / 5`, 14, true, rgb(0, 0, 0.8));
    currentY -= 30;

    // --- Declarations & Signatures ---
    if (currentY < 150) addNewPage(); // Ensure signatures don't get cut off
    drawText('PART 3: DECLARATIONS & SIGNATURES', 14, true, rgb(0.2, 0.2, 0.2));
    currentY -= 10;

    drawWrappedText('The employee and manager have formally reviewed and accepted the company norms and policies regarding this performance evaluation.', 500, 10);
    currentY -= 20;

    drawText('Employee Signature:', 12, true);
    if (data.employeeSignatureImage) {
      try {
        const imgStr = data.employeeSignatureImage.split(',')[1];
        const imgBytes = Buffer.from(imgStr, 'base64');
        const embeddedImg = await pdfDoc.embedPng(imgBytes);
        const { width: w, height: h } = embeddedImg.scale(0.3);
        page.drawImage(embeddedImg, { x: margin, y: currentY - h, width: w, height: h });
        currentY -= (h + 10);
      } catch (e) {
        drawText('Error embedding image', 12, false, rgb(1,0,0));
      }
    } else {
      drawText(data.employeeSignature || 'Not Signed', 12, false, rgb(0, 0.3, 0));
    }
    drawText(`Date: ${data.employeeSignatureDate || 'N/A'}`, 10);
    
    currentY -= 20;

    drawText('Manager / HR Signature:', 12, true);
    if (mgr.managerSignatureImage) {
      try {
        const imgStr = mgr.managerSignatureImage.split(',')[1];
        const imgBytes = Buffer.from(imgStr, 'base64');
        const embeddedImg = await pdfDoc.embedPng(imgBytes);
        const { width: w, height: h } = embeddedImg.scale(0.3);
        page.drawImage(embeddedImg, { x: margin, y: currentY - h, width: w, height: h });
        currentY -= (h + 10);
      } catch (e) {
        drawText('Error embedding image', 12, false, rgb(1,0,0));
      }
    } else {
      drawText(mgr.managerSignature || 'Not Signed', 12, false, rgb(0, 0.3, 0));
    }
    drawText(`Date: ${mgr.managerSignatureDate || 'N/A'}`, 10);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Evaluation_${data.employeeName || 'Employee'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
