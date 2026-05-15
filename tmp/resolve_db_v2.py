import sqlite3

db_path = r"C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\om_processing.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("UPDATE articles SET status = 'RESOLVED', checkpoint_stage = 4 WHERE filename = 'Security guards told not to stop shoplifters.md'")
print(f"Updated Security Guards: {cursor.rowcount} row(s)")

conn.commit()
conn.close()
