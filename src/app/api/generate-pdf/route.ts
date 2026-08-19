import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/utils/rate-limit';
import { evaluationTemplate } from '@/config/evaluation-template';

const PdfRequestSchema = z.record(z.string(), z.any()); 

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Secure session required.' }, { status: 401 });
    }

    const isAllowed = checkRateLimit(`generate-pdf:${user.id}`, 5, 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too Many Requests for PDF Generation.' }, { status: 429 });
    }

    const rawData = await request.json();
    const validationResult = PdfRequestSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }

    const data = validationResult.data as any;

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

    const checkPageBreak = (neededSpace = 50) => {
      if (currentY < neededSpace) addNewPage();
    };

    const drawText = (text: string, size = 10, isBold = false, color = rgb(0,0,0)) => {
      checkPageBreak(size + 10);
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

    const dynamicData = data.dynamicData || {};
    const mgr = data.managerReview || {};

    // --- Dynamic Employee Assessment & Manager Review ---
    drawText('PART 1: ASSESSMENT & FEEDBACK', 14, true, rgb(0.2, 0.2, 0.2));
    currentY -= 10;

    for (const section of evaluationTemplate) {
      checkPageBreak(60);
      drawText(section.title, 12, true, rgb(0, 0, 0.5));
      currentY -= 5;

      const employeeResponse = dynamicData[section.id];
      const managerComment = mgr.sectionComments ? mgr.sectionComments[section.id] : "";

      if (section.type === "text-area") {
        drawWrappedText(employeeResponse || "No response provided.", 500, 10);
      } 
      else if (section.type === "kpi-list") {
        if (Array.isArray(employeeResponse) && employeeResponse.length > 0) {
          employeeResponse.forEach((kpi: any, idx: number) => {
            checkPageBreak(40);
            drawText(`KPI #${idx + 1}: ${kpi.kpi || "N/A"}`, 10, true);
            drawText(`Target: ${kpi.target || "N/A"} | Achieved: ${kpi.achieved || "N/A"} | Status: ${kpi.status || "N/A"}`, 10);
            drawWrappedText(`Comments: ${kpi.comments || "None"}`, 480, 9);
            currentY -= 5;
          });
        } else {
          drawText("No KPIs provided.", 10);
        }
      }
      else if (section.type === "rating-grid" && section.items) {
        section.items.forEach(item => {
          checkPageBreak(50);
          drawText(`• ${item.label}`, 10, true);
          const empVal = employeeResponse?.[item.id] || {};
          const mgrVal = mgr.itemRatings?.[item.id];
          
          drawText(`Employee Rating: ${empVal.rating || "N/A"}/5`, 10);
          drawWrappedText(`Examples: ${empVal.examples || "None"}`, 480, 9);
          if (mgrVal) {
            drawText(`Manager Rating: ${mgrVal}/5`, 10, false, rgb(0, 0.3, 0));
          }
          currentY -= 5;
        });
      }

      if (managerComment) {
        checkPageBreak(40);
        drawText("Manager's Section Feedback:", 10, true, rgb(0, 0.3, 0));
        drawWrappedText(managerComment, 480, 9);
      }
      
      currentY -= 15;
    }

    // --- Overall Manager Review ---
    checkPageBreak(120);
    drawText('PART 2: OVERALL MANAGER REVIEW', 14, true, rgb(0.2, 0.2, 0.2));
    currentY -= 10;
    
    drawText('Manager Overall Comments:', 12, true);
    drawWrappedText(mgr.overallComments || 'No comments provided.', 500, 10);
    currentY -= 10;
    
    drawText('Development Recommendations:', 12, true);
    drawWrappedText(mgr.developmentRecommendations || 'No recommendations provided.', 500, 10);
    currentY -= 10;

    const { employeeAverage, managerAverage, aiCalibrationSummary } = data;

    checkPageBreak(150);
    page.drawText('Employee Self-Assessment Average:', { x: 50, y: currentY, size: 12, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText(`${employeeAverage || 'N/A'} / 5.0`, { x: 260, y: currentY, size: 12, font: font });
    currentY -= 20;

    page.drawText('Official Manager Score:', { x: 50, y: currentY, size: 12, font: boldFont, color: rgb(0, 0, 0.5) });
    page.drawText(`${managerAverage || 'N/A'} / 5.0`, { x: 260, y: currentY, size: 12, font: font, color: rgb(0, 0, 0.5) });
    currentY -= 30;

    if (aiCalibrationSummary) {
      page.drawText('AI Calibration Summary:', { x: 50, y: currentY, size: 12, font: boldFont, color: rgb(0, 0, 0) });
      currentY -= 15;
      
      drawWrappedText(aiCalibrationSummary, 480, 10);
      currentY -= 10;
    }
    currentY -= 30;

    // --- Declarations & Signatures ---
    checkPageBreak(200);
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
