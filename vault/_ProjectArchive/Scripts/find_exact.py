import os

imgs = os.listdir('public/images')

targets = [
    ('The Final Verdict', 'Sep 03', ['September3', 'Sept3']),
    ('The Final, Sane Prescription', 'Nov 07', ['November7', 'Nov7']),
    ('The Final, Sane Diagnosis', 'Dec 06', ['December6', 'Dec6']),
    ('The Final Poll', 'Aug 30', ['August30', 'Aug30']),
    ('The Final Polite Request', 'Aug 4', ['August4', 'Aug4']),
    ('The Final Philosophy of a Dying Age', 'Nov 29', ['November29', 'Nov29']),
    ('The Final Ghost of a Dead Idea', 'Sept 21', ['September21', 'Sept21']),
    ('The Final Fantasy', 'Dec 2', ['December2', 'Dec2']),
    ('The Final Calculation', 'Nov 28', ['November28', 'Nov28']),
    ('The Final Calculation Before the Flood', 'Aug 15', ['August15', 'Aug15'])
]

print("Matches:")
all_found = True
mapping = {}
for title, orig_date, prefixes in targets:
    found = []
    for prefix in prefixes:
        found.extend([i for i in imgs if i.lower().startswith(prefix.lower())])
    print(f"{title} ({orig_date}): {found}")
    if found:
        # Assuming only one matching prefix usually, or taking the first one
        mapping[title] = found[0]
    else:
        all_found = False

import json
print("Mapping dict:")
print(json.dumps(mapping, indent=2))
