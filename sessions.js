// Tracks each user's progress through the form
const sessions = {};

function getSession(chatId) {
  return sessions[chatId] || null;
}

function createSession(chatId) {
  sessions[chatId] = {
    step: 'eventType',
    data: {
      eventType: '',
      eventName: '',
      hostName: '',
      guestName: '',
      date: '',
      time: '',
      venue: '',
      dresscode: '',
      rsvp: ''
    }
  };
  return sessions[chatId];
}

function updateSession(chatId, nextStep, fieldData) {
  if (!sessions[chatId]) return;
  sessions[chatId].step = nextStep;
  if (fieldData) {
    Object.assign(sessions[chatId].data, fieldData);
  }
}

function clearSession(chatId) {
  delete sessions[chatId];
}

module.exports = { getSession, createSession, updateSession, clearSession };
