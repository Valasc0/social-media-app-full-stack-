import React, { useEffect, useState } from 'react'
import API_URL from '../../../api'
import styles from './Notifications.module.css'
import MainLayout from '../Component/MainLayout'
import { useSearchParams,Link } from 'react-router-dom'

const Notifications = () => {

  const [notifications,setNotifications] = useState([])


  const checkUserNotifications = async () => {
    const response = await fetch(`${API_URL}/users/requests/${localStorage.getItem("ownId")}`,{
      method:"GET"
    })

    if(response.ok){
      const data = await response.json()
      setNotifications(data)
      
      
    }
  }

  useEffect(()=>{
    checkUserNotifications()
  },[])




  return (
    <>
      <MainLayout/>
      <div className={styles.container}>
        <h1>Notifications</h1>
        
        {notifications.length > 0 ? notifications.map((notification)=>(
          <Link to={`/profiles/${notification.name}`}>
            <div key={notification.id} className={styles.notificationBox}>
          
              <p>You got a friend request from {notification.name}</p>
         
            </div>
          </Link>
        )):
        <p className={styles.notificationText}>There is nothing to see</p>}
        
      </div>
    </>
  )
}

export default Notifications