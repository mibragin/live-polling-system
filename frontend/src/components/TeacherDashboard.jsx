import React, { useState, useEffect } from 'react';
import { socketEvents } from '../socket';

const TeacherDashboard = ({ onBack }) => {
  const [pollData, setPollData] = useState({
    question: '',
    options: ['', '', ''],
    timeLimit: 60
  });
  const [activePoll, setActivePoll] = useState(null);
  const [students, setStudents] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [liveResults, setLiveResults] = useState(null);
  const [pollHistory, setPollHistory] = useState([]);
  const [viewMode, setViewMode] = useState('create');

  useEffect(() => {
    console.log('🔄 TeacherDashboard mounted - setting up socket listeners');
    
    // Set up connection listeners
    socketEvents.onConnect(() => {
      console.log('✅ Connected to server');
    });

    socketEvents.onConnectError((error) => {
      console.log('❌ Connection error:', error);
    });

    // Join as teacher
    socketEvents.joinAsTeacher();

    // Set up event listeners
    socketEvents.onJoined((data) => {
      console.log('✅ Teacher joined successfully:', data);
    });

    socketEvents.onStudentsList((studentsList) => {
      console.log('📊 Students list updated:', studentsList);
      setStudents(studentsList);
    });

    socketEvents.onStudentJoined((student) => {
      console.log('🎒 New student joined:', student);
      setStudents(prev => [...prev, student]);
    });

    socketEvents.onStudentLeft((studentName) => {
      console.log('🚶 Student left:', studentName);
      setStudents(prev => prev.filter(s => s.name !== studentName));
    });

    socketEvents.onAnswerReceived((data) => {
      console.log('📝 Answer received:', data);
      setAnswers(prev => [...prev, data]);
      if (activePoll && !activePoll.showResults) {
        calculateLiveResults();
      }
    });

    socketEvents.onPollUpdate((poll) => {
      console.log('📊 Poll updated:', poll);
      setActivePoll(poll);
      calculateLiveResults();
      setViewMode('active');
    });

    socketEvents.onPollResults((results) => {
      console.log('🏁 Poll results:', results);
      setActivePoll(results);
      setLiveResults(results.results);
      setViewMode('history');
    });

    socketEvents.onPollHistory((history) => {
      console.log('📚 Poll history:', history);
      setPollHistory(history);
    });

    // Load poll history
    socketEvents.getPollHistory();

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socketEvents.removeAllListeners();
    };
  }, [activePoll]);

  // Calculate live results from current answers
  const calculateLiveResults = () => {
    if (!activePoll || !activePoll.answers) return;
    
    const optionCounts = {};
    activePoll.options.forEach(option => {
      optionCounts[option] = 0;
    });
    
    activePoll.answers.forEach((answer) => {
      if (optionCounts[answer] !== undefined) {
        optionCounts[answer]++;
      }
    });
    
    const totalVotes = activePoll.answers.size;
    const results = {};
    
    activePoll.options.forEach(option => {
      const count = optionCounts[option] || 0;
      results[option] = {
        count: count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
      };
    });
    
    setLiveResults(results);
  };

  const handleCreatePoll = () => {
    if (!pollData.question.trim()) {
      alert('Please enter a question');
      return;
    }

    const validOptions = pollData.options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please enter at least 2 options');
      return;
    }

    const pollToSend = {
      question: pollData.question,
      options: validOptions,
      timeLimit: pollData.timeLimit
    };

    console.log('📤 Creating poll:', pollToSend);
    socketEvents.createPoll(pollToSend);
    setAnswers([]);
    setLiveResults(null);
    
    // Reset form
    setPollData({
      question: '',
      options: ['', '', ''],
      timeLimit: 60
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...pollData.options];
    newOptions[index] = value;
    setPollData({ ...pollData, options: newOptions });
  };

  const addMoreOption = () => {
    if (pollData.options.length < 6) {
      setPollData({
        ...pollData,
        options: [...pollData.options, '']
      });
    }
  };

  const removeOption = (index) => {
    if (pollData.options.length > 2) {
      const newOptions = pollData.options.filter((_, i) => i !== index);
      setPollData({ ...pollData, options: newOptions });
    }
  };

  const endPollImmediately = () => {
    console.log('⏹️ Ending poll immediately');
    socketEvents.getResults();
  };

  const startNewPoll = () => {
    setActivePoll(null);
    setLiveResults(null);
    setViewMode('create');
  };

  const viewPollHistory = () => {
    socketEvents.getPollHistory();
    setViewMode('history');
  };

  const getTimeLeft = () => {
    if (!activePoll || activePoll.showResults) return 0;
    const elapsed = Date.now() - activePoll.startTime;
    const timeLeft = activePoll.timeLimit - Math.ceil(elapsed / 1000);
    return Math.max(0, timeLeft);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#F2F2F2',
      fontFamily: 'Segoe UI, sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto',
        background: 'white', 
        borderRadius: '12px', 
        padding: '40px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#373737', fontSize: '28px', fontWeight: '600' }}>
            {viewMode === 'create' && "Let's Get Started"}
            {viewMode === 'active' && `Question ${activePoll?.questionNumber || 1}`}
            {viewMode === 'history' && "Poll History"}
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={viewPollHistory}
              style={{
                background: pollHistory.length > 0 ? '#5767D0' : '#CCCCCC',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '8px',
                cursor: pollHistory.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '14px'
              }}
              disabled={pollHistory.length === 0}
            >
              View History ({pollHistory.length})
            </button>
            <button 
              onClick={onBack}
              style={{
                background: '#6E6E6E',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Back to Role Selection
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #F2F2F2', paddingBottom: '10px' }}>
          <button
            onClick={() => setViewMode('create')}
            style={{
              background: viewMode === 'create' ? '#7765DA' : 'transparent',
              color: viewMode === 'create' ? 'white' : '#373737',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Create New Poll
          </button>
          {activePoll && !activePoll.showResults && (
            <button
              onClick={() => setViewMode('active')}
              style={{
                background: viewMode === 'active' ? '#7765DA' : 'transparent',
                color: viewMode === 'active' ? 'white' : '#373737',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Current Poll
            </button>
          )}
          <button
            onClick={viewPollHistory}
            style={{
              background: viewMode === 'history' ? '#7765DA' : 'transparent',
              color: viewMode === 'history' ? 'white' : '#373737',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Poll History ({pollHistory.length})
          </button>
        </div>

        {/* CREATE POLL SECTION */}
        {viewMode === 'create' && (
          <div>
            <p style={{ color: '#6E6E6E', marginBottom: '30px', lineHeight: '1.5' }}>
              You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
            </p>

            {/* Question Input */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#373737', marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
                Enter your question
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input 
                  type="text" 
                  placeholder="Enter your question"
                  value={pollData.question}
                  onChange={(e) => setPollData({ ...pollData, question: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '15px',
                    border: '2px solid #F2F2F2',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <select 
                  value={pollData.timeLimit}
                  onChange={(e) => setPollData({ ...pollData, timeLimit: parseInt(e.target.value) })}
                  style={{
                    padding: '15px',
                    border: '2px solid #F2F2F2',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white'
                  }}
                >
                  <option value="30">30 seconds</option>
                  <option value="60">60 seconds</option>
                  <option value="90">90 seconds</option>
                  <option value="120">120 seconds</option>
                </select>
              </div>
            </div>

            {/* Options Section */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#373737', marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
                Edit Options
              </h3>
              
              {pollData.options.map((option, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    color: '#6E6E6E',
                    fontWeight: '500',
                    minWidth: '30px'
                  }}>{index + 1}.</div>
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '2px solid #F2F2F2',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                  {pollData.options.length > 2 && (
                    <button 
                      onClick={() => removeOption(index)}
                      style={{
                        background: '#FF6B6B',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              
              {pollData.options.length < 6 && (
                <button 
                  onClick={addMoreOption}
                  style={{
                    background: 'transparent',
                    color: '#7765DA',
                    border: '2px dashed #7765DA',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    width: '100%',
                    marginTop: '10px'
                  }}
                >
                  + Add More Option
                </button>
              )}
            </div>

            {/* Create Poll Button */}
            <button 
              onClick={handleCreatePoll}
              style={{
                background: '#7765DA',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                width: '100%',
                fontWeight: '500'
              }}
            >
              Create Poll
            </button>
          </div>
        )}

        {/* ACTIVE POLL SECTION */}
        {viewMode === 'active' && activePoll && !activePoll.showResults && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#373737', fontSize: '24px', fontWeight: '600' }}>Question {activePoll.questionNumber}</h2>
              <div style={{
                background: '#7765DA',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {String(Math.floor(getTimeLeft() / 60)).padStart(2, '0')}:{String(getTimeLeft() % 60).padStart(2, '0')}
              </div>
            </div>

            <p style={{ 
              fontSize: '20px', 
              marginBottom: '30px', 
              color: '#373737',
              fontWeight: '500',
              lineHeight: '1.4'
            }}>
              {activePoll.question}
            </p>

            {/* Live Results Section */}
            {liveResults && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#373737', marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                  Live Results ({activePoll.answers ? activePoll.answers.size : 0} votes)
                </h3>
                
                {activePoll.options.map((option, index) => {
                  const result = liveResults[option] || { percentage: 0, count: 0 };
                  return (
                    <div key={index} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px', color: '#373737', fontWeight: '500' }}>
                          {index + 1}. {option}
                        </span>
                        <span style={{ fontWeight: 'bold', color: '#7765DA', fontSize: '16px' }}>
                          {result.percentage}%
                        </span>
                      </div>
                      
                      {/* Rectangular Fill Container */}
                      <div style={{
                        width: '100%',
                        height: '35px',
                        background: '#F2F2F2',
                        border: '1px solid #E0E0E0',
                        borderRadius: '6px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${result.percentage}%`,
                          height: '100%',
                          background: '#7765DA',
                          transition: 'width 0.5s ease-in-out',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '10px',
                          borderRadius: result.percentage === 100 ? '6px' : '6px 0 0 6px'
                        }}>
                          {result.percentage > 25 && (
                            <span style={{ 
                              color: 'white', 
                              fontWeight: 'bold', 
                              fontSize: '14px',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                            }}>
                              {result.percentage}%
                            </span>
                          )}
                        </div>
                        
                        {result.percentage <= 25 && result.percentage > 0 && (
                          <span style={{ 
                            position: 'absolute',
                            left: `${result.percentage + 2}%`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#7765DA',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}>
                            {result.percentage}%
                          </span>
                        )}
                      </div>
                      
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#6E6E6E', 
                        marginTop: '5px',
                        textAlign: 'right'
                      }}>
                        {result.count} votes
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '15px',
              background: '#F8F9FA',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <span style={{ color: '#373737', fontWeight: '500' }}>
                Students answered: {activePoll.answers ? activePoll.answers.size : 0}/{students.length}
              </span>
            </div>

            <button 
              onClick={endPollImmediately}
              style={{
                background: '#7765DA',
                color: 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500',
                width: '100%'
              }}
            >
              End Poll & Show Final Results
            </button>
          </div>
        )}

        {/* POLL HISTORY SECTION */}
        {viewMode === 'history' && (
          <div>
            {pollHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6E6E6E' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>No poll history yet</h3>
                <p>Create and complete polls to see their results here.</p>
                <button 
                  onClick={() => setViewMode('create')}
                  style={{
                    background: '#7765DA',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '15px'
                  }}
                >
                  Create First Poll
                </button>
              </div>
            ) : (
              <div>
                <h2 style={{ color: '#373737', marginBottom: '25px', fontSize: '24px', fontWeight: '600' }}>
                  Previous Polls ({pollHistory.length})
                </h2>
                
                {pollHistory.slice().reverse().map((poll, index) => (
                  <div key={poll.id} style={{ 
                    marginBottom: '30px', 
                    padding: '25px',
                    border: '1px solid #F2F2F2',
                    borderRadius: '8px',
                    background: '#F8F9FA'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <h3 style={{ color: '#373737', fontSize: '18px', fontWeight: '600' }}>
                        Question {pollHistory.length - index}: {poll.question}
                      </h3>
                      <span style={{ color: '#6E6E6E', fontSize: '14px' }}>
                        {formatTime(poll.timestamp)}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      {poll.options.map((option, optIndex) => {
                        const result = poll.results[option] || { percentage: 0, count: 0 };
                        return (
                          <div key={optIndex} style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '14px', color: '#373737', fontWeight: '500' }}>
                                {optIndex + 1}. {option}
                              </span>
                              <span style={{ fontWeight: 'bold', color: '#7765DA', fontSize: '14px' }}>
                                {result.percentage}%
                              </span>
                            </div>
                            
                            <div style={{
                              width: '100%',
                              height: '25px',
                              background: '#F2F2F2',
                              border: '1px solid #E0E0E0',
                              borderRadius: '6px',
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${result.percentage}%`,
                                height: '100%',
                                background: '#7765DA',
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: '8px',
                                borderRadius: result.percentage === 100 ? '6px' : '6px 0 0 6px'
                              }}>
                                {result.percentage > 30 && (
                                  <span style={{ 
                                    color: 'white', 
                                    fontWeight: 'bold', 
                                    fontSize: '12px'
                                  }}>
                                    {result.percentage}%
                                  </span>
                                )}
                              </div>
                              
                              {result.percentage <= 30 && result.percentage > 0 && (
                                <span style={{ 
                                  position: 'absolute',
                                  left: `${result.percentage + 2}%`,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: '#7765DA',
                                  fontWeight: 'bold',
                                  fontSize: '12px'
                                }}>
                                  {result.percentage}%
                                </span>
                              )}
                            </div>
                            
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6E6E6E', 
                              marginTop: '3px',
                              textAlign: 'right'
                            }}>
                              {result.count} votes
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6E6E6E',
                      textAlign: 'center',
                      padding: '10px',
                      background: 'white',
                      borderRadius: '6px'
                    }}>
                      Total votes: {poll.answers ? poll.answers.size : 0} • {formatTime(poll.timestamp)}
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => setViewMode('create')}
                  style={{
                    background: '#7765DA',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    width: '100%',
                    marginTop: '20px'
                  }}
                >
                  + Create New Poll
                </button>
              </div>
            )}
          </div>
        )}

        {/* Connected Students */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px',
          background: '#F8F9FA',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#373737', marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>
            Connected Students ({students.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {students.map((student, index) => (
              <div key={index} style={{
                background: student.hasAnswered ? '#28a745' : '#7765DA',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{student.name}</span>
                {student.hasAnswered && (
                  <span style={{ fontSize: '12px' }}>✓</span>
                )}
              </div>
            ))}
            {students.length === 0 && (
              <div style={{ color: '#6E6E6E', fontStyle: 'italic' }}>
                No students connected yet. Open another browser tab and join as a student to test.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;