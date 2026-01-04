// =================================================================
//  Import Firebase Functions
// =================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, onAuthStateChanged, signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, collection, 
    query, where, orderBy, onSnapshot, addDoc, 
    updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// =================================================================
//  Firebase Configuration - PASTE YOUR CONFIG FROM FIREBASE CONSOLE HERE
// =================================================================
const firebaseConfig = {
  apiKey: "AIzaSyC9aSBN2iIpiIy2FQSU4cXMKy6HsQFK-YQ",
  authDomain: "evx-nit.firebaseapp.com",
  projectId: "evx-nit",
  storageBucket: "evx-nit.firebasestorage.app",
  messagingSenderId: "1013156066137",
  appId: "1:1013156066137:web:60af5c27e29a08c6eb5248",
  measurementId: "G-PPXL42WTLY" // This one is optional
};

// =================================================================
//  Initialize Firebase and Services
// =================================================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =================================================================
// Central Authentication Router
// =================================================================
onAuthStateChanged(auth, async (user) => {
    // ... (This function remains exactly the same as before)
    const path = window.location.pathname.split("/").pop();
    if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userProfile = await getDoc(userDocRef);
        if (!userProfile.exists()) { signOut(auth); return; }
        const userData = userProfile.data();
        if (path === 'index.html' || path === '') window.location.href = 'dashboard.html';
        else if (path === 'dashboard.html') handleDashboardPage(user, userData);
    } else {
        if (path === 'dashboard.html') window.location.href = 'index.html';
        else if (path === 'index.html' || path === '') handleLoginPage();
    }
});

// =================================================================
// Login Page Logic (`index.html`) - FINAL SEPARATED VERSION
// =================================================================
function handleLoginPage() {
    // --- Element Selectors for Forms and Toggles ---
    const loginBox = document.getElementById('loginBox');
    const signupBox = document.getElementById('signupBox');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginMessage = document.getElementById('loginMessage');
    const signupMessage = document.getElementById('signupMessage');

    // --- Toggle Logic ---
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginBox.classList.add('hidden');
        signupBox.classList.remove('hidden');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    });

    // --- Login Form Submission ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginMessage.textContent = '';
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the redirect
        } catch (error) {
            console.error("Login Error:", error.code);
            loginMessage.textContent = "Invalid credentials. Please try again.";
        }
    });

    // --- Sign-up Form Submission ---
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupMessage.textContent = '';
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        if (password.length < 6) {
            signupMessage.textContent = "Password must be at least 6 characters long.";
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Create the user profile document in Firestore
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userDocRef, {
                username: username,
                email: email,
                role: 'USER'
            });
            // onAuthStateChanged will handle the redirect
        } catch (error) {
            console.error("Signup Error:", error.code);
            if (error.code === 'auth/email-already-in-use') {
                signupMessage.textContent = "This email is already registered. Please login.";
            } else {
                signupMessage.textContent = "Could not create account. Please try again.";
            }
        }
    });
}

