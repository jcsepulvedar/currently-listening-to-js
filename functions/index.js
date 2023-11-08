/* eslint-disable max-len */
require('dotenv').config();
const getCurrentlyPlaying = require('./currentlyListeningTo').getCurrentlyPlaying;
const trailheadCard = require('./trailhead').trailheadCard;
const trailheadStats = require('./trailhead').trailheadStats;
// const updateStats = require('./trailhead').updateStats;


/**
 * TODO:
 * - axios instead of node-fetch
 * - More styles
 * - Better SVG builder
 */

const admin = require('firebase-admin');

admin.initializeApp();

exports.getCurrentlyPlaying = getCurrentlyPlaying;
exports.trailheadCard = trailheadCard;
exports.trailheadStats = trailheadStats;
// exports.updateStats = updateStats;

// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /{document=**} {
//       allow read, write: if false;
//     }
//   }
// }

// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /{document=**} {
//       allow read, write: if
//           request.time < timestamp.date(2022, 4, 6);
//     }
//   }
// }
