import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase.js";


// ========================================
// REGISTRATION
// ========================================

const registerForm =
    document.getElementById("registerForm");

const registerMessage =
    document.getElementById("registerMessage");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();

            const studentId =
                document
                    .getElementById("studentId")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;

            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;


            // Check passwords

            if (password !== confirmPassword) {

                showRegisterMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;
            }


            try {

                showRegisterMessage(
                    "Creating your account...",
                    "success"
                );


                // Create Firebase account

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                // Create Firestore profile

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        name: name,
                        studentId: studentId,
                        email: email,
                        role: "student",
                        anonymousEnabled: true,
                        createdAt: serverTimestamp()
                    }
                );


                showRegisterMessage(
                    "Account created successfully!",
                    "success"
                );


                // Redirect

                setTimeout(
                    () => {

                        window.location.replace(
                            "student/dashboard.html"
                        );

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "REGISTRATION ERROR:",
                    error
                );


                let message =
                    "Something went wrong. Please try again.";


                if (
                    error.code ===
                    "auth/email-already-in-use"
                ) {

                    message =
                        "An account with this email already exists.";

                }

                else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    message =
                        "Please enter a valid email address.";

                }

                else if (
                    error.code ===
                    "auth/weak-password"
                ) {

                    message =
                        "Password must be at least 6 characters.";

                }


                showRegisterMessage(
                    message,
                    "error"
                );

            }

        }
    );

}


// ========================================
// LOGIN
// ========================================

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;


            if (!email || !password) {

                showLoginMessage(
                    "Please enter your email and password.",
                    "error"
                );

                return;
            }


            try {

                showLoginMessage(
                    "Signing you in...",
                    "success"
                );


                // ========================================
                // FIREBASE LOGIN
                // ========================================

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                console.log(
                    "LOGIN SUCCESSFUL:",
                    user.uid
                );


                showLoginMessage(
                    "Login successful. Opening your dashboard...",
                    "success"
                );


                // ========================================
                // REDIRECT
                // ========================================

                setTimeout(
                    () => {

                        window.location.replace(
                            "student/dashboard.html"
                        );

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                let message =
                    "Unable to log in. Please try again.";


                if (
                    error.code ===
                    "auth/invalid-credential"
                ) {

                    message =
                        "Incorrect email or password.";

                }

                else if (
                    error.code ===
                    "auth/user-not-found"
                ) {

                    message =
                        "No account was found with this email.";

                }

                else if (
                    error.code ===
                    "auth/wrong-password"
                ) {

                    message =
                        "Incorrect password.";

                }

                else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    message =
                        "Please enter a valid email address.";

                }

                else if (
                    error.code ===
                    "auth/too-many-requests"
                ) {

                    message =
                        "Too many login attempts. Please wait a moment and try again.";

                }


                showLoginMessage(
                    message,
                    "error"
                );

            }

        }
    );

}


// ========================================
// REGISTER MESSAGE
// ========================================

function showRegisterMessage(
    message,
    type
) {

    if (!registerMessage) {
        return;
    }


    registerMessage.textContent =
        message;


    registerMessage.className =
        "form-message " + type;

}



// ========================================
// LOGIN MESSAGE
// ========================================

function showLoginMessage(
    message,
    type
) {

    if (!loginMessage) {
        return;
    }


    loginMessage.textContent =
        message;


    loginMessage.className =
        "form-message " + type;

}