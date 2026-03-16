import os
import re

imgs = os.listdir('public/images')

def find_matches(month_prefixes, day):
    results = []
    for p in month_prefixes:
        results.extend([i for i in imgs if re.match(rf'^{p}0?{day}[A-Z\.]', i, re.IGNORECASE)])
    return results

targets = [
    ('The Final Verdict', ['September', 'Sept'], '3'),
    ('The Final, Sane Prescription', ['November', 'Nov'], '7'),
    ('The Final, Sane Diagnosis', ['December', 'Dec'], '6'),
    ('The Final Poll', ['August', 'Aug'], '30'),
    ('The Final Polite Request', ['August', 'Aug'], '4'),
    ('The Final Philosophy of a Dying Age', ['November', 'Nov'], '29'),
    ('The Final Ghost of a Dead Idea', ['September', 'Sept'], '21'),
    ('The Final Fantasy', ['December', 'Dec'], '2'),
    ('The Final Calculation', ['November', 'Nov'], '28'),
    ('The Final Calculation Before the Flood', ['August', 'Aug'], '15')
]

mapping = {}
print("Matches:")
for title, prefixes, day in targets:
    found = find_matches(prefixes, day)
    print(f"{title} ({prefixes[0]} {day}): {found}")
    if found:
        mapping[title] = found[0]

import json
print("\nMapping:")
print(json.dumps(mapping, indent=2))
