import requests

base_url = "https://firestore.googleapis.com/v1/projects/dbcafe-3f5ee/databases/(default)/documents/tables?pageSize=100"
res = requests.get(base_url)
data = res.json()

for doc in data.get('documents', []):
    name = doc.get('fields', {}).get('name', {}).get('stringValue', '')
    number = doc.get('fields', {}).get('number', {}).get('integerValue', 'None')
    print(f"{name}: {number}")
