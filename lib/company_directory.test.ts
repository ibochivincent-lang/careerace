import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VERIFIED_COMPANY_HIRING_CONTACTS } from './company_directory.ts';

describe('VERIFIED_COMPANY_HIRING_CONTACTS', () => {
  it('contains verified company hiring contacts without mock data', () => {
    assert.ok(VERIFIED_COMPANY_HIRING_CONTACTS.length >= 10);

    for (const c of VERIFIED_COMPANY_HIRING_CONTACTS) {
      assert.ok(c.company, `Company name missing for ${JSON.stringify(c)}`);
      assert.match(c.contactEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, `Invalid email format for ${c.company}`);
      assert.ok(!c.contactEmail.includes('example.com'), `Mock email found for ${c.company}`);
      assert.ok(!c.contactEmail.includes('test.com'), `Mock email found for ${c.company}`);
      assert.ok(c.typicalRoles.length > 0, `No typical roles defined for ${c.company}`);
      assert.match(c.careersUrl, /^https?:\/\//, `Invalid career URL for ${c.company}`);
    }
  });

  it('includes maritime sovereign employers mentioned by user', () => {
    const maersk = VERIFIED_COMPANY_HIRING_CONTACTS.find(c => c.company === 'Maersk');
    assert.ok(maersk, 'Maersk not found in directory');
    assert.equal(maersk?.contactEmail, 'careers.marine@maersk.com');
    assert.ok(maersk?.typicalRoles.includes('Engine Cadet'), 'Engine Cadet not in Maersk roles');

    const abs = VERIFIED_COMPANY_HIRING_CONTACTS.find(c => c.company.includes('American Bureau of Shipping'));
    assert.ok(abs, 'ABS not found in directory');
    assert.equal(abs?.contactEmail, 'recruiting@eagle.org');
  });

  it('includes tech sovereign employers', () => {
    const vercel = VERIFIED_COMPANY_HIRING_CONTACTS.find(c => c.company === 'Vercel');
    assert.ok(vercel, 'Vercel not found in directory');
    assert.equal(vercel?.contactEmail, 'careers@vercel.com');

    const stripe = VERIFIED_COMPANY_HIRING_CONTACTS.find(c => c.company === 'Stripe');
    assert.ok(stripe, 'Stripe not found in directory');
    assert.equal(stripe?.contactEmail, 'recruiting@stripe.com');
  });
});
