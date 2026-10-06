import re
import json

with open('lib/company_directory.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract array content
match = re.search(r'export const VERIFIED_COMPANY_HIRING_CONTACTS: CompanyHiringContact\[\] = (\[[\s\S]*\]);', content)
if match:
    data = json.loads(match.group(1))
    print(f"Total contacts: {len(data)}")
    categories = {}
    for item in data:
        cat = item['category']
        categories[cat] = categories.get(cat, 0) + 1
        if cat != 'Maritime / Offshore':
            print(f"- [{cat}] {item['company']} ({item['contactEmail']})")
    print("\nSummary:", categories)
else:
    print("Could not match JSON array")
