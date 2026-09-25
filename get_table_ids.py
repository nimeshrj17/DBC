import requests

base_url = "https://firestore.googleapis.com/v1/projects/dbcafe-3f5ee/databases/(default)/documents/tables?pageSize=100"
res = requests.get(base_url)
data = res.json()

for doc in data.get('documents', []):
    doc_id = doc.get('name', '').split('/')[-1]
    name = doc.get('fields', {}).get('name', {}).get('stringValue', '')
    number = doc.get('fields', {}).get('number', {}).get('integerValue', 'None')
    print(f"ID: {doc_id} -> Name: {name}, Number: {number}")
