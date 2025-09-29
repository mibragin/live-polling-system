import React from 'react'

const RoleSelection = ({ onRoleSelect }) => {
  return (
    <div className="role-selection">
      <div className="container">
        <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#373737' }}>
          Welcome to the Live Polling System
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '40px', color: '#6E6E6E' }}>
          Please select the role that best describes you to begin using the live polling system
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
          <div className="role-card" onClick={() => onRoleSelect('student')}>
            <h2>I'm a Student</h2>
            <p>Submit answers and view live poll results in real-time.</p>
          </div>
          
          <div className="role-card" onClick={() => onRoleSelect('teacher')}>
            <h2>I'm a Teacher</h2>
            <p>Create and manage polls, ask questions, and monitor students' responses in real-time.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleSelection