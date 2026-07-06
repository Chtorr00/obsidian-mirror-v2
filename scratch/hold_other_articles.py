import sqlite3
import os

def main():
    db_path = r"C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\om_processing.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Put all other pending/in_progress articles on PENDING_HOLD
    cursor.execute("""
        UPDATE articles 
        SET status = 'PENDING_HOLD' 
        WHERE filename != 'falling-fertility-on-the-left.md' 
          AND status IN ('PENDING', 'IN_PROGRESS')
    """)
    print(f"Updated {cursor.rowcount} articles to PENDING_HOLD.")
    
    # Ensure falling-fertility-on-the-left.md is PENDING
    cursor.execute("""
        UPDATE articles 
        SET status = 'PENDING' 
        WHERE filename = 'falling-fertility-on-the-left.md'
    """)
    if cursor.rowcount > 0:
        print("Ensured falling-fertility-on-the-left.md is PENDING.")
    else:
        print("Warning: falling-fertility-on-the-left.md was not found in database.")
        
    conn.commit()
    conn.close()
    
    # Delete pipeline.lock if it exists
    lock_path = r"C:\Users\markj\OneDrive\Documents\AI\OMGraphRag\bridge\pipeline.lock"
    if os.path.exists(lock_path):
        os.remove(lock_path)
        print("Removed pipeline.lock.")

if __name__ == "__main__":
    main()
