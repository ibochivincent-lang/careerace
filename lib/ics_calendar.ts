/**
 * iCalendar (.ics) Event Generator for CareerAce Application Follow-ups
 * Standard RFC 5545 compliant calendar export
 */

function formatIcsDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export interface FollowUpEventParams {
  role?: string;
  jobTitle?: string;
  company: string;
  contactEmail?: string;
  appliedDate?: Date | string | number;
  followUpDate?: Date | string | number;
  applicationUrl?: string;
  notes?: string;
}

export function generateFollowUpIcsContent(params: FollowUpEventParams): string {
  const roleName = params.role || params.jobTitle || 'Application';
  const applied = params.appliedDate ? new Date(params.appliedDate) : new Date();
  const followUpDate = params.followUpDate
    ? new Date(params.followUpDate)
    : new Date(applied.getTime() + 7 * 24 * 60 * 60 * 1000);
  followUpDate.setHours(9, 0, 0, 0); // 9:00 AM

  const endDate = new Date(followUpDate.getTime() + 30 * 60 * 1000); // 30 min duration
  const now = new Date();
  const uid = `careerace-followup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@careerace.online`;

  const summary = `Follow up: ${roleName} at ${params.company}`;
  const description = `Milestone 7-Day Follow-Up on your application for ${roleName} at ${params.company}.\\nRecruiter Contact: ${params.contactEmail || 'Hiring Team'}\\n${params.notes ? params.notes + '\\n' : ''}Sent via CareerAce Sovereign Application System.`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CareerAce//Application Follow-Up System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDateTime(now)}`,
    `DTSTART:${formatIcsDateTime(followUpDate)}`,
    `DTEND:${formatIcsDateTime(endDate)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: 7-Day Follow-Up for ${params.company}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadFollowUpIcs(params: FollowUpEventParams): void {
  if (typeof window === 'undefined') return;
  const content = generateFollowUpIcsContent(params);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanCompany = (params.company || 'Job').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `FollowUp_${cleanCompany}_7Day.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
