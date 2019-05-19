const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
    name: String,
    isDetectionEnabled: Boolean,
    zoneX: Number,  //x as % of frame width
    zoneY: Number,  //y as % of frame height
    zoneWidth: Number, // width as % of frame width
    zoneHeight: Number    //height as % of frame height
});


const Camera = mongoose.model('Camera', cameraSchema);

module.exports = Camera;