import sqlite3

db_path = r"C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\om_processing.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Resolve the security guards article
cursor.execute("UPDATE articles SET status = 'RESOLVED', checkpoint_stage = 4 WHERE filename LIKE '%security-guards-told-not-to-stop-shoplifters%'")
print(f"Updated Security Guards: {cursor.rowcount} row(s)")

# Resolve the Pink Pantheress article (it's already processed as 'the-last-pastel-sunset-of-albion.md')
cursor.execute("UPDATE articles SET status = 'RESOLVED', checkpoint_stage = 4 WHERE filename LIKE '%Pink Pantheress%'")
print(f"Updated Pink Pantheress: {cursor.rowcount} row(s)")

conn.commit()
conn.close()
