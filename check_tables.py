import requests

base_url = "https://firestore.googleapis.com/v1/projects/dbcafe-3f5ee/databases/(default)/documents/tables?pageSize=100"
res = requests.get(base_url)
data = res.json()

mapping = {
    "room-1": 1, "room-2": 2, "room-3": 3,
    "hall-1": 4, "hall-2": 5,
    "mid-1": 6, "mid-2": 7,
    "tank": 8,
    "left": 9, "right": 10,
    "front 1": 11, "front 2": 12, "front 3": 13,
    "front-1": 11, "front-2": 12, "front-3": 13,
    "outer-1": 14, "outer-2": 15,
    "upper-1": 16, "upper-2": 17, "upper-3": 18, "upper-4": 19,
    "hall 1": 4, "hall 2": 5
}

for doc in data.get('documents', []):
    name = doc.get('fields', {}).get('name', {}).get('stringValue', '')
    number = doc.get('fields', {}).get('number', {}).get('integerValue', 'None')
    print(f"{name}: {number}")
    
    table_name = name.lower().strip()
    if table_name in mapping and str(mapping[table_name]) != str(number):
        new_number = mapping[table_name]
        update_url = f"https://firestore.googleapis.com/v1/{doc['name']}?updateMask.fieldPaths=number"
        payload = {"fields": {"number": {"integerValue": str(new_number)}}}
        requests.patch(update_url, json=payload)
        print(f"-> FIXED {name} to {new_number}")
