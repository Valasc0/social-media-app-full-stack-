import API_URL from '../../../api';
import {Link} from 'react-router-dom'
import styles from './MainLayout.module.css'
import logo from "../../assets/union-b-black.svg";
import { useState } from 'react'
import { useEffect } from 'react'
const MainLayout = () => {
  
  
  const [friends,setFriends] = useState([])
  const username = localStorage.getItem("username")

  const getFriends = async () => {

    const response = await fetch(`${API_URL}/${localStorage.getItem("ownId")}/friends`)

    const data = await response.json()
    setFriends(data)
  }

  useEffect(()=>{
    getFriends()
  },[username])

  
  
  
  
  


  return (
    <>
    <div className={styles.leftContainer}>
                <Link to="/">Home</Link>
                <Link to="/search">Search</Link>   
                <Link to="/notifications">Notifications</Link> 
                <Link to={`/profiles/${localStorage.getItem("username")}`}>Profile</Link> 
                
                 
     </div>

     <div className={styles.rightContainer}>
            <h1 className={styles.friendsHeader}>Friends</h1>

            {friends.map((friend) => (
              <Link key={friend.id} to={`/profiles/${friend.name}`}>
                <div className={styles.friendBox}>
                  <p className={styles.friendText}>{friend.name}</p>
                </div>
              </Link>
            ))}

      </div>

      <div className={styles.upContainer}>
          <img src={logo} alt="Logo"></img>    
            
      </div>
    </>
  )
}

export default MainLayout