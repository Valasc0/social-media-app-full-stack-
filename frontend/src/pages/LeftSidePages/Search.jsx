import React from 'react'
import {Link,useNavigate} from 'react-router-dom'
import styles from './Search.module.css'
import MainLayout from '../Component/MainLayout'
import { useState } from 'react'
import { useEffect } from 'react'
import API_URL from '../../../api'


const Search = () => {

  const [searchInput,setSearchInput] = useState("")

  const [searchResult,setSearchResult] = useState([])

  const searchProfile= async()=>{
    
    const res = await fetch(`http://${API_URL}/search/${searchInput}`)
    const data = await res.json()
    setSearchResult(data)
    console.log(searchResult)
  }
  useEffect(()=>{
    searchProfile()
  },[searchInput])


  return (
    <>
      <MainLayout/>
      <div className={styles.inputBox}>
        <input value={searchInput} onChange={(e)=> setSearchInput(e.target.value)} placeholder='Search' className={styles.input} type="text"/>
        
      </div>
     
      <div className={styles.results}>
       {searchResult.length > 0 ? (
          searchResult.map((result) => (
          <Link to={`/profiles/${result.name}`}> 
          
          <div className={styles.resultBox}  key={result.id}>
            <img className={styles.resultPP} src="" alt="pp" />
            <p className={styles.resultName}>
              {result.name}
            </p>
          </div>
          
          </Link> 
        ))
        ) : (
         <p>Could not find user</p>
       )}
      </div>
    </>
  )
}

export default Search