import sqlite3
import os

db_path = r'C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\om_processing.db'
if not os.path.exists(db_path):
    print(f"DB not found: {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT status, file_path FROM articles WHERE file_path LIKE '%the-financial-engine-of-the-fracture.md'")
    for r in cur.fetchall():
        print(f"{r[1]}: {r[0]}")
    conn.close()
