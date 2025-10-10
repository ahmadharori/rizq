"""
Simple test script to verify Recipient API endpoints.
Run this after starting the server: python test_recipients.py
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# First, login to get token
def login():
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "admin", "password": "admin123!"}
    )
    if response.status_code == 200:
        token = response.json()["access_token"]
        print("✓ Login successful")
        return token
    else:
        print("✗ Login failed:", response.text)
        return None

def test_create_recipient(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    recipient_data = {
        "name": "Test Recipient",
        "phone": "081234567890",
        "address": "Jl. Test No. 123",
        "province_id": 31,  # DKI Jakarta
        "city_id": 4,       # Jakarta Selatan
        "location": {
            "lat": -6.2088,
            "lng": 106.8456
        },
        "num_packages": 2
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/recipients",
        headers=headers,
        json=recipient_data
    )
    
    if response.status_code == 201:
        recipient = response.json()
        print(f"✓ Created recipient: {recipient['name']} (ID: {recipient['id']})")
        return recipient['id']
    else:
        print("✗ Create recipient failed:", response.status_code, response.text)
        return None

def test_get_recipients(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/recipients",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Retrieved {data['pagination']['total_items']} recipients")
        return True
    else:
        print("✗ Get recipients failed:", response.status_code, response.text)
        return False

def test_get_recipient_detail(token, recipient_id):
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/recipients/{recipient_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        recipient = response.json()
        print(f"✓ Retrieved recipient detail: {recipient['name']}")
        return True
    else:
        print("✗ Get recipient detail failed:", response.status_code, response.text)
        return False

def test_update_recipient(token, recipient_id):
    headers = {"Authorization": f"Bearer {token}"}
    
    update_data = {
        "name": "Updated Test Recipient",
        "phone": "081234567890",
        "address": "Jl. Updated Test No. 456",
        "province_id": 31,
        "city_id": 4,
        "location": {
            "lat": -6.2088,
            "lng": 106.8456
        },
        "num_packages": 3
    }
    
    response = requests.put(
        f"{BASE_URL}/api/v1/recipients/{recipient_id}",
        headers=headers,
        json=update_data
    )
    
    if response.status_code == 200:
        recipient = response.json()
        print(f"✓ Updated recipient: {recipient['name']}")
        return True
    else:
        print("✗ Update recipient failed:", response.status_code, response.text)
        return False

def test_delete_recipient(token, recipient_id):
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.delete(
        f"{BASE_URL}/api/v1/recipients/{recipient_id}",
        headers=headers
    )
    
    if response.status_code == 204:
        print(f"✓ Deleted recipient: {recipient_id}")
        return True
    else:
        print("✗ Delete recipient failed:", response.status_code, response.text)
        return False

def main():
    print("=" * 50)
    print("Testing Recipient API Endpoints")
    print("=" * 50)
    
    # Login
    token = login()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return
    
    print("\n" + "-" * 50)
    print("Test 1: Create Recipient")
    print("-" * 50)
    recipient_id = test_create_recipient(token)
    
    if recipient_id:
        print("\n" + "-" * 50)
        print("Test 2: Get Recipients List")
        print("-" * 50)
        test_get_recipients(token)
        
        print("\n" + "-" * 50)
        print("Test 3: Get Recipient Detail")
        print("-" * 50)
        test_get_recipient_detail(token, recipient_id)
        
        print("\n" + "-" * 50)
        print("Test 4: Update Recipient")
        print("-" * 50)
        test_update_recipient(token, recipient_id)
        
        print("\n" + "-" * 50)
        print("Test 5: Delete Recipient")
        print("-" * 50)
        test_delete_recipient(token, recipient_id)
    
    print("\n" + "=" * 50)
    print("Testing Complete!")
    print("=" * 50)
    print("\nAPI Documentation: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