// =================================================================
// Dashboard Page Logic - HEAVILY UPDATED
// =================================================================
function handleDashboardPage(user, userData) {
    // --- State Variables ---
    let allEvents = [];
    let currentFilter = 'All';
    let searchTerm = ''; // <-- 1. ADD NEW STATE VARIABLE

    // --- Element Selectors ---
    const welcomeMessage = document.getElementById('welcomeMessage');
    const logoutButton = document.getElementById('logoutButton');
    const eventList = document.getElementById('eventList');
    const filterNav = document.querySelector('.filter-nav');
    const searchInput = document.getElementById('searchInput'); // <-- 1. ADD NEW SELECTOR

    // --- Modal Elements ---
    const eventModal = document.getElementById('eventModal');
    const postEventBtn = document.getElementById('postEventBtn');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const eventForm = document.getElementById('eventForm');
    const submitButton = document.getElementById('submitButton');

    welcomeMessage.textContent = `Welcome, ${userData.username}`;
    if (userData.role === 'ADMIN') {
        welcomeMessage.textContent += ` (Admin)`;
    }

    // --- Modal Logic ---
    const showModal = () => {
        eventModal.classList.add('show');
    };
    const hideModal = () => {
        eventModal.classList.remove('show');
        eventForm.reset();
        document.getElementById('eventId').value = '';
        submitButton.textContent = 'Publish Event';
    };

    postEventBtn.addEventListener('click', showModal);
    closeModalBtn.addEventListener('click', hideModal);
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) { // Close if clicking on the overlay
            hideModal();
        }
    });

    // --- Event Rendering Logic ---
    const renderEvents = () => { // <-- 3. REPLACE THIS ENTIRE FUNCTION
        eventList.innerHTML = '';

        // First, filter by the selected category
        let eventsToRender = currentFilter === 'All'
            ? allEvents
            : allEvents.filter(event => event.category === currentFilter);

        // Then, filter the result by the current search term
        if (searchTerm) {
            eventsToRender = eventsToRender.filter(event =>
                event.name.toLowerCase().includes(searchTerm)
            );
        }

        if (eventsToRender.length === 0) {
            eventList.innerHTML = '<p>No events match your criteria.</p>';
            return;
        }

        eventsToRender.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card glass-effect';
            eventCard.dataset.id = event.id;

            let actionsHtml = '';
            if (user.uid === event.authorId || userData.role === 'ADMIN') {
                actionsHtml += `<button class="edit-btn">Edit</button>`;
            }
            if (userData.role === 'ADMIN') {
                 actionsHtml += `<button class="delete-btn">Delete</button>`;
            }

            eventCard.innerHTML = `
                <div>
                    <h3>${event.name}</h3>
                    <p><strong>Deadline:</strong> ${new Date(event.deadline).toLocaleString()}</p>
                    <p><a href="${event.link}" target="_blank" rel="noopener noreferrer">Event Link</a></p>
                </div>
                <div class="card-footer">
                    <span class="category">${event.category}</span>
                    <div class="actions">${actionsHtml}</div>
                </div>
            `;
            eventList.appendChild(eventCard);
        });
    };

    // --- Firestore Real-time Listener ---
    const eventsQuery = query(collection(db, 'events'), where('deadline', '>', new Date().toISOString()), orderBy('deadline', 'asc'));
    onSnapshot(eventsQuery, (snapshot) => {
        allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderEvents(); // Re-render whenever data changes
    });

    // --- Filtering Logic ---
    filterNav.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelector('.filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            currentFilter = e.target.dataset.category;
            renderEvents();
        }
    });

    // --- Search Logic --- // <-- 2. ADD THIS NEW EVENT LISTENER
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase().trim();
        renderEvents();
    });

    // --- Form & Actions Logic ---
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventId = document.getElementById('eventId').value;
        const eventData = {
            name: document.getElementById('eventName').value,
            link: document.getElementById('eventLink').value,
            deadline: document.getElementById('eventDeadline').value,
            category: document.getElementById('eventCategory').value,
            authorId: user.uid,
            authorName: userData.username
        };
        try {
            if (eventId) await updateDoc(doc(db, 'events', eventId), eventData);
            else await addDoc(collection(db, 'events'), eventData);
            hideModal();
        } catch (error) { alert(`Error: ${error.message}`); }
    });

    eventList.addEventListener('click', async (e) => {
        const eventCard = e.target.closest('.event-card');
        if (!eventCard) return;
        const eventId = eventCard.dataset.id;
        const eventDocRef = doc(db, 'events', eventId);

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this event?')) {
                await deleteDoc(eventDocRef);
            }
        } else if (e.target.classList.contains('edit-btn')) {
            const docSnap = await getDoc(eventDocRef);
            const event = docSnap.data();
            document.getElementById('eventId').value = docSnap.id;
            document.getElementById('eventName').value = event.name;
            document.getElementById('eventLink').value = event.link;
            document.getElementById('eventDeadline').value = event.deadline;
            document.getElementById('eventCategory').value = event.category;
            submitButton.textContent = 'Update Event';
            showModal();
        }
    });

    logoutButton.addEventListener('click', () => signOut(auth));
}
