// import uri
import { javaURI } from '../../js/api/config.js';

let assignment = null;
let currentQueue = [];
window.person = "John Mortensen";

document.getElementById('addQueue').addEventListener('click', addToQueue);
document.getElementById('removeQueue').addEventListener('click', removeFromQueue);
document.getElementById('resetQueue').addEventListener('click', resetQueue);

let timerInterval;
let timerlength;
let queueUpdateInterval;

const URL = javaURI + "/api/assignments/"
console.log(URL)

function startTimer() {
    console.log("Timer Started")
    let time = timerlength;
    timerInterval = setInterval(() => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        document.getElementById('timerDisplay').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        time--;
        if (time < 0) {
            clearInterval(timerInterval);
            moveToDoneQueue();
        }
    }, 1000);
}

window.startTimer = startTimer;

async function fetchQueue() {
    const response = await fetch(URL + `getQueue/${assignment}`);
    if (response.ok) {
        const data = await response.json();
        updateQueueDisplay(data);
    }
}

async function addToQueue() {
    await fetch(URL + `addQueue/${assignment}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([person])
    });
    fetchQueue();
}

async function removeFromQueue() {
    await fetch(URL + `removeQueue/${assignment}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([person])
    });
    fetchQueue();
}

async function moveToDoneQueue() {
    const firstPerson = [currentQueue[0]];
    await fetch(URL + `doneQueue/${assignment}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firstPerson)
    });
    fetchQueue();
}

async function resetQueue() {
    await fetch(URL + `resetQueue/${assignment}`, {
        method: 'PUT'
    });
    fetchQueue();
}

function updateQueueDisplay(queue) {
    currentQueue = queue.queue;

    const notGoneList = document.getElementById('notGoneList');
    const waitingList = document.getElementById('waitingList');
    const doneList = document.getElementById('doneList');

    notGoneList.innerHTML = queue.haventGone.map(person => `<div class="card">${person}</div>`).join('');
    waitingList.innerHTML = queue.queue.map(person => `<div class="card">${person}</div>`).join('');
    doneList.innerHTML = queue.done.map(person => `<div class="card">${person}</div>`).join('');
}

document.getElementById('initializeQueue').addEventListener('click', initializeQueue);

async function fetchAssignments() {
    console.log(URL + 'debug')
    const response = await fetch(URL + 'debug');
    if (response.ok) {
        const assignments = await response.json();
        const dropdown = document.getElementById('assignmentDropdown');
        dropdown.innerHTML = assignments.map(assignment =>
            `<option value="${assignment.id}">${assignment.name}</option>`
        ).join('');
    }
}

// need to wait for function to only fetch from certain period
async function fetchPeople() {
    const response = await fetch(javaURI + '/api/people');
    if (response.ok) {
        const people = await response.json();
        return people.map(person => person.name);
    }
    return [];
}

async function initializeQueue() {
    timerlength = parseInt(document.getElementById("durationInput").value);
    const assignmentId = document.getElementById('assignmentDropdown').value;
    // const peopleList = await fetchPeople();
    const peopleList = ["John Mortensen", "Person 1", "Person 2"];

    await fetch(URL + `initQueue/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(peopleList)
    });
    assignment = assignmentId;
    fetchQueue();
}

// Start the interval to periodically update the queue
function startQueueUpdateInterval(intervalInSeconds) {
    if (queueUpdateInterval) clearInterval(queueUpdateInterval); // Clear existing interval if any
    queueUpdateInterval = setInterval(() => {
        console.log("Updating queue...");
        fetchQueue();
    }, intervalInSeconds * 1000);
}

// Stop the interval for queue updates if needed
function stopQueueUpdateInterval() {
    if (queueUpdateInterval) clearInterval(queueUpdateInterval);
}

window.addEventListener('load', () => {
    showAssignmentModal();
});

function showAssignmentModal() {
    const modal = document.getElementById('assignmentModal');
    const modalDropdown = document.getElementById('modalAssignmentDropdown');
    
    // Fetch assignments and populate the dropdown
    fetchAssignments().then(() => {
        const dropdown = document.getElementById('assignmentDropdown');
        modalDropdown.innerHTML = dropdown.innerHTML; // Use the same data as the main dropdown
    });

    modal.style.display = 'block';

    // Add event listener for the confirm button
    document.getElementById('confirmAssignment').addEventListener('click', () => {
        const selectedAssignment = modalDropdown.value;
        if (selectedAssignment) {
            assignment = selectedAssignment; // Set the global assignment variable
            fetchQueue(); // Fetch the queue for the selected assignment
            startQueueUpdateInterval(30);
            modal.style.display = 'none'; // Hide the modal
        } else {
            alert('Please select an assignment.');
        }
    });
}

fetchAssignments();
fetchQueue();