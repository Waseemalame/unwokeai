import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import HomePage from './Home.jsx'
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom' //I changed BrowserRouter to just Router

function OurApp(){
 return(
    <>
    <Router>
      <Switch>
        <Route exact path='/'>
          <App />
        </Route>
        <Route exact path='/Home'>
          <HomePage />
        </Route>
      </Switch>
    </Router>
  </>
 )
 
}

const root = ReactDOM.createRoot(document.querySelector("#root"))
root.render(<OurApp />)