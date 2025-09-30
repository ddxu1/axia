#!/usr/bin/env python3
"""
Test API endpoints with real email data
"""

import requests
import json

def test_emails_endpoint():
    """Test the emails API endpoint"""
    print("📧 Testing /emails endpoint...")

    # Read JWT token
    try:
        with open("jwt_token.txt", "r") as f:
            jwt_token = f.read().strip()
    except FileNotFoundError:
        print("❌ JWT token file not found")
        return False

    headers = {"Authorization": f"Bearer {jwt_token}"}

    # Test emails endpoint
    response = requests.get("http://localhost:8000/emails", headers=headers)

    if response.status_code == 200:
        data = response.json()
        print(f"✅ API Success!")
        print(f"📊 Total emails: {data['total']}")
        print(f"📄 Current page: {data['page']}")
        print(f"📝 Per page: {data['per_page']}")
        print(f"📮 Emails returned: {len(data['emails'])}")

        if data['emails']:
            email = data['emails'][0]
            print(f"\n📧 Latest email:")
            print(f"   Subject: {email['subject']}")
            print(f"   From: {email['from_address']}")
            print(f"   Read: {email['is_read']}")
            print(f"   Gmail ID: {email['gmail_id'][:20]}...")

        return True
    else:
        print(f"❌ API Error: {response.status_code}")
        print(response.text)
        return False

def test_specific_email():
    """Test getting a specific email"""
    print("\n🔍 Testing specific email endpoint...")

    try:
        with open("jwt_token.txt", "r") as f:
            jwt_token = f.read().strip()
    except FileNotFoundError:
        print("❌ JWT token file not found")
        return False

    headers = {"Authorization": f"Bearer {jwt_token}"}

    # Get first email ID
    response = requests.get("http://localhost:8000/emails?per_page=1", headers=headers)

    if response.status_code == 200:
        data = response.json()
        if data['emails']:
            email_id = data['emails'][0]['id']
            print(f"📧 Testing email ID: {email_id}")

            # Test specific email endpoint
            detail_response = requests.get(f"http://localhost:8000/emails/{email_id}", headers=headers)

            if detail_response.status_code == 200:
                email_detail = detail_response.json()
                print(f"✅ Email detail success!")
                print(f"   Subject: {email_detail['subject']}")
                print(f"   Body preview: {email_detail['body_text'][:100] if email_detail['body_text'] else 'No text body'}...")
                return True
            else:
                print(f"❌ Email detail error: {detail_response.status_code}")
                return False
    else:
        print(f"❌ Could not get email list: {response.status_code}")
        return False

def test_search():
    """Test email search"""
    print("\n🔎 Testing email search...")

    try:
        with open("jwt_token.txt", "r") as f:
            jwt_token = f.read().strip()
    except FileNotFoundError:
        print("❌ JWT token file not found")
        return False

    headers = {"Authorization": f"Bearer {jwt_token}"}

    # Search for emails with "test" in subject
    response = requests.get("http://localhost:8000/emails?search=test", headers=headers)

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Search success!")
        print(f"🔍 Found {data['total']} emails with 'test'")
        return True
    else:
        print(f"❌ Search error: {response.status_code}")
        return False

def main():
    print("🧪 Testing Email API Endpoints")
    print("=" * 35)

    # Test 1: Basic emails endpoint
    success1 = test_emails_endpoint()

    # Test 2: Specific email
    success2 = test_specific_email()

    # Test 3: Search
    success3 = test_search()

    print(f"\n📋 Results Summary:")
    print(f"   Emails endpoint: {'✅' if success1 else '❌'}")
    print(f"   Email detail: {'✅' if success2 else '❌'}")
    print(f"   Search: {'✅' if success3 else '❌'}")

    if success1 and success2 and success3:
        print(f"\n🎉 All API tests passed! Your backend is ready for frontend integration!")
        return True
    else:
        print(f"\n⚠️  Some tests failed. Check the errors above.")
        return False

if __name__ == "__main__":
    main()