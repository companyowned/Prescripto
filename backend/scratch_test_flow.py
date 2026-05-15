import asyncio
import httpx
import uuid

async def test_flow():
    base_url = "http://localhost:8000/api/v1"
    
    unique_id = str(uuid.uuid4())[:8]
    owner_email = f"owner_{unique_id}@example.com"
    req_email = f"requester_{unique_id}@example.com"
    
    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        # 1. Register User 1 (Owner)
        r1 = await client.post("/auth/register", json={
            "email": owner_email,
            "password": "password123",
            "full_name": "Owner User"
        })
        print("Register Owner:", r1.status_code, r1.json())
        
        # Register User 2 (Requester)
        r2 = await client.post("/auth/register", json={
            "email": req_email,
            "password": "password123",
            "full_name": "Requester User"
        })
        print("Register Requester:", r2.status_code, r2.json())

        # Login Owner
        login1 = await client.post("/auth/login", data={
            "username": owner_email,
            "password": "password123"
        })
        token1 = login1.json().get("access_token")
        headers1 = {"Authorization": f"Bearer {token1}"}

        # Login Requester
        login2 = await client.post("/auth/login", data={
            "username": req_email,
            "password": "password123"
        })
        token2 = login2.json().get("access_token")
        headers2 = {"Authorization": f"Bearer {token2}"}

        # Create Profile for Owner
        prof = await client.post("/profiles", json={
            "full_name": "Owner Profile",
            "relationship_to_owner": "self"
        }, headers=headers1)
        profile_id = prof.json()["id"]
        print("Profile created:", profile_id)

        # Issue QR
        qr_resp = await client.get(f"/profiles/{profile_id}/link-qr", headers=headers1)
        qr_token = qr_resp.json()["token"]
        print("QR token generated:", qr_token)

        # Requester Previews QR
        preview = await client.post("/profile-links/preview", json={"token": qr_token}, headers=headers2)
        print("Requester previewed QR:", preview.json())

        # Requester sends Link Request
        req_body = {
            "token": qr_token,
            "relationship_to_subject": "friend",
            "permissions": {
                "can_read_prescriptions": True,
                "can_read_documents": False,
                "can_read_reminders": True,
                "can_read_family_profile": True,
                "can_read_medical_history": True
            }
        }
        req_resp = await client.post("/profile-links/request", json=req_body, headers=headers2)
        request_id = req_resp.json()["id"]
        print("Link request created:", request_id)

        # Owner views incoming requests
        incoming = await client.get("/profile-links/incoming", headers=headers1)
        print("Owner incoming requests:", len(incoming.json()["requests"]))

        # Owner accepts request
        accept = await client.post(f"/profile-links/{request_id}/accept", headers=headers1)
        print("Owner accepted request:", accept.json()["status"])
        
        print("=== TEST COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(test_flow())
