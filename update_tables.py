import requests
import json

base_url = "https://firestore.googleapis.com/v1/projects/dbcafe-3f5ee/databases/(default)/documents/tables"
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

if 'documents' in data:
    for doc in data['documents']:
        doc_name = doc['name']
        fields = doc.get('fields', {})
        table_name = fields.get('name', {}).get('stringValue', '').lower().strip()
        
        if table_name in mapping:
            new_number = mapping[table_name]
            # We need to use PATCH to update the number field
            update_url = f"https://firestore.googleapis.com/v1/{doc_name}?updateMask.fieldPaths=number"
            payload = {
                "fields": {
                    "number": {"integerValue": str(new_number)}
                }
            }
            patch_res = requests.patch(update_url, json=payload)
            print(f"Updated {table_name} to {new_number}: {patch_res.status_code}")
        else:
            print(f"No mapping for {table_name}")
else:
    print("No documents found")
