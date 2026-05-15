import sqlite3
import os

db_path = r"C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\om_processing.db"

if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT count(*) FROM articles WHERE status != 'RESOLVED'")
    pending_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT filename, checkpoint_stage, status FROM articles WHERE status != 'RESOLVED'")
    rows = cursor.fetchall()
    
    print(f"Pending articles: {pending_count}")
    for row in rows:
        print(f"  - {row[0]} (Stage: {row[1]}, Status: {row[2]})")
    
    conn.close()
