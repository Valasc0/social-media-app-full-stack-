import { Link,useNavigate } from "react-router-dom"



import styles from "./Register.module.css"
import { useState } from "react"

const Register = () => {
  const navigate = useNavigate()
  const [user,setUser] = useState({email:"",name:"",password:""})
  
  async function register() {
   
    if(!user.email.trim() || !user.name.trim() || !user.password.trim()){
      return
    }
   
    const response = await fetch("http://localhost:5000/register",{ 
      method: "POST",
      headers:{
        "Content-Type": "application/json"
      },
      credentials:"include",
      body: JSON.stringify(user)
    });

    const data = await response.json();
    localStorage.setItem("username",data.user.username)
    localStorage.setItem("token",data.token);
    localStorage.setItem("ownId",data.user.id);
    
    


    
    console.log("status:",response.status)
    console.log(data)
    
    if(response.ok){
      navigate("/")
    }
  }
  
  
  
  
  return (
    <div className={styles.container}> 
        <input value={user.email} onChange={(e)=>setUser({...user,email:e.target.value})}
               className={styles.textInput} type="email" placeholder="Enter E-mail" />
        
        <input value={user.name} onChange={(e)=>setUser({...user,name:e.target.value})}
               className ={styles.textInput} type="text" placeholder="Enter Username" />
        
        <input value={user.password} onChange={(e)=>setUser({...user,password:e.target.value})}
               className ={styles.textInput} type="password" placeholder="Enter Password" />
        
        <button onClick={register} className={styles.submitButton}>Create</button>
        <p className={styles.text}>Are you have an account already, <Link to="/signin">Sign in</Link></p>
    </div>
  )
}

export default Register