/* =========================================================
   SMHOS - PEER LISTENER DASHBOARD
   ========================================================= */

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase.js";


/* =========================================================
   ELEMENTS
   ========================================================= */

const peerNameElement =
    document.getElementById("peerName");

const logoutButton =
    document.getElementById("logoutButton");

const availabilityToggle =
    document.getElementById("availabilityToggle");

const availabilityText =
    document.getElementById("availabilityText");

const availabilityHeading =
    document.getElementById("availabilityHeading");

const availabilityDescription =
    document.getElementById("availabilityDescription");

const statusDot =
    document.getElementById("statusDot");

const pendingRequests =
    document.getElementById("pendingRequests");

const activeSessions =
    document.getElementById("activeSessions");

const completedSessions =
    document.getElementById("completedSessions");

const requestsContainer =
    document.getElementById("requestsContainer");

const requestCount =
    document.getElementById("requestCount");

const requestStatusHeading =
    document.getElementById("requestStatusHeading");

const requestStatusDescription =
    document.getElementById("requestStatusDescription");

/* =========================================================
   CURRENT USER
   ========================================================= */

let currentUser = null;
let peerData = null;


/* =========================================================
   AUTHENTICATION + ROLE CHECK
   ========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        console.log("PEER AUTH CHECK:", user);

        if (!user) {

            window.location.replace("../login.html");

            return;
        }

        currentUser = user;

        console.log(
            "AUTHENTICATED UID:",
            currentUser.uid
        );


        try {

            /*
             * Load the user's Firestore profile.
             */

            const userRef =
                doc(db, "users", currentUser.uid);

            const userSnapshot =
                await getDoc(userRef);


            /*
             * Make sure the profile exists.
             */

            if (!userSnapshot.exists()) {

                console.error(
                    "USER PROFILE NOT FOUND."
                );

                alert(
                    "Your SMHOS profile could not be found."
                );

                await signOut(auth);

                window.location.replace("../login.html");

                return;
            }


            peerData =
                userSnapshot.data();

            console.log(
                "USER PROFILE:",
                peerData
            );


            /*
             * IMPORTANT:
             *
             * Only users with role = peer
             * can access this dashboard.
             */

            if (peerData.role !== "peer") {

                console.warn(
                    "ACCESS DENIED. USER ROLE:",
                    peerData.role
                );

                alert(
                    "You do not have permission to access the Peer Listener dashboard."
                );

                window.location.replace(
                    "../student/dashboard.html"
                );

                return;
            }


            /*
             * User is confirmed as a peer.
             */

            loadPeerProfile();

            loadAvailability();

            loadStatistics();

            loadPeerRequests(); 

        } catch (error) {

            console.error(
                "PEER DASHBOARD ERROR:",
                error
            );

            alert(
                "We couldn't load your peer dashboard. Please try again."
            );
        }

    }
);


/* =========================================================
   LOAD PEER PROFILE
   ========================================================= */

function loadPeerProfile() {

    if (!peerData) {
        return;
    }

    const name =
        peerData.name || "Peer Listener";

    if (peerNameElement) {

        peerNameElement.textContent =
            name;
    }

}


/* =========================================================
   LOAD AVAILABILITY
   ========================================================= */

function loadAvailability() {

    if (!peerData) {
        return;
    }


    /*
     * For now we use:
     *
     * availability: "offline"
     *
     * or
     *
     * availability: "available"
     */

    const isOnline =
        peerData.availability === "available";


    updateAvailabilityUI(isOnline);

}


/* =========================================================
   UPDATE AVAILABILITY UI
   ========================================================= */

function updateAvailabilityUI(isOnline) {

    if (!availabilityToggle ||
        !availabilityText ||
        !availabilityHeading ||
        !availabilityDescription ||
        !statusDot) {

        return;
    }


    if (isOnline) {

        statusDot.classList.add("online");

        availabilityText.textContent =
            "Online";

        availabilityHeading.textContent =
            "You're currently online";

        availabilityDescription.textContent =
            "Eligible students can now send support requests to you.";

        availabilityToggle.textContent =
            "Go Offline";

        availabilityToggle.classList.add("online");

    } else {

        statusDot.classList.remove("online");

        availabilityText.textContent =
            "Offline";

        availabilityHeading.textContent =
            "You're currently offline";

        availabilityDescription.textContent =
            "Students cannot send support requests directly to you.";

        availabilityToggle.textContent =
            "Go Online";

        availabilityToggle.classList.remove("online");
    }

}


/* =========================================================
   AVAILABILITY TOGGLE
   ========================================================= */

if (availabilityToggle) {

    availabilityToggle.addEventListener(
        "click",
        async () => {

            if (!currentUser || !peerData) {

                return;
            }


            const currentlyOnline =
                peerData.availability === "available";

            const newAvailability =
                currentlyOnline
                    ? "offline"
                    : "available";


            availabilityToggle.disabled =
                true;

            availabilityToggle.textContent =
                "Updating...";


            try {

                const peerRef =
                    doc(
                        db,
                        "users",
                        currentUser.uid
                    );


                await updateDoc(
                    peerRef,
                    {
                        availability:
                            newAvailability,

                        availabilityUpdatedAt:
                            serverTimestamp()
                    }
                );


                /*
                 * Update local data too.
                 */

                peerData.availability =
                    newAvailability;


                updateAvailabilityUI(
                    newAvailability === "available"
                );


                console.log(
                    "AVAILABILITY UPDATED:",
                    newAvailability
                );

            } catch (error) {

                console.error(
                    "AVAILABILITY UPDATE ERROR:",
                    error
                );

                alert(
                    "We couldn't update your availability. Please try again."
                );


                /*
                 * Restore the previous UI.
                 */

                updateAvailabilityUI(
                    currentlyOnline
                );

            }


            availabilityToggle.disabled =
                false;

        }
    );

}


