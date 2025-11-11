import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import RoleSelectPage from './pages/RoleSelectPage.jsx'
import StudentHome from './pages/StudentHome.jsx'
import TeacherHome from './pages/TeacherHome.jsx'
import AdminHome from './pages/AdminHome.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/roleselect" element={<RoleSelectPage />} />
      <Route path="/studenthome" element={<StudentHome />} />
      <Route path="/teacherhome" element={<TeacherHome />} />
      <Route path="/adminhome" element={<AdminHome />} />
    </Routes>
  )
}

export default App