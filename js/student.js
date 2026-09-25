import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase.js";


// ========================================
// ELEMENTS
// ========================================

const studentName =
    document.getElementById("studentName");

const logoutButton =
    document.getElementById("logoutButton");

    let currentUser = null;

// ========================================
// MOOD HISTORY ELEMENTS
// ========================================

const totalCheckins =
    document.getElementById("totalCheckins");

const averageMood =
    document.getElementById("averageMood");

const latestMood =
    document.getElementById("latestMood");

const moodHistoryList =
    document.getElementById("moodHistoryList");

const emptyHistory =
    document.getElementById("emptyHistory");


// ========================================
// CHECK AUTHENTICATION
// ========================================

onAuthStateChanged(
    auth,
    async (user) => {

        console.log(
            "AUTHENTICATED USER:",
            user
        );


        // ----------------------------------------
        // USER NOT LOGGED IN
        // ----------------------------------------

        if (!user) {
        window.location.replace("../login.html");
        return;
}

       currentUser = user;

       console.log("USER UID:", user.uid);

        // ----------------------------------------
        // USER IS LOGGED IN
        // ----------------------------------------

        console.log(
            "USER UID:",
            user.uid
        );


        // ========================================
        // LOAD STUDENT PROFILE
        // ========================================

        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnapshot =
                await getDoc(
                    userRef
                );


            console.log(
                "FIRESTORE DOCUMENT EXISTS:",
                userSnapshot.exists()
            );


            if (userSnapshot.exists()) {

                const userData =
                    userSnapshot.data();


                console.log(
                    "FIRESTORE USER DATA:",
                    userData
                );


                console.log(
                    "STUDENT NAME:",
                    userData.name
                );


                if (studentName) {

                    studentName.textContent =
                        userData.name ||
                        "Student";

                }

            }


            else {

                console.warn(
                    "No user profile found in Firestore."
                );


                if (studentName) {

                    studentName.textContent =
                        "Student";

                }

            }


        } catch (error) {

            console.error(
                "ERROR LOADING STUDENT PROFILE:",
                error
            );


            if (studentName) {

                studentName.textContent =
                    "Student";

            }

        }


        // ========================================
        // LOAD MOOD HISTORY
        // ========================================

        if (moodHistoryList) {

            await loadMoodHistory(
                user.uid
            );

        }

    }
);


// ========================================
// LOAD MOOD HISTORY
// ========================================

async function loadMoodHistory(userId) {

    try {

        console.log(
            "LOADING MOOD HISTORY..."
        );


        const checkInsRef =
            collection(
                db,
                "checkIns"
            );


        const checkInQuery =
            query(
                checkInsRef,
                where(
                    "userId",
                    "==",
                    userId
                )
            );


        const snapshot =
            await getDocs(
                checkInQuery
            );


        const checkIns = [];


        snapshot.forEach(
            (document) => {

                checkIns.push({

                    id: document.id,

                    ...document.data()

                });

            }
        );


        console.log(
            "CHECK-INS FOUND:",
            checkIns.length
        );


        // ========================================
        // SORT NEWEST FIRST
        // ========================================

        checkIns.sort(
            (a, b) => {

                return (
                    getDateValue(b) -
                    getDateValue(a)
                );

            }
        );


        // ========================================
        // NO CHECK-INS
        // ========================================

        if (
            checkIns.length === 0
        ) {

            showEmptyHistory();

            return;
        }


        // ========================================
        // UPDATE SUMMARY
        // ========================================

        updateMoodSummary(
            checkIns
        );


        // ========================================
        // DISPLAY CHECK-INS
        // ========================================

        displayMoodHistory(
            checkIns
        );


    } catch (error) {

        console.error(
            "MOOD HISTORY ERROR:",
            error
        );


        if (moodHistoryList) {

            moodHistoryList.innerHTML = `
                <div class="history-error">
                    We couldn't load your mood history.
                    Please refresh the page and try again.
                </div>
            `;

        }

    }

}


// ========================================
// GET DATE VALUE
// ========================================

function getDateValue(checkIn) {

    if (!checkIn.date) {

        return 0;

    }


    return new Date(
        checkIn.date + "T00:00:00"
    ).getTime();

}


// ========================================
// UPDATE MOOD SUMMARY
// ========================================

