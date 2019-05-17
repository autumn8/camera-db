const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
    name: String,
    isEnabled: Boolean,
    zoneX: Number,
    zoneY: Number,
    zoneWidth: Number,
    zoneHeight: Number    
});


const Camera = mongoose.model('Camera', cameraSchema);

module.exports = Camera;