import { useEffect } from 'react'
import { apiFetch } from '../../api'
import API_URL from '../../api'
import { useState } from 'react'
import {Link,useNavigate} from 'react-router-dom'
import styles from './MainPage.module.css'
import MainLayout from './Component/MainLayout'
import pp from "../assets/ProfilePic.png";


const MainPage = () => {
  const navigate = useNavigate()
  
  const[postText,setPostText] = useState("")
  
  const[postImage,setPostImage] = useState(null)

  const [posts,setPosts] = useState([])

  const [likeNum,setLikeNum] = useState({})

  const [postComments,setPostComments] = useState([])
  const [commentNum,setCommentNum] = useState({})
  const [openComments,setOpenComments] = useState({})
  const [comment,setComment] = useState(null)

  const [shareNum,setShareNum] = useState({})


  const  sharePost= async()=>{
    const formData = new FormData()

    formData.append("postText",postText)
    formData.append("ownId", localStorage.getItem("ownId"));

    if(postImage){
      formData.append("postImage",postImage)
    }
    const response = await apiFetch("/post",{
      method:"POST",
      headers:{
         Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: formData
    }); 
    if(!response.ok){
      return
    }
    const data = await response.json()
    setPostText("")
    setPostImage(null)
    
    getPosts()
  }

  const getPosts = async()=>{
    try{
      const res = await apiFetch("/post")
      const data = await res.json();
    console.log(localStorage.getItem("ownId"))      
      setPosts(data)
      
    }catch(error){
      console.log(error)
    }
  }
  useEffect(()=>{
    getPosts()
    console.log(posts)
    
  },[])

   const deletePost = async (id) =>{
    const response = await apiFetch(`/post/${id}`, {
    method: "DELETE",
    headers:{
       Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });
  if(!response.ok){
    return;
  }
  

    getPosts();
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
    getPosts();
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
    getPosts();
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
    await getPosts()
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
    }
  
  return (
    <>
     
      
      <MainLayout/>
      
      

      <div className={styles.MainContent}>
          <div className={styles.shareBox}>
              <textarea onChange={(e)=>setPostText(e.target.value)} 
              value={postText} 
              placeholder='Share a new post' 
              className={styles.textArea} 
              name="">
              </textarea>
              <input className={styles.fileInputButton} type="file" accept='image/*' onChange={(e)=>setPostImage(e.target.files[0])} />  
              <button onClick={sharePost} className={styles.shareButton}>share</button>
          </div>
          
          
          
          
          <div className={styles.posts}>
            {posts && posts.length > 0 ? (
            posts.map((post)=>(
            <div key={post.id} className={styles.postContainer}>
              <Link to={`/profiles/${post.name}`}>
              <img src={post.profileImage ? `${API_URL}${post.profileImage}`: pp}  alt="user1pic" />  
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
        </div>
  </>
    
  )
}

export default MainPage