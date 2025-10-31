document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message
  activitiesList.innerHTML = "";
  // Reset activity select (keep placeholder)
  activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic info
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const ul = document.createElement("ul");
          details.participants.forEach((p) => {
            const li = document.createElement("li");

            // participant name/span
            const nameSpan = document.createElement("span");
            nameSpan.textContent = p;

            // delete button (unregister)
            const delBtn = document.createElement("button");
            delBtn.className = "delete-btn";
            delBtn.setAttribute("aria-label", `Unregister ${p}`);
            delBtn.textContent = "🗑";

            // click handler to call the unregister endpoint
            delBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                const result = await resp.json();
                if (resp.ok) {
                  // refresh the activities so availability and participants update
                  await fetchActivities();
                  // show success message
                  messageDiv.textContent = result.message || `Unregistered ${p}`;
                  messageDiv.className = "message success";
                  messageDiv.classList.remove("hidden");

                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                } else {
                  messageDiv.textContent = result.detail || result.message || "Failed to unregister";
                  messageDiv.className = "message error";
                  messageDiv.classList.remove("hidden");
                }
              } catch (err) {
                console.error("Error unregistering:", err);
                messageDiv.textContent = "Failed to unregister. Please try again.";
                messageDiv.className = "message error";
                messageDiv.classList.remove("hidden");
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });
          participantsSection.appendChild(ul);
        } else {
          const noOne = document.createElement("p");
          noOne.className = "no-participants";
          noOne.textContent = "No participants yet — be the first to sign up!";
          participantsSection.appendChild(noOne);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities so the new participant appears without manual reload
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
