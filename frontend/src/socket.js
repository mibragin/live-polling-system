import { io } from 'socket.io-client';

// Use environment variable for backend URL
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

console.log('Connecting to backend:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Socket event manager
export const socketEvents = {
  // Connection status
  onConnect: (callback) => socket.on('connect', callback),
  onDisconnect: (callback) => socket.on('disconnect', callback),
  onConnectError: (callback) => socket.on('connect_error', callback),

  // Emit events (sending to server)
  joinAsTeacher: () => {
    console.log('Emitting join-as-teacher');
    socket.emit('join-as-teacher');
  },
  joinAsStudent: (name) => {
    console.log('Emitting join-as-student:', name);
    socket.emit('join-as-student', name);
  },
  createPoll: (pollData) => socket.emit('create-poll', pollData),
  submitAnswer: (answer) => socket.emit('submit-answer', answer),
  getResults: () => socket.emit('get-results'),
  getPollHistory: () => socket.emit('get-poll-history'),

  // Listen events (receiving from server)
  onJoined: (callback) => socket.on('joined-successfully', callback),
  onNewPoll: (callback) => socket.on('new-poll', callback),
  onPollResults: (callback) => socket.on('poll-results', callback),
  onAnswerReceived: (callback) => socket.on('answer-received', callback),
  onStudentJoined: (callback) => socket.on('student-joined', callback),
  onStudentLeft: (callback) => socket.on('student-left', callback),
  onPollUpdate: (callback) => socket.on('poll-update', callback),
  onStudentsList: (callback) => socket.on('students-list', callback),
  onPollHistory: (callback) => socket.on('poll-history', callback),

  // Remove listeners
  removeAllListeners: () => socket.removeAllListeners(),
};

// Log connection status
socket.on('connect', () => {
  console.log('✅ Connected to server:', SOCKET_URL);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});