let socket = io();

const delayTime = 1000;
let socketDate = new Date(Date.now());
let viewTime = document.getElementById('server_time');
let table = document.getElementById('clock-table');

socket.on('request_time', () => {
    socket.emit('datetime', customClock());
});

socket.on('synchronize', time => {
    console.log('Hey! There is a new time:', new Date(time).toLocaleTimeString());
    clearInterval(interval);
    displayDiff(time);
    socketDate = new Date(time);
    interval = setInterval(intervalFun, delayTime);
    // viewTime.innerText = new Date(time).toLocaleTimeString();
});

socket.on('disconnect', () => {
    socket.close();
    console.log('Socket connection closed!');
});

function customClock() {
    let timeDiff = new Date(Date.now()).getSeconds() - socketDate.getSeconds();
    let customTime = socketDate;
    customTime.setSeconds(socketDate.getSeconds() + timeDiff);
    return customTime;
}

function displayDiff(time) {
    let syncTime = new Date(time);
    let secondsDiff = syncTime.getSeconds() - socketDate.getSeconds();
    let minutesDiff = syncTime.getMinutes() - socketDate.getMinutes();
    let hoursDiff = syncTime.getHours() - socketDate.getHours();
    let difference = `Hours: ${Math.abs(hoursDiff)}, minutes: ${Math.abs(minutesDiff)}, seconds: ${Math.abs(secondsDiff)}`;
    addTableRow(socketDate.toLocaleTimeString(), difference, syncTime.toLocaleTimeString());
}

function addTableRow(initialTime, timeDiff, newTime) {
    let row = table.insertRow(1);
    let startTime = row.insertCell(0);
    let diff = row.insertCell(1);
    let syncTime = row.insertCell(2);
    startTime.innerHTML = initialTime;
    diff.innerHTML = timeDiff;
    syncTime.innerHTML = newTime;
}

function intervalFun() {
    viewTime.innerText = customClock().toLocaleTimeString();
}

function editTime() {
    let hoursEdit = document.getElementById('hoursControl');
    let minutesEdit = document.getElementById('minutesControl');
    let secondsEdit = document.getElementById('secondsControl');
    socketDate.setHours(hoursEdit.value);
    socketDate.setMinutes(minutesEdit.value);
    socketDate.setSeconds(secondsEdit.value);
}

let interval = setInterval(intervalFun, delayTime);
