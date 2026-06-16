import sqlite3
import os

db_path = r"C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\om_processing.db"

if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("PRAGMA table_info(articles)")
    columns = cursor.fetchall()
    print("Columns in 'articles' table:")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    cursor.execute("SELECT DISTINCT checkpoint_stage FROM articles ORDER BY checkpoint_stage")
    stages = cursor.fetchall()
    print("\nExisting stages in DB:")
    for s in stages:
        print(f"  - Stage {s[0]}")
    
    conn.close()
