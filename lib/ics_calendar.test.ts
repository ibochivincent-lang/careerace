import test from 'node:test';
import assert from 'node:assert';
import { generateFollowUpIcsContent } from './ics_calendar.ts';

test('generateFollowUpIcsContent generates valid RFC 5545 calendar event', () => {
  const content = generateFollowUpIcsContent({
    role: 'Marine Systems Engineer',
    company: 'Maersk',
    contactEmail: 'careers.marine@maersk.com',
    appliedDate: '2026-10-01T12:00:00Z',
  });

  assert.ok(content.includes('BEGIN:VCALENDAR'));
  assert.ok(content.includes('VERSION:2.0'));
  assert.ok(content.includes('SUMMARY:Follow up: Marine Systems Engineer at Maersk'));
  assert.ok(content.includes('careers.marine@maersk.com'));
  assert.ok(content.includes('BEGIN:VALARM'));
  assert.ok(content.includes('END:VCALENDAR'));
});
