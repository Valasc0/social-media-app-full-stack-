import {Link, useNavigate} from "react-router-dom"
import API_URL from "../../api";

import styles from "./SıgnIn.module.css"
import { use, useState } from "react";

const SignIn = () => {
 
  const navigate = useNavigate();
  
  const [user,setUser] = useState({email:"" ,password:""})

  async function Login(){
    
    if(!user.email.trim() || !user.password.trim()){
      return
    }
   
    const response = await fetch(`${API_URL}/signin`,{ 
      method: "POST",
      headers:{
        "Content-Type": "application/json"
      },
      credentials:"include",
      body: JSON.stringify(user)
    });

    const data = await response.json();
    if(!response.ok){
      alert(data.message)
      return
    }
    localStorage.setItem("username",data.user.username)
    localStorage.setItem("token",data.token);
    localStorage.setItem("ownId",data.user.id);
    
    console.log(data)
    console.log(response.status)
    

    if(response.ok){
      navigate("/")
    }else{
      alert(data.message)
    }
  };
 
  

  return (
    <div className={styles.container}> 
        <input onChange={(e)=>setUser({...user,email:e.target.value})} value={user.email} className={styles.textInput} type="email" placeholder="Enter E-mail" />
        <input onChange={(e)=>setUser({...user,password:e.target.value})} value={user.password} className ={styles.textInput} type="password" placeholder="Enter Password" />
        <button onClick={Login} className={styles.submitButton}>Sign In</button>
        <p className={styles.text}>Don't have an account, <Link to="/register">Create account</Link> </p>
    </div>
  )
}

export default SignIn