import {Routes,Route} from "react-router-dom"

import ProtectedRoute from "./pages/Component/ProtectedRoute.jsx"
import MainPage from "./pages/MainPage.jsx"
import Register from "./pages/Register.jsx"
import SignIn from "./pages/SignIn.jsx"
import Search from "./pages/LeftSidePages/Search.jsx"
import Profile from "./pages/LeftSidePages/Profile.jsx"
import Notifications from "./pages/LeftSidePages/Notifications.jsx"

function App() {


  return (
    <Routes>

        <Route path="/register" element={<Register />}/>     
        <Route path="/signin" element={<SignIn/ >}/>

        <Route element={<ProtectedRoute/>}>
          <Route path="/" element={<MainPage/>}/>  
          <Route path="/search" element={<Search/ >}/>
          <Route path="/profiles/:username" element={<Profile/ >}/>
          <Route path="/notifications" element={<Notifications/ >}/>
        </Route>
    </Routes>
  )
}

export default App