function updateMoodSummary(
    checkIns
) {

    const total =
        checkIns.length;


    const moodTotal =
        checkIns.reduce(
            (sum, checkIn) => {

                return (
                    sum +
                    Number(
                        checkIn.mood || 0
                    )
                );

            },
            0
        );


    const average =
        moodTotal / total;


    const latest =
        Number(
            checkIns[0].mood
        );


    if (totalCheckins) {

        totalCheckins.textContent =
            total;

    }


    if (averageMood) {

        averageMood.textContent =
            average.toFixed(1) +
            " / 10";

    }


    if (latestMood) {

        latestMood.textContent =
            latest +
            " / 10";

    }

}


// ========================================
// DISPLAY MOOD HISTORY
// ========================================

function displayMoodHistory(
    checkIns
) {

    if (!moodHistoryList) {

        return;

    }


    moodHistoryList.innerHTML =
        "";


    checkIns.forEach(
        (checkIn) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "mood-history-card";


            const mood =
                Number(
                    checkIn.mood
                );


            const moodDescription =
                getMoodDescription(
                    mood
                );


            const formattedDate =
                formatDate(
                    checkIn.date
                );


            const tags =
                Array.isArray(
                    checkIn.tags
                )
                    ? checkIn.tags
                    : [];


            card.innerHTML = `

                <div class="history-card-top">

                    <div>

                        <span class="history-date">
                            ${formattedDate}
                        </span>

                        <h3>
                            ${moodDescription}
                        </h3>

                    </div>


                    <div class="history-mood-score">
                        ${mood}/10
                    </div>

                </div>


                ${
                    tags.length > 0
                        ? `

                            <div class="history-tags">

                                ${tags.map(
                                    (tag) => {

                                        return `
                                            <span class="history-tag">
                                                ${escapeHTML(tag)}
                                            </span>
                                        `;

                                    }
                                ).join("")}

                            </div>

                        `
                        : ""
                }


                ${
                    checkIn.note
                        ? `

                            <div class="history-note">

                                <span>
                                    Note
                                </span>

                                <p>
                                    ${escapeHTML(
                                        checkIn.note
                                    )}
                                </p>

                            </div>

                        `
                        : ""
                }

            `;


            moodHistoryList.appendChild(
                card
            );

        }
    );

}


// ========================================
// MOOD DESCRIPTION
// ========================================

function getMoodDescription(
    mood
) {

    if (mood <= 2) {

        return "Very Low";

    }


    if (mood <= 4) {

        return "Low";

    }


    if (mood <= 6) {

        return "Okay";

    }


    if (mood <= 8) {

        return "Good";

    }


    return "Excellent";

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "Unknown date";

    }


    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    return date.toLocaleDateString(
        undefined,
        {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


// ========================================
// EMPTY HISTORY
// ========================================

function showEmptyHistory() {

    if (moodHistoryList) {

        moodHistoryList.style.display =
            "none";

    }


    if (emptyHistory) {

        emptyHistory.style.display =
            "block";

    }


    if (totalCheckins) {

        totalCheckins.textContent =
            "0";

    }


    if (averageMood) {

        averageMood.textContent =
            "—";

    }


    if (latestMood) {

        latestMood.textContent =
            "—";

    }

}


// ========================================
// HTML SAFETY
// ========================================

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ========================================
// LOGOUT
// ========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                window.location.replace(
                    "../login.html"
                );


            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

            }

        }
    );

}






/* =========================================================
   SMHOS - HELP NOW PEER SUPPORT POPUP
   ========================================================= */

const peerModal = document.getElementById("peerModal");
const peerSupportButton = document.getElementById("peerSupportButton");
const closePeerModal = document.getElementById("closePeerModal");

const peerStep1 = document.getElementById("peerStep1");
const peerStep2Specific = document.getElementById("peerStep2Specific");
const peerStep2Pool = document.getElementById("peerStep2Pool");
const peerStep3 = document.getElementById("peerStep3");
const peerStep4 = document.getElementById("peerStep4");
const peerStep5 = document.getElementById("peerStep5");

const specificPeerChoice = document.getElementById("specificPeerChoice");
const poolPeerChoice = document.getElementById("poolPeerChoice");

const backToPeerStep1 = document.getElementById("backToPeerStep1");
const backToPeerStep1Pool = document.getElementById("backToPeerStep1Pool");
const backToPeerStep2 = document.getElementById("backToPeerStep2");
const backToPeerStep3 = document.getElementById("backToPeerStep3");

const continuePoolRequest = document.getElementById("continuePoolRequest");
const reviewPeerRequestButton =
    document.getElementById("reviewPeerRequestButton");

const sendPeerRequestButton =
    document.getElementById("sendPeerRequestButton");

