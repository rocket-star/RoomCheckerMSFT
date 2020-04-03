const mongoose = require('mongoose');

const codecSchema = mongoose.Schema(
  {
    // _id: mongoose.Schema.Types.ObjectId,
    name: {
      type: String,
      required: true,
    },
    nbPeople: {
      type: Number,
      required: true,
    },
    mac: {
      type: String,
      required: true,
      unique: true,
    },
    ip: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: false,
      required: true,
    },
    publicIp: {
      type: String,
    },
    inMeeting: {
      type: Boolean,
      default: false,
    },
    meetingTitle: {
      type: String,
    },
    meetingDuration: {
      type: String,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    personEmail: {
      type: String,
    },
  },
);

module.exports = mongoose.model('Codec', codecSchema);
