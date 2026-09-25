// =====================================================
// SMHOS DAILY CHECK-IN
// =====================================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
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


// =====================================================
// ELEMENTS
// =====================================================

const moodButtons =
    document.querySelectorAll(".mood-number");

const moodTags =
    document.querySelectorAll(".mood-tag");

const selectedMoodText =
    document.getElementById("selectedMoodText");

const moodNote =
    document.getElementById("moodNote");

const characterCount =
    document.getElementById("characterCount");

const submitCheckinButton =
    document.getElementById("submitCheckinButton");

const checkinMessage =
    document.getElementById("checkinMessage");


// =====================================================
// VARIABLES
// =====================================================

let selectedMood = null;

let selectedTags = [];

let currentUser = null;


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            window.location.replace(
                "../login.html"
            );

            return;
        }


        currentUser = user;

    }
);


// =====================================================
// MOOD SELECTION
// =====================================================

moodButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const mood =
                    Number(
                        button.dataset.mood
                    );


                selectedMood = mood;


                moodButtons.forEach(
                    (item) => {

                        item.classList.remove(
                            "selected"
                        );

                    }
                );


                button.classList.add(
                    "selected"
                );


                selectedMoodText.textContent =
                    getMoodDescription(mood);

            }
        );

    }
);


// =====================================================
// MOOD DESCRIPTION
// =====================================================

function getMoodDescription(mood) {

    if (mood <= 2) {

        return "Very low. It may be a good time to reach out for support.";

    }


    if (mood <= 4) {

        return "Low. Thank you for taking a moment to check in.";

    }


    if (mood <= 6) {

        return "Okay. You seem to be somewhere in the middle today.";

    }


    if (mood <= 8) {

        return "Good. It's great that you're checking in with yourself.";

    }


    return "Excellent. You're having a very positive day.";

}


// =====================================================
// MOOD TAG SELECTION
// =====================================================

moodTags.forEach(
    (tagButton) => {

        tagButton.addEventListener(
            "click",
            () => {

                const tag =
                    tagButton.dataset.tag;


                const tagIndex =
                    selectedTags.indexOf(tag);


                if (tagIndex === -1) {

                    selectedTags.push(tag);

                    tagButton.classList.add(
                        "selected"
                    );

                }

                else {

                    selectedTags.splice(
                        tagIndex,
                        1
                    );

                    tagButton.classList.remove(
                        "selected"
                    );

                }

            }
        );

    }
);


// =====================================================
// CHARACTER COUNTER
// =====================================================

if (moodNote) {

    moodNote.addEventListener(
        "input",
        () => {

            characterCount.textContent =
                moodNote.value.length;

        }
    );

}


// =====================================================
// GET TODAY'S DATE
// =====================================================

function getTodayDate() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


// =====================================================
// CHECK WHETHER USER ALREADY CHECKED IN TODAY
// =====================================================

async function hasCheckedInToday() {

    if (!currentUser) {

        return false;

    }


    const today =
        getTodayDate();


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
                currentUser.uid
            ),
            where(
                "date",
                "==",
                today
            )
        );


    const snapshot =
        await getDocs(
            checkInQuery
        );


    return !snapshot.empty;

}


// =====================================================
// SUBMIT CHECK-IN
// =====================================================

if (submitCheckinButton) {

    submitCheckinButton.addEventListener(
        "click",
        async () => {

            clearMessage();


            // -----------------------------------------
            // CHECK MOOD
            // -----------------------------------------

            if (!selectedMood) {

                showMessage(
                    "Please select your mood from 1 to 10.",
                    "error"
                );

                return;

            }


            // -----------------------------------------
            // CHECK AUTH
            // -----------------------------------------

            if (!currentUser) {

                showMessage(
                    "Your session has expired. Please log in again.",
                    "error"
                );

                return;

            }


            try {

                submitCheckinButton.disabled =
                    true;

                submitCheckinButton.textContent =
                    "Saving Check-In...";


                // -------------------------------------
                // PREVENT DUPLICATE DAILY CHECK-IN
                // -------------------------------------

                const alreadyCheckedIn =
                    await hasCheckedInToday();


                if (alreadyCheckedIn) {

                    showMessage(
                        "You've already completed today's check-in.",
                        "error"
                    );

                    submitCheckinButton.disabled =
                        true;

                    submitCheckinButton.textContent =
                        "Already Checked In";

                    return;

                }


                // -------------------------------------
                // GET NOTE
                // -------------------------------------

                const note =
                    moodNote
                        ? moodNote.value.trim()
                        : "";


                // -------------------------------------
                // GET TODAY
                // -------------------------------------

                const today =
                    getTodayDate();


                // -------------------------------------
                // SAVE TO FIRESTORE
                // -------------------------------------

                await addDoc(
                    collection(
                        db,
                        "checkIns"
                    ),
                    {
                        userId:
                            currentUser.uid,

                        mood:
                            selectedMood,

                        tags:
                            selectedTags,

                        note:
                            note,

                        date:
                            today,

                        createdAt:
                            serverTimestamp()
                    }
                );


                // -------------------------------------
                // SUCCESS
                // -------------------------------------

                showMessage(
                    "Your check-in has been saved successfully.",
                    "success"
                );


                submitCheckinButton.textContent =
                    "Check-In Saved ✓";


                // Disable mood controls

                moodButtons.forEach(
                    (button) => {

                        button.disabled =
                            true;

                    }
                );


                moodTags.forEach(
                    (button) => {

                        button.disabled =
                            true;

                    }
                );


                if (moodNote) {

                    moodNote.disabled =
                        true;

                }


            } catch (error) {

                console.error(
                    "CHECK-IN ERROR:",
                    error
                );


                showMessage(
                    "We couldn't save your check-in. Please try again.",
                    "error"
                );


                submitCheckinButton.disabled =
                    false;

                submitCheckinButton.textContent =
                    "Save Today's Check-In";

            }

        }
    );

}


// =====================================================
// MESSAGE FUNCTIONS
// =====================================================

function showMessage(
    message,
    type
) {

    if (!checkinMessage) {

        return;

    }


    checkinMessage.textContent =
        message;


    checkinMessage.className =
        "checkin-message " + type;

}


function clearMessage() {

    if (!checkinMessage) {

        return;

    }


    checkinMessage.textContent =
        "";

    checkinMessage.className =
        "checkin-message";

}