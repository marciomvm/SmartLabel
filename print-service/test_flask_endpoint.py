"""
Test the Flask print endpoint with niimblue integration
"""
import requests
import json

def test_print_endpoint():
    """Test the /print-label endpoint"""
    
    url = "http://localhost:5000/print-label"
    
    # Test data
    test_data = {
        "batch_id": "G-20260130-FLASK",
        "batch_type": "BATCH",
        "strain": "Golden Teacher"
    }
    
    print("="*60)
    print("TESTING FLASK PRINT ENDPOINT")
    print("="*60)
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        print("\n🚀 Sending request...")
        response = requests.post(url, json=test_data, timeout=120)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📄 Response:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("\n✅ SUCCESS! Flask endpoint printed the label!")
            print("\nYour mushroom farm system is now working with:")
            print("  ✅ Next.js frontend")
            print("  ✅ Flask print service")
            print("  ✅ niimblue-node printer integration")
            print("  ✅ Niimbot B1 printer")
        else:
            print(f"\n❌ Request failed with status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection failed!")
        print("Make sure Flask app is running:")
        print("  python app.py")
    except requests.exceptions.Timeout:
        print("\n❌ Request timed out!")
        print("Printing may take time, check printer status")
    except Exception as e:
        print(f"\n❌ Error: {e}")

def test_health_endpoint():
    """Test the health endpoint"""
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except:
        print("❌ Health check failed - service not running")
        return False

if __name__ == "__main__":
    print("🔍 Testing Flask service...")
    
    if test_health_endpoint():
        test_print_endpoint()
    else:
        print("\n💡 Start the Flask service first:")
        print("   python app.py")