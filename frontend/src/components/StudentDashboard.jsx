import React, { useState, useEffect } from 'react';
import { socketEvents } from '../socket';

const StudentDashboard = ({ studentName, onNameSubmit, onBack }) => {
  const [name, setName] = useState(studentName || '');
  const [activePoll, setActivePoll] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [pollResults, setPollResults] = useState(null);

  useEffect(() => {
    if (studentName) {
      socketEvents.joinAsStudent(studentName);

      socketEvents.onNewPoll((poll) => {
        setActivePoll(poll);
        setSelectedAnswer('');
        setHasAnswered(false);
        setPollResults(null);
        setTimeLeft(poll.timeLimit);
      });

      socketEvents.onPollResults((results) => {
        setActivePoll(null);
        setPollResults(results);
        setHasAnswered(false);
      });

      return () => {
        socketEvents.removeAllListeners();
      };
    }
  }, [studentName]);

  useEffect(() => {
    if (activePoll && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && activePoll) {
      setHasAnswered(true);
    }
  }, [activePoll, timeLeft]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer && activePoll) {
      socketEvents.submitAnswer(selectedAnswer);
      setHasAnswered(true);
    }
  };

  // Name Entry Screen
  if (!studentName) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#F2F2F2',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          width: '400px'
        }}>
          <h1 style={{ 
            color: '#373737', 
            marginBottom: '15px',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            Let's Get Started
          </h1>
          <p style={{ 
            color: '#6E6E6E', 
            marginBottom: '30px',
            lineHeight: '1.5'
          }}>
            If you're a student, you'll be able to submit your answers, participate in live polls, 
            and see how your responses compare with your classmates.
          </p>
          
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #F2F2F2',
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '20px'
              }}
              required
            />
            <button 
              type="submit" 
              style={{
                background: '#7765DA',
                color: 'white',
                border: 'none',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                width: '100%',
                fontWeight: '500'
              }}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main Student Interface
  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#F2F2F2',
      fontFamily: 'Segoe UI, sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        background: 'white', 
        borderRadius: '12px', 
        padding: '40px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#373737', fontSize: '24px', fontWeight: '600' }}>
            {activePoll ? 'Question 1' : (pollResults ? 'Results' : 'Welcome!')}
          </h1>
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

        {/* Active Poll */}
        {activePoll && !hasAnswered && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: '#373737', fontSize: '20px', fontWeight: '600' }}>Question</h2>
              <div style={{
                background: '#7765DA',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
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

            <div style={{ marginBottom: '30px' }}>
              {activePoll.options.map((option, index) => (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    padding: '15px',
                    border: selectedAnswer === option ? '2px solid #7765DA' : '2px solid #F2F2F2',
                    borderRadius: '8px',
                    background: selectedAnswer === option ? '#F0F8FF' : 'white',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="radio"
                      name="poll-answer"
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      style={{ 
                        marginRight: '15px',
                        width: '18px',
                        height: '18px'
                      }}
                    />
                    <span style={{ fontSize: '16px', color: '#373737', fontWeight: '500' }}>
                      {index + 1}. {option}
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <button 
              onClick={handleAnswerSubmit} 
              disabled={!selectedAnswer}
              style={{
                background: selectedAnswer ? '#7765DA' : '#CCCCCC',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: selectedAnswer ? 'pointer' : 'not-allowed',
                width: '100%',
                fontWeight: '500'
              }}
            >
              Submit Answer
            </button>
          </div>
        )}

        {/* After Answer Submitted */}
        {activePoll && hasAnswered && (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ 
              fontSize: '48px', 
              color: '#28a745',
              marginBottom: '20px'
            }}>✓</div>
            <h3 style={{ color: '#373737', marginBottom: '15px', fontSize: '20px' }}>Answer Submitted!</h3>
            <p style={{ color: '#6E6E6E', fontSize: '16px' }}>You selected: <strong>{selectedAnswer}</strong></p>
            <p style={{ color: '#6E6E6E', marginTop: '10px' }}>Waiting for results...</p>
          </div>
        )}

        {/* Poll Results with Rectangular Fills */}
        {pollResults && pollResults.results && (
          <div>
            <h2 style={{ color: '#373737', marginBottom: '25px', fontSize: '24px', fontWeight: '600' }}>Question 1</h2>
            
            <p style={{ 
              fontSize: '20px', 
              marginBottom: '30px', 
              color: '#373737',
              fontWeight: '500',
              lineHeight: '1.4'
            }}>
              {pollResults.question}
            </p>

            {/* Results with Rectangular Fill Bars */}
            <div style={{ marginBottom: '30px' }}>
              {pollResults.options.map((option, index) => {
                const result = pollResults.results[option] || { percentage: 0, count: 0 };
                return (
                  <div key={index} style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
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
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Rectangular Fill */}
                      <div style={{
                        width: `${result.percentage}%`,
                        height: '100%',
                        background: '#7765DA',
                        transition: 'width 0.8s ease-in-out',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '10px'
                      }}>
                        {result.percentage > 20 && (
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
                      
                      {/* Percentage text for low percentages */}
                      {result.percentage <= 20 && (
                        <span style={{ 
                          position: 'absolute',
                          right: '10px',
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

            <div style={{ 
              textAlign: 'center', 
              padding: '30px',
              background: '#F8F9FA',
              borderRadius: '8px',
              marginTop: '40px'
            }}>
              <p style={{ color: '#6E6E6E', fontSize: '16px', fontStyle: 'italic' }}>
                Wait for the teacher to ask a new question..
              </p>
            </div>
          </div>
        )}

        {/* Waiting for Poll */}
        {!activePoll && !pollResults && (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ 
              fontSize: '48px', 
              color: '#7765DA',
              marginBottom: '20px'
            }}>⏳</div>
            <h3 style={{ color: '#373737', marginBottom: '15px', fontSize: '20px' }}>Wait for the teacher to ask questions..</h3>
            <p style={{ color: '#6E6E6E' }}>When the teacher starts a poll, it will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;