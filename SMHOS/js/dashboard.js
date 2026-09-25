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
    getDocs
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

const currentDate =
    document.getElementById("currentDate");

const streakNumber =
    document.getElementById("streakNumber");


// ========================================
// CURRENT DATE
// ========================================

function displayCurrentDate() {

    if (!currentDate) {
        return;
    }

    const today =
        new Date();

    const formattedDate =
        today.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );

    currentDate.textContent =
        formattedDate +
        " — Take a moment to check in with yourself.";

}


displayCurrentDate();


// ========================================
// AUTHENTICATION
// ========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../login.html";

            return;
        }


        // ========================================
        // LOAD PROFILE
        // ========================================

        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnapshot =
                await getDoc(userRef);


            if (userSnapshot.exists()) {

                const userData =
                    userSnapshot.data();


                if (studentName) {

                    studentName.textContent =
                        userData.name ||
                        "Student";

                }

            }


        } catch (error) {

            console.error(
                "Error loading student profile:",
                error
            );

        }



        // ========================================
        // LOAD WEEK ACTIVITY
        // ========================================

        await loadWeeklyCheckIns(user.uid);

    }
);


// ========================================
// WEEKLY CHECK-INS
// ========================================

async function loadWeeklyCheckIns(userId) {

    try {

        const checkInsRef =
            collection(
                db,
                "checkIns"
            );


        const checkInsQuery =
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
                checkInsQuery
            );


        const dayCounts = {

            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0

        };


        snapshot.forEach(
            (docSnapshot) => {

                const data =
                    docSnapshot.data();


                if (!data.createdAt) {
                    return;
                }


                const date =
                    data.createdAt.toDate();


                const day =
                    date.getDay();


                dayCounts[day]++;

            }
        );


        updateWeekChart(dayCounts);


        calculateStreak(dayCounts);


    } catch (error) {

        console.log(
            "Weekly check-ins unavailable:",
            error.message
        );

        /*
            The dashboard still works if the
            checkIns collection has not been
            configured yet.
        */

    }

}


// ========================================
// UPDATE WEEK CHART
// ========================================

function updateWeekChart(dayCounts) {

    const bars =
        document.querySelectorAll(
            ".week-bar"
        );


    let maximum =
        1;


    Object.values(dayCounts)
        .forEach(
            count => {

                if (count > maximum) {

                    maximum =
                        count;

                }

            }
        );


    bars.forEach(
        bar => {

            const day =
                bar.dataset.day;


            const count =
                dayCounts[day] || 0;


            if (count === 0) {

                bar.style.height =
                    "7px";

            } else {

                const percentage =
                    Math.min(
                        100,
                        (count / maximum) * 100
                    );


                bar.style.height =
                    percentage + "%";

            }

        }
    );

}


// ========================================
// STREAK
// ========================================

function calculateStreak(dayCounts) {

    if (!streakNumber) {
        return;
    }


    /*
        This is intentionally simple for now.

        A more advanced streak system can later
        check consecutive calendar dates directly.
    */

    const total =
        Object.values(dayCounts)
            .reduce(
                (sum, value) =>
                    sum + value,
                0
            );


    if (total > 0) {

        streakNumber.textContent =
            Math.min(total, 30);

    } else {

        streakNumber.textContent =
            "0";

    }

}


// ========================================
// LOGOUT
// ========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);


                window.location.href =
                    "../login.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}