/* =========================================================
   STATISTICS
   ========================================================= */

function loadStatistics() {

    /*
     * These remain at zero for now.
     *
     * We will connect them to peerRequests
     * and supportSessions when we build
     * the Peer Requests system.
     */

    if (pendingRequests) {

        pendingRequests.textContent =
            "0";
    }

    if (activeSessions) {

        activeSessions.textContent =
            "0";
    }

    if (completedSessions) {

        completedSessions.textContent =
            "0";
    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.replace(
                    "../index.html"
                );

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

                alert(
                    "Unable to log out. Please try again."
                );
            }

        }
    );

}


/* =========================================================
   LOAD PEER REQUESTS
   ========================================================= */

async function loadPeerRequests() {

    /*
     * This function is mainly used on:
     *
     * peer/requests.html
     *
     * If the request container does not exist,
     * we're probably on the dashboard.
     */

    if (!requestsContainer) {
        return;
    }


    if (!peerData) {
        return;
    }


    /*
     * Only online peers should receive
     * available requests.
     */

    const isOnline =
        peerData.availability === "available";


    if (!isOnline) {

        requestsContainer.innerHTML = `
            <div class="empty-request-state">

                <div class="empty-request-icon">
                    🔕
                </div>

                <h3>
                    You're offline
                </h3>

                <p>
                    Go online from your dashboard to receive
                    eligible student support requests.
                </p>

            </div>
        `;

        if (requestCount) {
            requestCount.textContent = "0";
        }

        if (requestStatusHeading) {
            requestStatusHeading.textContent =
                "You're offline";
        }

        if (requestStatusDescription) {
            requestStatusDescription.textContent =
                "Go online from your dashboard to receive eligible support requests.";
        }

        return;
    }


    /*
     * Update page status.
     */

    if (requestStatusHeading) {

        requestStatusHeading.textContent =
            "You're online";
    }

    if (requestStatusDescription) {

        requestStatusDescription.textContent =
            "Eligible pending support requests are available below.";
    }


    try {

        console.log(
            "LOADING PEER REQUESTS..."
        );


        /*
         * Find pending requests.
         */

        const requestsQuery =
            query(
                collection(db, "peerRequests"),
                where("status", "==", "pending"),
                orderBy("createdAt", "desc")
            );


        const snapshot =
            await getDocs(requestsQuery);


        console.log(
            "REQUESTS FOUND:",
            snapshot.size
        );


        if (requestCount) {

            requestCount.textContent =
                snapshot.size;
        }


        /*
         * No requests.
         */

        if (snapshot.empty) {

            requestsContainer.innerHTML = `
                <div class="empty-request-state">

                    <div class="empty-request-icon">
                        ✓
                    </div>

                    <h3>
                        No requests available
                    </h3>

                    <p>
                        There are currently no pending peer
                        support requests.
                    </p>

                </div>
            `;

            return;
        }


        /*
         * Clear existing content.
         */

        requestsContainer.innerHTML = "";


        /*
         * Display each request.
         */

        snapshot.forEach(
            (requestDocument) => {

                const request =
                    requestDocument.data();

                const requestId =
                    requestDocument.id;


                const card =
                    createRequestCard(
                        requestId,
                        request
                    );


                requestsContainer.appendChild(card);

            }
        );


    } catch (error) {

        console.error(
            "LOAD PEER REQUESTS ERROR:",
            error
        );


        requestsContainer.innerHTML = `
            <div class="empty-request-state">

                <div class="empty-request-icon">
                    !
                </div>

                <h3>
                    Unable to load requests
                </h3>

                <p>
                    We couldn't retrieve support requests.
                    Please refresh the page and try again.
                </p>

            </div>
        `;

    }

}


/* =========================================================
   CREATE REQUEST CARD
   ========================================================= */

function createRequestCard(
    requestId,
    request
) {

    const card =
        document.createElement("div");


    card.className =
        "peer-request-card";


    const anonymousText =
        request.anonymous === true
            ? "Anonymous"
            : "Student";


    const supportType =
        request.supportType ||
        "Peer Support";


    const preference =
        request.genderPreference ||
        "No preference";


    const message =
        request.message &&
        request.message.trim()
            ? request.message.trim()
            : "No message provided.";


    card.innerHTML = `

        <div class="peer-request-card-top">

            <div>

                <span class="request-label">
                    SUPPORT REQUEST
                </span>

                <h3>
                    ${anonymousText}
                </h3>

            </div>

            <span class="request-status-badge">
                Pending
            </span>

        </div>


        <div class="peer-request-details">

            <div class="request-detail">

                <span>
                    Support type
                </span>

                <strong>
                    ${supportType}
                </strong>

            </div>


            <div class="request-detail">

                <span>
                    Preference
                </span>

                <strong>
                    ${preference}
                </strong>

            </div>


            <div class="request-detail">

                <span>
                    Privacy
                </span>

                <strong>
                    ${anonymousText}
                </strong>

            </div>

        </div>


        <div class="peer-request-message">

            <span>
                Student message
            </span>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>


        <button
            class="peer-accept-request"
            data-request-id="${requestId}">

            Accept Request

        </button>

    `;


    /*
     * Accept button is intentionally not
     * connected yet.
     *
     * We will implement controlled acceptance
     * next.
     */


    return card;

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}