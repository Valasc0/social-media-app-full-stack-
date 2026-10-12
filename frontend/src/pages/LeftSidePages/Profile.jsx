    import React, { useEffect, useRef, useState } from 'react'
    import { apiFetch } from "/././api";
    import API_URL from '../../../api';
    import {Link,useNavigate,useParams} from 'react-router-dom'
    import styles from './Profile.module.css'
    import MainLayout from '../Component/MainLayout'
   import pp from "../../assets/ProfilePic.png";
import bgimg from "../../assets/bgimg.webp";



    const Profile = () => {

      const {username} = useParams()

      const [status,setStatus] = useState("Loading...")
      
      const [user,setUser] = useState(null)

      const [posts,setPosts] = useState([])

      const [addButtonText,setAddButtonText] = useState("Follow")

      const [addButtonClass,setAddButtonClass] = useState(styles.addButton)

      const [answerButtonBoxDisplay,setAnswerButtonBoxDisplay] = useState("none")

      const [friendStatus,setFriendStatus] = useState(null)
      
      const [friendNum , setFriendNum] = useState(0)
      
      const [likeNum,setLikeNum] = useState({})

  const [postComments,setPostComments] = useState([])
  const [commentNum,setCommentNum] = useState({})
  const [openComments,setOpenComments] = useState({})
  const [comment,setComment] = useState(null)

      const getUserFriend = async (id) => {
        const response = await fetch(`${API_URL}/${id}/friends`)
        
        const data = await response.json()

        setFriendNum(data.length)
        
      }     
      
      const getUserPosts = async (userId) => {
        
        const response = await apiFetch(`/post/${userId}`)
        const data = await response.json()
      
        setPosts(data)
      }
      
      const checkFriendStatus = async () => {
        if(!user){
          return
        }
        
        try{
          const response = await fetch(`${API_URL}/users/request/${localStorage.getItem("ownId")}/${user.id}`,{
          method:"GET"
          })

          if(response.ok){
            const data = await response.json()
        
          
          setFriendStatus(data)
          
            switch (data){
              case "pending":
                setAddButtonClass(styles.answerButton)
                setAddButtonText("You have a waiting request")
                setAnswerButtonBoxDisplay("flex")
                break;
            
            case "accepted":
              setAddButtonClass(styles.unfollowButton)
              setAddButtonText("Unfollow")
              break;

            default:
              setAddButtonClass(styles.addButton)
              setAddButtonText("Follow")
              break;
          }
        
        }
      }catch(error){
        console.log(error)
      }
      }

      const checkSendedRequest = async () => {
      if(!user){
        return
      }
      
      const response = await fetch(`${API_URL}/users/request/${user.id}/${localStorage.getItem("ownId")}`,{
      method:"GET"
      })

      if(response.ok){
        const data = await response.json()
        console.log(data)
        setFriendStatus(data)
          
            switch (data){
              case "pending":
                setAddButtonClass(styles.pendingButton)
                setAddButtonText("Your request waiting")
              
                break;
            
              case "accepted":
              setAddButtonClass(styles.unfollowButton)
              setAddButtonText("Unfollow")
              break;

            default:
              setAddButtonClass(styles.addButton)
              setAddButtonText("Follow")
              break;
            }
        } 

      }
      
      useEffect(()=>{
        
        async function getUser() {
          const response = await apiFetch(`/api/users/${username}`)
        
          if(!response.ok){
          setStatus("Can not found the user")
          throw new Error("Can not found user")
          
          }
          
          const data = await response.json()
          setUser(data) 
          
          getUserPosts(data.id)
          getUserFriend(data.id)
        }
        
        getUser()
        
      },[username]);

      useEffect(()=>{
        checkFriendStatus();
        checkSendedRequest();
        
      },[user])
      
      if(!user){
        return <p>{status}</p>
      }

      const deletePost = async (id) =>{
        await apiFetch(`/post/${id}`, {
        method: "DELETE",
        headers:{
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

        getUserPosts(user.id);
      }

      const sendFriendRequest = async()=>{

        
          const response = await fetch(`${API_URL}/users/request/${localStorage.getItem("ownId")}/${user.id}`,{
          method:"POST",
          headers:{
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
          })
          if(response.ok){
          const data = await response.json()
          console.log(data)
          checkSendedRequest()
          }

      }  

      const delRequest = async () => {
        setFriendStatus("")
        setAddButtonClass(styles.addButton)
        setAddButtonText("Follow")
        const response = await apiFetch(`/request/${localStorage.getItem("ownId")}/${user.id}`,{
          method:"DELETE",
          headers:{
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        })

        
      }
      const answerFriendRequest = async(answer)=>{
        if(answer === "accepted"){
          const response = await apiFetch(`/users/requests/${user.id}/${localStorage.getItem("ownId")}`,{
            method:"PUT",
            headers:{
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}` 
            },
            body: JSON.stringify({answer})
          })
          const data = await response.json()
          console.log(data)
          setFriendStatus("accepted")
          setAnswerButtonBoxDisplay("none")
          checkFriendStatus()
          
        }else if(answer === "refused"){
          const response = await apiFetch(`/users/requests/${user.id}/${localStorage.getItem("ownId")}`,{
              method:"PUT",
              headers:{
              "Content-Type": "application/json" ,
              Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({answer})
          })
          const data = await response.json()
          console.log(data)
          setFriendStatus("refused")
          setAnswerButtonBoxDisplay("none")
          checkFriendStatus()
        
        }
      }

      async function Logout() {
    try {
        await fetch(`${API_URL}/logout`, {
            method: "POST",
            credentials: "include"
        });
    } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("ownId");
        window.location.href = "/signin";
    }
}

  const setLike = async(postId) => {
    const response = await apiFetch(`/posts/${postId}/like/${localStorage.getItem("ownId")}`,{
      method:"POST",
      headers:{
        Authorization:`Bearer ${localStorage.getItem("token")}`
      }
    })
    const data = await response.json()
    console.log(data)
    getUserPosts(user.id)
  }

  const setRepost = async(postId) => {
    const response = await apiFetch(`/posts/${postId}/repost/${localStorage.getItem("ownId")}`,{
      method:"POST",
      headers:{
        Authorization:`Bearer ${localStorage.getItem("token")}`
      }
    })
    const data = await response.json()
    console.log(data)
    getUserPosts(user.id);
  }

  const sendComment = async (postId) => {
    const response = await apiFetch(`/posts/${postId}/comment/${localStorage.getItem("ownId")}`,{
       method:"POST",
      headers:{
        "Content-Type": "application/json",
        Authorization:`Bearer ${localStorage.getItem("token")}`
      },
      body:JSON.stringify({comment:comment})
    })
    const data = await response.json()
    setComment("")
    console.log(data)
    await getUserPosts(user.id)
    await getComments(postId);
  }

  const getComments = async (postId) => {
    const response = await fetch(`${API_URL}/posts/${postId}/comment`)
    if(response.ok){
      const data = await response.json()
      console.log(data)
      setPostComments(prev => ({  
        ...prev,
        [postId]: data
      }))
    }
  }

  const deleteComment = async (commentId,postId) => {
    const response = await apiFetch(`/posts/comments/${commentId}`,{
       method:"DELETE",
      headers:{
        "Content-Type": "application/json",
        Authorization:`Bearer ${localStorage.getItem("token")}`
      },
      
      })

      if (response.ok) {
      setPostComments(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter(
      comment => Number(comment.id) !== Number(commentId)
      )
      }));
    }
  await getUserPosts(user.id);
  }
      
      
      return (
        <>
          
          <MainLayout/>
            
          <div className={styles.userInfos}>
            <img src={bgimg} className={styles.headerImg}/>
            <img src={pp}  />
            
              
            <div className={styles.infoDetails}>
              
              <h1>{username}</h1>
              {user.id == localStorage.getItem("ownId") ? <button onClick={Logout} className={styles.logoutButton}>logout</button>: null}
              {localStorage.getItem("ownId") != user.id && (
                <button onClick={friendStatus === "accepted" || friendStatus ==="pending" ? delRequest: sendFriendRequest} className={addButtonClass}>{addButtonText}</button>
              )|| <label>Own Page</label>}
            
            <div className={styles.answerButtonBox} style={{display:answerButtonBoxDisplay}}>
              <span className={styles.answerText}>Answer Friend Request</span>
              <button onClick={()=>answerFriendRequest("accepted")} className={styles.acceptButton}>✓</button>
              <button  onClick={()=>answerFriendRequest("refused")} className={styles.declineButton}>✕</button>
            </div>


              <p><label>{posts.length ? posts.length : 0}</label> Posts</p>
              <p><label>{friendNum}</label> Followers</p>
            </div>
          </div>
          
          <div className={styles.posts}>
          {posts && posts.length > 0 ? (
            posts.map((post)=>(
            <div key={post.id} className={styles.postContainer}>
          
              
               <Link to={`/profiles/${post.name}`}>
                <img src={pp} alt="user1pic" />  
              
                <label>{post.name}</label>        
              </Link>
              
            
              <p>{post.description}</p>
            
            
            
              {Number(post.userId) === Number(localStorage.getItem("ownId")) && (
              <button className={styles.delButton} onClick={() => deletePost(post.id)}>
              Delete
              </button>
              )}
              
              
              
              
              
              
             {post.postImage && (
              <img src={`${API_URL}${post.postImage}`} alt="Post"></img>
              )}
              
              <div className={styles.postButtons}>
                <button onClick={()=>setLike(post.id)}>Like {post.likeNum}</button>
                    
                <button onClick={()=>{const isOpen  = !openComments[post.id]; if(isOpen){getComments(post.id)}; setOpenComments(prev=> ({...prev,[post.id]: isOpen}));}}>Comment {post.commentNum}</button>
                    
                <button style={{display:"none"}} onClick={()=>setRepost(post.id)}>Share {post.repostNum}</button>
             </div>

             <div className={`${styles.commentsBox} ${openComments[post.id] ? styles.open : ""}`}>
                <div className={styles.commentContent}>
                {(postComments[post.id] || []).map((postComment)=> (
                  <div key={postComment.id} className={styles.commentItem}>
                    <Link to={`/profiles/${post.name}`}> <span>{postComment.name}</span></Link>
                    
                    <p>{postComment.commentText}</p>

                    {localStorage.getItem("ownId") == postComment.userId ?  
                    <button onClick={()=>deleteComment(postComment.id,post.id)} className={styles.commentDeleteButton}>Delete</button>
                    : null}
                    </div>
                ))}
                <div className={styles.inputBox}>
                 <textarea onChange={(e)=> setComment(e.target.value)} value={comment}></textarea>
                 <button onClick={()=>sendComment(post.id)}>send</button>
                </div>
                </div>
             </div>
                  
            
            </div>
          ))
        ) : (
          <p className={styles.postStatus}>There is no posts</p>
        )}
          
          </div>
        </>
      )
    }

    export default Profile