'use strict';

const express = require('express');
const io = require('socket.io');
const axios = require('axios');
const port = process.env[2] || 5000;

// Socket.io Implementation
const app = express();
const http = require('http').Server(app);
let socket = io(http);

// App
app.use(express.static(__dirname + "/public"));

let baseServerUrl = 'http://worldtimeapi.org/api/timezone/America/Bogota';
let nodes = [];
let clients, master_time, synchronized_time;
let allDifferencesSum, average_time = 0;

// Socket Listener
socket.on('connection', node => {
    console.log('Node connected:', node.id);
    node.join('time room');
    clients = socket.sockets.adapter.rooms['time room'];

    node.on('datetime', time => {
        nodes.push({ id: node.id, time: new Date(time) });
        if (nodes.length === clients.length) {
            berkeleyAlgorithm();
            node.emit('synchronize', synchronized_time);
            node.broadcast.emit('synchronize', synchronized_time);
        }
    });

    node.on('disconnect', () => {
        node.leave('time room', '');
        deleteDisconnectedNode(node);
    });
});

async function getServerDate() {
    const request = await axios.get(baseServerUrl);
    const response = await request.data;
    return response.datetime;
}

function berkeleyAlgorithm() {
    nodes.forEach(slave => {
        let time_difference = master_time.getTime() - slave.time.getTime();
        allDifferencesSum += time_difference;
    });
    average_time = allDifferencesSum / nodes.length;
    synchronized_time = master_time.getTime() + average_time;
    console.log(`New server time: ${new Date(synchronized_time).toLocaleTimeString()}`);
}

function deleteDisconnectedNode(node) {
    console.log('Node disconnected:', node.id);
    let index = nodes.map(object => {
        return object.id;
    }).indexOf(node.id);
    nodes.splice(index, 1);
}

function resetAlgorithmTime() {
    nodes = [];
    allDifferencesSum = 0;
    average_time = 0;
}

setInterval(async () => {
    await resetAlgorithmTime();
    await getServerDate()
        .then(datetime => master_time = new Date(datetime))
        .catch(err => {console.log(err.Error)});
    await socket.to('time room').emit('request_time');
}, 60000);

http.listen(port, () => {
    console.log('Running on Port: ' + port);
});
