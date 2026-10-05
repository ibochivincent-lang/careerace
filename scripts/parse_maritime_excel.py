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

for fp in files:
    if not os.path.exists(fp):
        continue
    with zipfile.ZipFile(fp, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for elem in tree.iter():
                if elem.tag.endswith('}t') or elem.tag == 't':
                    shared_strings.append(elem.text or '')
        
        sheet_files = [n for n in z.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')]
        for s_file in sheet_files:
            s_tree = ET.fromstring(z.read(s_file))
            sheet_rows = []
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
                    sheet_rows.append(r_vals)
            
            # Inspect rows
            for r in sheet_rows:
                row_str = ' '.join(r)
                found_emails = email_regex.findall(row_str)
                if not found_emails:
                    continue
                # Determine company name
                # Usually row has [Code, Company, Country, ...] or [Company, Country, ...] or [Country, Company, ...]
                company = ''
                location = ''
                description = ''
                
                # Check candidate positions for company name
                for val in r:
                    val_clean = val.strip()
                    if not val_clean or '@' in val_clean or 'http' in val_clean or 'www' in val_clean or len(val_clean) < 3:
                        continue
                    if any(header_word in val_clean.lower() for header_word in ['directory', 'company name', 'country', 'email', 'contact', 'verification']):
                        continue
                    if not company:
                        company = val_clean
                    elif not location and len(val_clean) < 40 and not any(w in val_clean.lower() for w in ['program', 'fleet', 'carrier', 'portal', 'annual']):
                        location = val_clean
                    elif not description:
                        description = val_clean
                
                if not company:
                    company = 'Maritime Operator'
                if not location:
                    location = 'Global / Offshore'
                if not description:
                    description = 'Commercial shipping, crewing, and offshore technical operations'
                
                for em in found_emails:
                    em_low = em.lower().strip().rstrip('.,;')
                    if em_low in seen_emails:
                        continue
                    # Exclude non-company/dummy emails if any
                    seen_emails.add(em_low)
                    contacts.append({
                        'company': company,
                        'email': em_low,
                        'location': location,
                        'description': description
                    })

print(f"TOTAL EXTRACTED CONTACTS: {len(contacts)}")
with open(r'c:\Users\User\.gemini\antigravity-ide\scratch\careerace\lib\extracted_maritime_contacts.json', 'w', encoding='utf-8') as f:
    json.dump(contacts, f, indent=2)

print("Saved to extracted_maritime_contacts.json successfully.")