const closePeerAfterRequest =
    document.getElementById("closePeerAfterRequest");

const peerProfileCards =
    document.querySelectorAll(".peer-profile-card");

const peerPreferenceButtons =
    document.querySelectorAll(".peer-preference-option");

const supportTypeButtons =
    document.querySelectorAll("[data-support-type]");

const anonymousPeerToggle =
    document.getElementById("anonymousPeerToggle");

const anonymousStatusText =
    document.getElementById("anonymousStatusText");

const peerSupportMessage =
    document.getElementById("peerSupportMessage");

const peerMessageCount =
    document.getElementById("peerMessageCount");

const requestTypeSummary =
    document.getElementById("requestTypeSummary");

const requestPeerSummary =
    document.getElementById("requestPeerSummary");

const requestPreferenceSummary =
    document.getElementById("requestPreferenceSummary");

const requestSupportTypeSummary =
    document.getElementById("requestSupportTypeSummary");

const requestAnonymousSummary =
    document.getElementById("requestAnonymousSummary");

const requestMessagePreview =
    document.getElementById("requestMessagePreview");

const requestSentMessage =
    document.getElementById("requestSentMessage");


let peerRequestMode = null;
let selectedPeer = null;
let selectedPreference = "No preference";
let selectedSupportType = "Chat";


/* =========================================================
   ONLY RUN HELP NOW CODE ON HELP NOW PAGE
   ========================================================= */

