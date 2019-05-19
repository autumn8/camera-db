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
    if (topic.includes("camera/update")){
        console.log("camera update");
        const cameraProps = JSON.parse(message);
        console.log(JSON.parse(message));
        const routeSegments = topic.split("/");
        const cameraName = routeSegments[routeSegments.length - 1];
        Camera.findOneAndUpdate({name: cameraName}, cameraProps, function(err, doc){
            if (err) console.warn(err);
            console.log('updated succesfully, send update to mqtt broker');
        });
    }
    else if (topic.includes("camera/connected")) {        
        //if messge is 1- device is connectedconnected and payload is 1, device has connected to broker.
        if (message.toString() == 1) {
            const routeSegments = topic.split("/");
            const cameraName = routeSegments[routeSegments.length - 1];
            //See if camera has already been initialized (exists in db)   
            //replace with find one and update     Camera.findOneAndUpdate({name: cameraName}, cameraProps, {upsert:true}, function(err, doc){               
            Camera.find({ name: cameraName })
                .then(cameras => {
                    if (cameras.length) handleCameraAlreadyInitialized(cameras, cameraName);
                    else handleCameraNotInitialized(cameras, cameraName)
                })
                .catch(error => console.log(error));
        }
    }
});

function handleCameraNotInitialized(cameras, cameraName) {    
    const cameraWithDefaultValues = generateCameraDefaultValues(cameraName);
    cameraWithDefaultValues.save(function (err, camera) {
        if (err) return console.error(console.log(camera));
        console.log('created');
        console.log(camera);
        client.publish(`camera/initialized/${camera.name}`, JSON.stringify(camera));
    });
}

function handleCameraAlreadyInitialized(cameras) {
    //caution if more than 1 device is found. 
    if (cameras.length > 1) console.warn('CAUTION! More than 1 camera found. Returning first camera');
    const camera = cameras[0];
    console.log('found');
    console.log(camera);
    client.publish(`camera/initialized/${camera.name}`, JSON.stringify(camera));
}

function generateCameraDefaultValues(cameraName) {
    console.log(cameraName);
    return new Camera({
        name: cameraName,
        ...cameraDefaults 
    });
}

mongoose.connect('mongodb://localhost/camera', { useNewUrlParser: true });
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
