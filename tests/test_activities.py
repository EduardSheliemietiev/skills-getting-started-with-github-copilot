from fastapi.testclient import TestClient
from src.app import app, activities
import copy
import pytest
from urllib.parse import quote

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities dict before each test to avoid cross-test pollution."""
    orig = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(copy.deepcopy(orig))


def test_get_activities_returns_data():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # basic sanity checks
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_duplicate_signup():
    activity = "Chess Club"
    email = "test.student@example.com"

    # Signup
    resp = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert resp.status_code == 200
    assert f"Signed up {email} for {activity}" in resp.json().get("message", "")

    # Ensure participant appears in GET
    resp2 = client.get("/activities")
    parts = resp2.json()[activity]["participants"]
    assert email in parts

    # Duplicate signup should fail
    resp3 = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert resp3.status_code == 400
    assert "already signed up" in resp3.json().get("detail", "").lower()


def test_unregister_participant_and_not_found():
    activity = "Programming Class"
    email = "remove.me@example.com"

    # First sign up the user so we can remove them
    resp = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert resp.status_code == 200

    # Now unregister
    resp2 = client.delete(f"/activities/{quote(activity)}/participants", params={"email": email})
    assert resp2.status_code == 200
    assert f"Unregistered {email} from {activity}" in resp2.json().get("message", "")

    # Ensure participant no longer in list
    resp3 = client.get("/activities")
    parts = resp3.json()[activity]["participants"]
    assert email not in parts

    # Try to remove a non-existent participant
    resp4 = client.delete(f"/activities/{quote(activity)}/participants", params={"email": "no.such@x.com"})
    assert resp4.status_code == 404
    assert "not found" in resp4.json().get("detail", "").lower()
