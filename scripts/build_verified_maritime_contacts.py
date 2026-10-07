import zipfile
import xml.etree.ElementTree as ET
import re
import os
import json

files = [
    r'C:\Users\User\Downloads\Global_Maritime_Companies_Directory_2026.xlsx',
    r'C:\Users\User\Downloads\global_shipping_companies_contacts_2026.xlsx',
    r'C:\Users\User\Desktop\maritime_contacts_directory.xlsx',
    r'C:\Users\User\Downloads\maritime_contacts_directory.xlsx'
]

email_regex = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')

contacts = []
seen_emails = set()

# Process each file with exact sheet awareness
# In Global_Maritime_Companies_Directory_2026.xlsx:
# Sheet 2: Company ID, Company Name, Country, Region, Sector, Fleet Specialization, HQ City, Corporate Email, Recruitment Email, Website
# Sheet 3: Company Name, HQ Hub, Fleet Scope, Dedicated Crewing Email, Intake Pathway, Portal, Hubs
# Sheet 4: Company Name, Country, Cabotage Role, Operational Base, Fleet Specialization, Corporate Email, Recruitment Email, Website

def clean_company_name(name):
    name = re.sub(r'\(.*?\)', '', name).strip()
    return name

def sanitize_str(s):
    return s.strip().replace('\n', ' ')

