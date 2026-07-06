import sqlite3

def main():
    db_path = r"C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\om_processing.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, status, checkpoint_stage FROM articles")
    rows = cursor.fetchall()
    print("Articles in database:")
    for row in rows:
        print(f"  ID: {row[0]}, Filename: {row[1]}, Status: {row[2]}, Checkpoint: {row[3]}")
    conn.close()

if __name__ == "__main__":
    main()
