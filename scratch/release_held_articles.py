import sqlite3

def main():
    db_path = r"C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\om_processing.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Update articles on PENDING_HOLD to PENDING
    cursor.execute("""
        UPDATE articles 
        SET status = 'PENDING' 
        WHERE status = 'PENDING_HOLD'
    """)
    print(f"Updated {cursor.rowcount} articles back to PENDING.")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    main()