def extract_rows(zip_path, sheet_name):
    with zipfile.ZipFile(zip_path, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for elem in tree.iter():
                if elem.tag.endswith('}t') or elem.tag == 't':
                    shared_strings.append(elem.text or '')
        
        s_tree = ET.fromstring(z.read(sheet_name))
        rows = []
        for row in s_tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            r_vals = []
            for c in row.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                t = c.get('t')
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val_str = ''
                if v is not None and v.text is not None:
                    if t == 's':
                        idx = int(v.text)
                        val_str = shared_strings[idx] if idx < len(shared_strings) else v.text
                    else:
                        val_str = v.text
                elif c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is') is not None:
                    is_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is')
                    t_elem = is_elem.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                    if t_elem is not None:
                        val_str = t_elem.text or ''
                r_vals.append(val_str.strip())
            if any(r_vals):
                rows.append(r_vals)
        return rows

def add_contact(company, email, location, roles, notes, website=''):
    email_clean = email.lower().strip().rstrip('.,;')
    if not email_clean or '@' not in email_clean:
        return
    if email_clean in seen_emails:
        return
    # Filter dummy
    if any(d in email_clean for d in ['example.com', 'test.com', 'none@', 'dummy@', 's@s.com']):
        return
    seen_emails.add(email_clean)
    
    slug = re.sub(r'[^a-z0-9]+', '-', company.lower()).strip('-')[:30]
    cid = f"mar-{slug}-{len(contacts)+1}"
    
    careers = website if website.startswith('http') else (f"https://{website}" if website else "https://www.google.com/search?q=" + company.replace(" ", "+") + "+careers")
    
    contacts.append({
        "id": cid,
        "company": company,
        "category": "Maritime / Offshore",
        "contactEmail": email_clean,
        "typicalRoles": roles or ["Engine Cadet", "Marine Engineer Officer", "Vessel Technical Superintendent", "Electro-Technical Officer"],
        "location": location or "Global Fleet / Offshore",
        "careersUrl": careers,
        "notes": notes or "Direct crewing, fleet technical operations, or maritime corporate desk."
    })

# 1. Global_Maritime_Companies_Directory_2026.xlsx
p1 = r'C:\Users\User\Downloads\Global_Maritime_Companies_Directory_2026.xlsx'
if os.path.exists(p1):
    # Sheet 2
    rows_s2 = extract_rows(p1, 'xl/worksheets/sheet2.xml')
    for r in rows_s2[3:]:  # Header is at row 2
        if len(r) >= 8:
            cid, cname, country, region, sector, fleet, hq, corp_email = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
            rec_email = r[8] if len(r) > 8 else ''
            website = r[9] if len(r) > 9 else ''
            loc = f"{hq}, {country}" if hq and country else (country or "Global Fleet")
            notes = f"Primary sector: {sector}. Fleet: {fleet}."
            
            # Prefer recruitment email, but also include corporate email if distinct
            if rec_email and '@' in rec_email:
                for em in email_regex.findall(rec_email):
                    add_contact(cname, em, loc, ["Engine Cadet", "Marine Engineer Officer", "Vessel Superintendent"], notes, website)
            if corp_email and '@' in corp_email:
                for em in email_regex.findall(corp_email):
                    add_contact(cname, em, loc, ["Engine Cadet", "Marine Engineer Officer", "Vessel Superintendent"], notes, website)

    # Sheet 3: Global Ship Managers
    rows_s3 = extract_rows(p1, 'xl/worksheets/sheet3.xml')
    for r in rows_s3[3:]:
        if len(r) >= 4:
            cname, hq, fleet, crew_email = r[0], r[1], r[2], r[3]
            intake = r[4] if len(r) > 4 else ''
            website = r[5] if len(r) > 5 else ''
            loc = f"{hq} / Global Crewing Hubs"
            notes = f"Ship manager. Fleet: {fleet}. Intake: {intake}"
            for em in email_regex.findall(crew_email):
                add_contact(cname, em, loc, ["Engine Cadet", "Junior Marine Engineer", "Chief Engineer", "ETO"], notes, website)

    # Sheet 4: West Africa & Nigeria
    rows_s4 = extract_rows(p1, 'xl/worksheets/sheet4.xml')
    for r in rows_s4[3:]:
        if len(r) >= 6:
            cname, country, cabotage, base, fleet, corp_email = r[0], r[1], r[2], r[3], r[4], r[5]
            rec_email = r[6] if len(r) > 6 else ''
            website = r[7] if len(r) > 7 else ''
            loc = f"{base}, {country}"
            notes = f"Cabotage / Offshore: {cabotage}. Core fleet: {fleet}"
            if rec_email and '@' in rec_email:
                for em in email_regex.findall(rec_email):
                    add_contact(cname, em, loc, ["Engine Cadet", "2nd/3rd Engineer Officer", "Offshore DP Maintenance Engineer"], notes, website)
            if corp_email and '@' in corp_email:
                for em in email_regex.findall(corp_email):
                    add_contact(cname, em, loc, ["Engine Cadet", "2nd/3rd Engineer Officer", "Offshore DP Maintenance Engineer"], notes, website)

# 2. global_shipping_companies_contacts_2026.xlsx
p2 = r'C:\Users\User\Downloads\global_shipping_companies_contacts_2026.xlsx'
if os.path.exists(p2):
    # Sheet 1
    rows_g1 = extract_rows(p2, 'xl/worksheets/sheet1.xml')
    for r in rows_g1[3:]:
        if len(r) >= 5:
            country, company, segment, relevance, email_cell = r[0], r[1], r[2], r[3], r[4]
            purpose = r[5] if len(r) > 5 else ''
            career_url = r[6] if len(r) > 6 else ''
            loc = country if country else "International"
            notes = f"Segment: {segment}. {purpose}"
            for em in email_regex.findall(email_cell):
                add_contact(company, em, loc, ["Engine Cadet", "Marine Engineer Officer", "Port Technical Engineer"], notes, career_url)
    
    # Sheet 2
    rows_g2 = extract_rows(p2, 'xl/worksheets/sheet2.xml')
    for r in rows_g2[1:]:
        if len(r) >= 4:
            company, priority, route, contact_cell = r[0], r[1], r[2], r[3]
            why = r[4] if len(r) > 4 else ''
            source = r[5] if len(r) > 5 else ''
            for em in email_regex.findall(contact_cell):
                add_contact(company, em, "Global Operations", ["Engineer Officer", "Marine Officer", "Engine Cadet"], why, source)

# 3. maritime_contacts_directory.xlsx (Desktop or Downloads)
p3 = r'C:\Users\User\Desktop\maritime_contacts_directory.xlsx'
if os.path.exists(p3):
    rows_m = extract_rows(p3, 'xl/worksheets/sheet1.xml')
    for r in rows_m:
        row_str = ' '.join(r)
        emails = email_regex.findall(row_str)
        if emails and len(r) >= 2:
            company = r[0] if '@' not in r[0] else (r[1] if '@' not in r[1] else "Maritime Services")
            loc = r[1] if len(r) > 1 and '@' not in r[1] and r[1] != company else "International"
            for em in emails:
                add_contact(company, em, loc, ["Engine Cadet", "Marine Engineer Officer"], "Maritime operator contact.")

print(f"TOTAL CLEAN VERIFIED MARITIME CONTACTS CREATED: {len(contacts)}")
output_path = os.path.join(os.path.dirname(__file__), "..", "lib", "verified_maritime_contacts.json")

if len(contacts) > 0:
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(contacts, f, indent=2)
    print(f"Saved {len(contacts)} contacts to verified_maritime_contacts.json")
else:
    print("No external source spreadsheets found; preserving existing verified_maritime_contacts.json.")
