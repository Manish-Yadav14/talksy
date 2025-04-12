import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Hero from './Hero.jsx'
import {BrowserRouter as Router,Route, Routes} from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <>
   <Router>
    <Routes>
      <Route path='/' element={<Hero/>}/>
      <Route path='/meeting' element={<App/>}/>
    </Routes>
   </Router>
  </>
)
