import ReactDOM from 'react-dom/client'
import { getAuth, signOut } from 'firebase/auth'

export default function HomePage(){
      
    return(
        <>           
            <h1>Welcome to our Home Page!!!</h1>   

            <button id='logout-btn'>Log Out</button>  
            
        </>
    )
    
}


