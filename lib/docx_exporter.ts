import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle
} from "docx";
import type { ParsedCv } from "./cv_parser.ts";

/**
 * Builds a 100% ATS-Compliant Native Microsoft Word (.docx) document
 * Inspired by batbrain9392/cv-builder (BioBot)
 *
 * Rules followed for flawless ATS parsing:
 * 1. Single-column linear layout (no floating text frames or complex multi-column tables).
 * 2. Standard system typography (Calibri/Arial, 10.5pt body, 14pt section headings).
 * 3. Clear horizontal divider rules under major section headers.
 * 4. Standard bullet points with active verb outcome phrasing.
 */
export function buildDocxResume(cv: ParsedCv, customSummary?: string): Document {
  const sectionsChildren: Paragraph[] = [];

  // 1. CANDIDATE NAME (H1, Centered, Bold)
  sectionsChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: (cv.applicant_name || "CANDIDATE").toUpperCase(),
          bold: true,
          size: 32, // 16pt
          font: "Calibri"
        })
      ]
    })
  );

  // 2. CONTACT INFORMATION BAR
  const contactParts: string[] = [
    cv.email,
    cv.phone,
    cv.github_url,
    cv.linkedin_url
  ].filter(Boolean) as string[];

  sectionsChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: contactParts.join("  |  "),
          size: 20, // 10pt
          color: "4B5563",
          font: "Calibri"
        })
      ]
    })
  );

  // Helper to create clean ATS Section Headings
  const createSectionHeader = (title: string): Paragraph => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      border: {
        bottom: {
          color: "D1D5DB",
          space: 4,
          style: BorderStyle.SINGLE,
          size: 6
        }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 24, // 12pt
          color: "111827",
          font: "Calibri"
        })
      ]
    });
  };

  // 3. PROFESSIONAL SUMMARY
  const summaryText = customSummary || `Results-driven software professional with demonstrated experience in ${(cv.skills || []).slice(0, 5).join(", ")}. Proven track record of architecting scalable applications, improving system throughput, and delivering robust full-stack systems.`;
  sectionsChildren.push(createSectionHeader("Professional Summary"));
  sectionsChildren.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: summaryText,
          size: 21,
          font: "Calibri"
        })
      ]
    })
  );

  // 4. TECHNICAL SKILLS
  if (cv.skills && cv.skills.length > 0) {
    sectionsChildren.push(createSectionHeader("Technical Skills"));
    sectionsChildren.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: "Core Competencies: ",
            bold: true,
            size: 21,
            font: "Calibri"
          }),
          new TextRun({
            text: cv.skills.join(" • "),
            size: 21,
            font: "Calibri"
          })
        ]
      })
    );
  }

  // 5. WORK EXPERIENCE
  if (cv.work_experience && cv.work_experience.length > 0) {
    sectionsChildren.push(createSectionHeader("Professional Experience"));

    for (const exp of cv.work_experience) {
      // Role & Company Line
      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: `${exp.role} `,
              bold: true,
              size: 22,
              font: "Calibri"
            }),
            new TextRun({
              text: `— ${exp.company}`,
              italics: true,
              size: 21,
              font: "Calibri"
            }),
            new TextRun({
              text: `  (${exp.duration})`,
              color: "6B7280",
              size: 20,
              font: "Calibri"
            })
          ]
        })
      );

      // Highlights / Bullets
      for (const highlight of exp.highlights || []) {
        sectionsChildren.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: highlight,
                size: 21,
                font: "Calibri"
              })
            ]
          })
        );
      }
    }
  }

  // 6. EDUCATION
  if (cv.academic_history && cv.academic_history.length > 0) {
    sectionsChildren.push(createSectionHeader("Education"));

    for (const edu of cv.academic_history) {
      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: `${edu.degree} in ${edu.field_of_study} `,
              bold: true,
              size: 21,
              font: "Calibri"
            }),
            new TextRun({
              text: `— ${edu.institution}`,
              italics: true,
              size: 21,
              font: "Calibri"
            }),
            new TextRun({
              text: edu.graduation_year ? `  (${edu.graduation_year})` : "",
              color: "6B7280",
              size: 20,
              font: "Calibri"
            })
          ]
        })
      );

      for (const ach of edu.achievements || []) {
        sectionsChildren.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: ach,
                size: 20,
                font: "Calibri"
              })
            ]
          })
        );
      }
    }
  }

  // 7. CERTIFICATIONS & ACHIEVEMENTS
  const allAchievements = [
    ...(cv.certifications || []),
    ...(cv.custom_achievements || [])
  ];

  if (allAchievements.length > 0) {
    sectionsChildren.push(createSectionHeader("Certifications & Key Achievements"));
    for (const ach of allAchievements) {
      sectionsChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: ach,
              size: 21,
              font: "Calibri"
            })
          ]
        })
      );
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: sectionsChildren
      }
    ]
  });
}

/**
 * Generate binary blob of .docx resume for instant client download
 */
export async function generateDocxBlob(cv: ParsedCv, customSummary?: string): Promise<Blob> {
  const doc = buildDocxResume(cv, customSummary);
  return await Packer.toBlob(doc);
}