if (peerModal && peerSupportButton) {


    /* -----------------------------------------------------
       SHOW A STEP
       ----------------------------------------------------- */

    function showPeerStep(step) {

        const allSteps = document.querySelectorAll(".peer-modal-step");

        allSteps.forEach((item) => {
            item.classList.remove("active");
        });

        if (step) {
            step.classList.add("active");
        }

    }


    /* -----------------------------------------------------
       RESET FLOW
       ----------------------------------------------------- */

    function resetPeerFlow() {

        peerRequestMode = null;
        selectedPeer = null;
        selectedPreference = "No preference";
        selectedSupportType = "Chat";


        /* Reset gender preference */

        peerPreferenceButtons.forEach((button) => {

            if (
                button.dataset.preference === "No preference"
            ) {
                button.classList.add("selected");
            } else {
                button.classList.remove("selected");
            }

        });


        /* Reset support type */

        supportTypeButtons.forEach((button) => {

            if (
                button.dataset.supportType === "Chat"
            ) {
                button.classList.add("selected");
            } else {
                button.classList.remove("selected");
            }

        });


        /* Reset anonymous */

        if (anonymousPeerToggle) {
            anonymousPeerToggle.checked = true;
        }

        updateAnonymousText();


        /* Reset message */

        if (peerSupportMessage) {
            peerSupportMessage.value = "";
        }

        if (peerMessageCount) {
            peerMessageCount.textContent = "0";
        }


        /* Reset summary */

        if (requestTypeSummary) {
            requestTypeSummary.textContent = "—";
        }

        if (requestPeerSummary) {
            requestPeerSummary.textContent = "—";
        }

        if (requestPreferenceSummary) {
            requestPreferenceSummary.textContent = "—";
        }

        if (requestSupportTypeSummary) {
            requestSupportTypeSummary.textContent = "—";
        }

        if (requestAnonymousSummary) {
            requestAnonymousSummary.textContent = "Yes";
        }

        if (requestMessagePreview) {
            requestMessagePreview.textContent = "";
            requestMessagePreview.classList.remove("visible");
        }

    }


    /* -----------------------------------------------------
       OPEN MODAL
       ----------------------------------------------------- */

    peerSupportButton.addEventListener("click", () => {

        resetPeerFlow();

        showPeerStep(peerStep1);

        peerModal.classList.add("active");

        document.body.style.overflow = "hidden";

    });


    /* -----------------------------------------------------
       CLOSE MODAL
       ----------------------------------------------------- */

    function closePeerSupportModal() {

        peerModal.classList.remove("active");

        document.body.style.overflow = "";

    }


    if (closePeerModal) {

        closePeerModal.addEventListener(
            "click",
            closePeerSupportModal
        );

    }


    /* -----------------------------------------------------
       CLOSE WHEN CLICKING OUTSIDE
       ----------------------------------------------------- */

    peerModal.addEventListener("click", (event) => {

        if (event.target === peerModal) {

            closePeerSupportModal();

        }

    });


    /* -----------------------------------------------------
       ESC KEY CLOSE
       ----------------------------------------------------- */

    document.addEventListener("keydown", (event) => {

        if (
            event.key === "Escape" &&
            peerModal.classList.contains("active")
        ) {

            closePeerSupportModal();

        }

    });


    /* =====================================================
       STEP 1
       ===================================================== */


    /* Specific peer */

    if (specificPeerChoice) {

        specificPeerChoice.addEventListener("click", () => {

            peerRequestMode = "specific";

            showPeerStep(peerStep2Specific);

        });

    }


    /* General pool */

    if (poolPeerChoice) {

        poolPeerChoice.addEventListener("click", () => {

            peerRequestMode = "pool";

            showPeerStep(peerStep2Pool);

        });

    }


    /* =====================================================
       STEP 2A — SPECIFIC PEER
       ===================================================== */


    peerProfileCards.forEach((card) => {

        card.addEventListener("click", () => {

            selectedPeer = {
                name: card.dataset.peerName || "Selected Peer",
                gender: card.dataset.peerGender || ""
            };

            showPeerStep(peerStep3);

        });

    });


    /* Back */

    if (backToPeerStep1) {

        backToPeerStep1.addEventListener("click", () => {

            showPeerStep(peerStep1);

        });

    }


    /* =====================================================
       STEP 2B — GENERAL POOL
       ===================================================== */


    /* Gender preference */

    peerPreferenceButtons.forEach((button) => {

        button.addEventListener("click", () => {

            if (!button.dataset.preference) {
                return;
            }

            peerPreferenceButtons.forEach((item) => {

                item.classList.remove("selected");

            });

            button.classList.add("selected");

            selectedPreference =
                button.dataset.preference;

        });

    });


    /* Continue from pool */

    if (continuePoolRequest) {

        continuePoolRequest.addEventListener("click", () => {

            showPeerStep(peerStep3);

        });

    }


    /* Back */

    if (backToPeerStep1Pool) {

        backToPeerStep1Pool.addEventListener(
            "click",
            () => {

                showPeerStep(peerStep1);

            }
        );

    }


    /* =====================================================
       STEP 3 — CONNECTION TYPE
       ===================================================== */


    supportTypeButtons.forEach((button) => {

        button.addEventListener("click", () => {

            supportTypeButtons.forEach((item) => {

                item.classList.remove("selected");

            });

            button.classList.add("selected");

            selectedSupportType =
                button.dataset.supportType;

        });

    });


    /* =====================================================
       ANONYMOUS TOGGLE
       ===================================================== */

    function updateAnonymousText() {

        if (!anonymousPeerToggle || !anonymousStatusText) {
            return;
        }

        if (anonymousPeerToggle.checked) {

            anonymousStatusText.textContent =
                "Your identity will remain private from the peer.";

        } else {

            anonymousStatusText.textContent =
                "Your basic profile information may be shared with the peer.";

        }

    }


    if (anonymousPeerToggle) {

        anonymousPeerToggle.addEventListener(
            "change",
            updateAnonymousText
        );

    }


    /* =====================================================
       MESSAGE CHARACTER COUNTER
       ===================================================== */

    if (peerSupportMessage) {

        peerSupportMessage.addEventListener("input", () => {

            if (peerMessageCount) {

                peerMessageCount.textContent =
                    peerSupportMessage.value.length;

            }

        });

    }


    /* =====================================================
       BACK FROM STEP 3
       ===================================================== */

    if (backToPeerStep2) {

        backToPeerStep2.addEventListener("click", () => {

            if (peerRequestMode === "specific") {

                showPeerStep(peerStep2Specific);

            } else {

                showPeerStep(peerStep2Pool);

            }

        });

    }


    /* =====================================================
       STEP 4 — REVIEW
       ===================================================== */

    if (reviewPeerRequestButton) {

        reviewPeerRequestButton.addEventListener("click", () => {

            const isAnonymous =
                anonymousPeerToggle
                    ? anonymousPeerToggle.checked
                    : true;

            const message =
                peerSupportMessage
                    ? peerSupportMessage.value.trim()
                    : "";


            /* Request type */

            if (requestTypeSummary) {

                requestTypeSummary.textContent =
                    peerRequestMode === "specific"
                        ? "Specific peer"
                        : "General peer pool";

            }


            /* Peer */

            if (requestPeerSummary) {

                if (peerRequestMode === "specific") {

                    requestPeerSummary.textContent =
                        selectedPeer
                            ? selectedPeer.name
                            : "Selected peer";

                } else {

                    requestPeerSummary.textContent =
                        "First eligible available peer";

                }

            }


            /* Preference */

            if (requestPreferenceSummary) {

                if (peerRequestMode === "specific") {

                    requestPreferenceSummary.textContent =
                        selectedPeer && selectedPeer.gender
                            ? selectedPeer.gender
                            : "Selected peer";

                } else {

                    requestPreferenceSummary.textContent =
                        selectedPreference;

                }

            }


            /* Support type */

            if (requestSupportTypeSummary) {

                requestSupportTypeSummary.textContent =
                    selectedSupportType;

            }


            /* Anonymous */

            if (requestAnonymousSummary) {

                requestAnonymousSummary.textContent =
                    isAnonymous ? "Yes" : "No";

            }


            /* Message */

            if (requestMessagePreview) {

                if (message) {

                    requestMessagePreview.textContent =
                        message;

                    requestMessagePreview.classList.add(
                        "visible"
                    );

                } else {

                    requestMessagePreview.textContent = "";

                    requestMessagePreview.classList.remove(
                        "visible"
                    );

                }

            }


            showPeerStep(peerStep4);

        });

    }


    /* =====================================================
       BACK FROM REVIEW
       ===================================================== */

    if (backToPeerStep3) {

        backToPeerStep3.addEventListener("click", () => {

            showPeerStep(peerStep3);

        });

    }


    /* =====================================================
   SEND REAL PEER SUPPORT REQUEST TO FIRESTORE
   ===================================================== */

if (sendPeerRequestButton) {

    sendPeerRequestButton.addEventListener("click", async () => {

        if (!currentUser) {

            alert("Your session has expired. Please log in again.");

            window.location.replace("../login.html");

            return;
        }


        try {

            /* Prevent double clicking */

            sendPeerRequestButton.disabled = true;

            sendPeerRequestButton.textContent =
                "Sending Request...";


            /* ---------------------------------------------
               COLLECT REQUEST INFORMATION
               --------------------------------------------- */

            const isAnonymous =
                anonymousPeerToggle
                    ? anonymousPeerToggle.checked
                    : true;


            const message =
                peerSupportMessage
                    ? peerSupportMessage.value.trim()
                    : "";


            let requestData = {

                requesterId: currentUser.uid,

                requestType: peerRequestMode === "specific"
                    ? "specific"
                    : "pool",

                supportType: selectedSupportType,

                anonymous: isAnonymous,

                message: message,

                status: "pending",

                createdAt: serverTimestamp(),

                updatedAt: serverTimestamp()

            };


            /* ---------------------------------------------
               SPECIFIC PEER REQUEST
               --------------------------------------------- */

            if (peerRequestMode === "specific") {

                requestData.selectedPeerName =
                    selectedPeer
                        ? selectedPeer.name
                        : null;

                requestData.selectedPeerGender =
                    selectedPeer
                        ? selectedPeer.gender
                        : null;

                /*
                 * The actual Firebase peer UID will be added
                 * when the peer directory is connected.
                 */

                requestData.selectedPeerId = null;

            }


            /* ---------------------------------------------
               GENERAL POOL REQUEST
               --------------------------------------------- */

            if (peerRequestMode === "pool") {

                requestData.genderPreference =
                    selectedPreference;

                requestData.assignmentType =
                    "first_eligible_peer";

            }


            /* ---------------------------------------------
               CREATE FIRESTORE REQUEST
               --------------------------------------------- */

            const requestRef = await addDoc(
                collection(db, "peerRequests"),
                requestData
            );


            console.log(
                "PEER REQUEST CREATED:",
                requestRef.id
            );


            /* ---------------------------------------------
               SUCCESS SCREEN
               --------------------------------------------- */

            showPeerStep(peerStep5);


            if (requestSentMessage) {

                if (peerRequestMode === "specific") {

                    requestSentMessage.textContent =
                        selectedPeer
                            ? `Your request has been sent for ${selectedPeer.name}.`
                            : "Your request has been sent to the selected peer.";

                } else {

                    requestSentMessage.textContent =
                        "Your request has been sent to the general peer pool. An eligible available peer can now accept it.";

                }

            }


        } catch (error) {

            console.error(
                "PEER REQUEST ERROR:",
                error
            );


            alert(
                "We couldn't send your support request. Please try again."
            );


            sendPeerRequestButton.disabled = false;

            sendPeerRequestButton.textContent =
                "Send Support Request";

        }

    });

}


    /* =====================================================
       DONE
       ===================================================== */

    if (closePeerAfterRequest) {

        closePeerAfterRequest.addEventListener(
            "click",
            closePeerSupportModal
        );

    }

}