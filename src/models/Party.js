// src/models/Party.js

const mongoose = require('mongoose');

const partySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      // Simple E.164 phone format validation helper (+[country_code][number])
      validate: {
        validator: function(v) {
          return /^\+[1-9]\d{1,14}$/.test(v);
        },
        message: props => `${props.value} is not a valid E.164 phone number!`
      }
    },
    whatsappEnabled: {
      type: Boolean,
      default: true,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    tallyGuid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Party', partySchema);
