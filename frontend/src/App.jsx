import React, { useState } from 'react'
import RoleSelection from './components/RoleSelection'
import TeacherDashboard from './components/TeacherDashboard'
import StudentDashboard from './components/StudentDashboard'
import './App.css'

function App() {
  const [userRole, setUserRole] = useState(null)
  const [studentName, setStudentName] = useState('')

  const handleRoleSelect = (role) => {
    setUserRole(role)
  }

  const handleStudentJoin = (name) => {
    setStudentName(name)
    setUserRole('student')
  }

  const handleBackToRoleSelection = () => {
    setUserRole(null)
    setStudentName('')
  }

  return (
    <div className="App">
      {!userRole ? (
        <RoleSelection onRoleSelect={handleRoleSelect} />
      ) : userRole === 'teacher' ? (
        <TeacherDashboard onBack={handleBackToRoleSelection} />
      ) : (
        <StudentDashboard 
          studentName={studentName} 
          onNameSubmit={handleStudentJoin}
          onBack={handleBackToRoleSelection}
        />
      )}
    </div>
  )
}

export default App