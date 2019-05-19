const mongoose = require('mongoose');
const mqtt = require('mqtt');
const mqttHost = 'mqtt://localhost:1883';
const mongoDbUrl = 'mongodb://localhost/camera';
const client = mqtt.connect(mqttHost);
const Camera = require('./Camera');
const cameraDefaults = require('./cameraDefaults');

client.on('connect', function () {
    client.subscribe('camera/connected/#');
    client.subscribe('camera/update/#');
});

client.on("message", (topic, message) => {
    console.log("topic", topic);
    if (topic.includes("camera/update")) {
        console.log("camera update");
        const cameraProps = JSON.parse(message);
        console.log(JSON.parse(message));
        const routeSegments = topic.split("/");
        const cameraName = routeSegments[routeSegments.length - 1];
        Camera.findOneAndUpdate({ name: cameraName }, cameraProps, function (err, doc) {
            if (err) console.warn(err);
            console.log('updated succesfully, send update to mqtt broker');
        });
    }
    else if (topic.includes("camera/connected")) {
        //if messge is 1- device is connectedconnected and payload is 1, device has connected to broker.
        if (message.toString() == 1) {
            onCameraConnected(topic, message);
        }
    }
});


function onCameraConnected(topic, message) {
    const routeSegments = topic.split("/");
    const cameraName = routeSegments[routeSegments.length - 1];
    const defaults = {
        name: cameraName,
        ...cameraDefaults
    };

    Camera.findOneAndUpdate({ name: cameraName }, {$setOnInsert: defaults}, { upsert: true})
        .then(camera => {
            console.log(camera);
            const cameraSettings = JSON.stringify(camera)
            client.publish(`camera/initialized/${camera.name}`, cameraSettings);
        })
        .catch(error => console.log(error));
}

mongoose.connect('mongodb://localhost/camera', { useNewUrlParser: true, useFindAndModify: false });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected');
});

/* camera.save(function (err, camera) {
    if (err) return console.error(err);
    console.log(camera);
}); */

/* Camera.find(function (err, cameras) {
    if (err) return console.error(err);
    console.log(cameras);
}); */
