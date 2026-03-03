import sqlite3

conn = sqlite3.connect('ehr.db')
cursor = conn.cursor()

try:
    cursor.execute('ALTER TABLE key_envelopes ADD COLUMN wrapped_pdf_key TEXT')
    print('added wrapped_pdf_key to key_envelopes')
except Exception as e:
    print('already exists:', e)

conn.commit()
conn.close()
print('done')