const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS configuration for production
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://your-polling-frontend.netlify.app", // Update after deployment
      "https://your-polling-frontend.onrender.com" // Update after deployment
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://your-polling-frontend.netlify.app",
    "https://your-polling-frontend.onrender.com"
  ],
  credentials: true
}));
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Store active polls and users
let activePoll = null;
let users = new Map();
let students = [];
let pollHistory = [];

// Calculate poll results
const calculateResults = (poll) => {
  if (!poll || !poll.answers) return {};
  
  const optionCounts = {};
  poll.options.forEach(option => {
    optionCounts[option] = 0;
  });
  
  poll.answers.forEach((answer) => {
    if (optionCounts[answer] !== undefined) {
      optionCounts[answer]++;
    }
  });
  
  const totalVotes = poll.answers.size;
  const results = {};
  
  poll.options.forEach(option => {
    const count = optionCounts[option] || 0;
    results[option] = {
      count: count,
      percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
    };
  });
  
  return results;
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Join as teacher
  socket.on('join-as-teacher', () => {
    users.set(socket.id, { role: 'teacher', socketId: socket.id });
    socket.emit('joined-successfully', { role: 'teacher' });
    
    socket.emit('students-list', students);
    socket.emit('poll-history', pollHistory);
    
    if (activePoll) {
      socket.emit('poll-update', activePoll);
    }
  });

  // Join as student
  socket.on('join-as-student', (studentName) => {
    const studentData = {
      role: 'student',
      name: studentName,
      socketId: socket.id,
      hasAnswered: false
    };
    
    users.set(socket.id, studentData);
    students.push(studentData);
    
    socket.emit('joined-successfully', { role: 'student', name: studentName });
    
    io.emit('student-joined', studentData);
    io.emit('students-list', students);
    
    if (activePoll && !activePoll.showResults) {
      socket.emit('new-poll', activePoll);
    } else if (activePoll && activePoll.showResults) {
      socket.emit('poll-results', activePoll);
    }
  });

  // Teacher creates a new poll
  socket.on('create-poll', (pollData) => {
    if (activePoll && activePoll.showResults) {
      pollHistory.push({
        ...activePoll,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      });
    }

    activePoll = {
      id: Date.now().toString(),
      question: pollData.question,
      options: pollData.options,
      timeLimit: pollData.timeLimit || 60,
      showResults: false,
      startTime: Date.now(),
      answers: new Map(),
      questionNumber: pollHistory.length + 1
    };

    students.forEach(student => {
      student.hasAnswered = false;
    });

    io.emit('new-poll', activePoll);
    io.emit('students-list', students);
    
    setTimeout(() => {
      if (activePoll && !activePoll.showResults) {
        activePoll.showResults = true;
        activePoll.results = calculateResults(activePoll);
        
        pollHistory.push({
          ...activePoll,
          timestamp: new Date().toISOString()
        });
        
        io.emit('poll-results', activePoll);
        io.emit('poll-history', pollHistory);
      }
    }, activePoll.timeLimit * 1000);
  });

  // Student submits answer
  socket.on('submit-answer', (answer) => {
    const user = users.get(socket.id);
    if (user && user.role === 'student' && activePoll && !activePoll.showResults) {
      activePoll.answers.set(socket.id, answer);
      user.hasAnswered = true;
      
      const studentIndex = students.findIndex(s => s.socketId === socket.id);
      if (studentIndex !== -1) {
        students[studentIndex].hasAnswered = true;
      }
      
      io.emit('answer-received', {
        studentName: user.name,
        answer: answer
      });
      
      io.emit('poll-update', activePoll);
      io.emit('students-list', students);
    }
  });

  // Get current poll results
  socket.on('get-results', () => {
    if (activePoll) {
      activePoll.showResults = true;
      activePoll.results = calculateResults(activePoll);
      
      pollHistory.push({
        ...activePoll,
        timestamp: new Date().toISOString()
      });
      
      io.emit('poll-results', activePoll);
      io.emit('poll-history', pollHistory);
    }
  });

  // Get poll history
  socket.on('get-poll-history', () => {
    socket.emit('poll-history', pollHistory);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      
      if (user.role === 'student') {
        students = students.filter(s => s.socketId !== socket.id);
        io.emit('student-left', user.name);
        io.emit('students-list', students);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});