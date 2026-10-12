require("dotenv").config();
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser");
const authenticateToken = require("./middleware/auth");
const multer = require("multer")
const path = require("path")

const express = require("express")
const cors = require("cors")
const bcrypt = require("bcrypt")
const pool = require("./db");


const app = express()

app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null,"uploads/")
    },

    filename:(req,file,cb)=>{
        cb(null,Date.now()+ path.extname(file.originalname));
    }
});

const upload = multer({storage})

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://union.muratdayioglu67.workers.dev"
  ],
  credentials: true
}));

app.use(cookieParser());


app.use(express.json())

app.get("/", (req,res) => {
    res.send("Backend Working")
})

app.get("/api/users/:username",async(req,res)=>{
    try{
        const {username} = req.params

        const users = await pool.query(
            "select id, name from users where name = ? ",[username]
        );
      
        if (users.length === 0){
            return res.status(404).json({
                message:"User not found"
            });
        }
       
        res.json(users[0]);
    }catch(error){
        console.log(error)
        res.status(500).json({
          message:"server error"  
        })
    }
})

app.post("/register", async(req,res) => {
    
    try{
        const {email ,name, password} = req.body;

        if(!email?.trim()||!name?.trim()||!password?.trim()){
            res.status(400).json({
                message: "Fill all lines"
            })
            return
        }

        const hashed = await bcrypt.hash(password,10);
        const result = await pool.query(
            "INSERT INTO users(email,name,password) values (?, ?, ?)",
            [email,name,hashed]
        )
        
        const token = jwt.sign(
        {
            username: name,
            userId : Number(result.insertId)
        },
        
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: "15m"}
        )
        const id = Number(result.insertId);
        const refreshToken = jwt.sign(
        { userId: id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
        );

        await pool.query(
        `INSERT INTO refresh_tokens (userId, token, expiresAt)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [id, refreshToken]
        );

        res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/"
        });
        

        return res.status(201).json({
            message:"Register Succesful",
            token: token,
            user:{email:email,username:name,id:id}                                  
        })
        

    }catch(error){
        console.log(error)
        
        return res.status(500).json({
            message: "Register Failed"
        })
    }
})

app.post("/logout", async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            await pool.query(
                "DELETE FROM refresh_tokens WHERE token = ?",
                [refreshToken]
            );
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/"
        });

        return res.status(200).json({
            message: "Logged out successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Logout failed"
        });
    }
});

app.post("/signin", async (req,res) => {
    try{
        const{email,password} = req.body;

        if(!email.trim()||!password.trim()){
            res.status(400).json({
            message: "Fill all lines"
            })
            return
        }

        const users = await pool.query(
            "SELECT * FROM users WHERE email = ?",[email]
        );
      

        if(users.length === 0){
            return res.status(401).json({
            message: "Wrong E-mail or Password" 
            });
        }
        const user = users[0]

        const match =await bcrypt.compare(password,user.password)
        console.log(match)
        if(!match){
            return res.status(401).json({
                message:"Wrong E-mail or Password"
            });
        }
        
        const accessToken = jwt.sign(
        {userId: user.id},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: "15m"}
        )

        const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
        );

        await pool.query(
        `INSERT INTO refresh_tokens (userId, token, expiresAt)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [user.id, refreshToken]
        );

        res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/"
        });
    
         
        return res.status(200).json({
        message: "Login Succesfuly",
        user: {
        id: Number(user.id),
        email: user.email,
        username: user.name
        },
        token: accessToken
        });

   
    }catch(error){
        
        console.log(error)
        res.status(500).json({message:"Login Failed"})
    }


    

    

    
});

app.post("/refresh", async (req, res) => {
    try {
        
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token not found"
            });
        }

        
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        
        const tokens = await pool.query(
            `SELECT * FROM refresh_tokens
             WHERE userId = ? AND token = ? AND expiresAt > NOW()`,
            [decoded.userId, refreshToken]
        );

        if (tokens.length === 0) {
            return res.status(401).json({
                message: "Refresh token expired or revoked"
            });
        }

        
        const accessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        
        return res.status(200).json({
            token: accessToken
        });

    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                message: "Invalid or expired refresh token"
            });
        }

        console.log(error);

        return res.status(500).json({
            message: "Refresh failed"
        });
    }
});

app.post("/post",authenticateToken, upload.single("postImage"), async(req,res) => {
    try{
        const {postText,ownId} = req.body;
        console.log(ownId)
        let postImage = null;
        if(req.file){
            postImage = `/uploads/${req.file.filename}`;
        }

        if(!postText.trim()){
            res.status(400).json({
                message:"Please write something"
            })
            return
        }
        
        const result = await pool.query(
            "insert into posts(userId,description,postImage) values (?,?,?)",[ownId,postText,postImage]
        )

        return res.status(201).json({
            message:"Posted Succesfuly"
        })

    }catch(error){
        console.log(error)
        res.status(500).json({
            message: "Post Failed"
        })
    }
})

app.get("/post/:id", async(req,res) =>{
    try{
        const {id} = req.params;

         const posts = await pool.query(
        `SELECT
        posts.*,
        users.name,
        COUNT(DISTINCT likes.id) AS likeNum,
        COUNT(DISTINCT comments.id) AS commentNum,
        COUNT(DISTINCT reposts.id) AS repostNum
        FROM posts
        JOIN users ON posts.userId = users.id
        LEFT JOIN likes ON likes.postId = posts.id
        LEFT JOIN comments ON comments.postId = posts.id
        LEFT JOIN reposts ON reposts.postId = posts.id
        WHERE posts.userId = ?
        GROUP BY posts.id
        ORDER BY posts.postDate DESC`,
        [id]
        );

        const fixedPosts = posts.map(post => ({
        ...post,
        likeNum: Number(post.likeNum),
        commentNum: Number(post.commentNum),
        repostNum: Number(post.repostNum)
        }));

        

        if(posts.length===0){
            return  res.status(404).json({
                message:"Could not find posts"
            })
        }
        console.log(fixedPosts)
        return res.json(fixedPosts)

    }catch(error){
        console.log(error)
        return res.status(500).json({
            message:"Failed to get posts"
        })
    }
})

app.delete("/post/:id",authenticateToken,async(req,res) =>{
    try{
        const {id} = req.params

        const result = await pool.query(
            "delete from posts where id = ?",[id]
        )

        res.status(201).json(
            "Post Deleted"
        )

    }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Failed to delete"
        })
    }
})

app.get("/search/:searchInput",async(req,res)=>{
    try{
        const {searchInput} = req.params
        if(!searchInput.trim()){
            return
        }

        const result =await pool.query(
            "select name,id from users where name like ? order by name asc",
            [`%${searchInput}%`]    
        )

        if(result.length === 0){
            return res.status(404).json({
                message:"Could not find user"
            })
        }

        await console.log(result.length)
        
        res.json(result)


    }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Search error"
        })
    }
})

app.get("/post",async(req,res)=>{
    try{
        const posts =await pool.query(
            `select
            posts.*,
            count(distinct likes.id) as likeNum,
            count(distinct comments.id) as commentNum,
            count(distinct reposts.id) as repostNum,
            users.name from posts 
            join users on posts.userId = users.id
            left join likes on likes.postId = posts.id
            left join comments on comments.postId = posts.id
            left join reposts on reposts.postId = posts.id
            group by posts.id 
            order by postDate desc`
        )

        if(posts.length === 0 || posts[0].id === null){
            res.status(404).json({
                message:"Could not find posts"
            })
            return
        }
        const newPosts = posts.map(post => ({
            ...post,
            likeNum: Number(post.likeNum),
            commentNum: Number(post.commentNum),
            repostNum: Number(post.repostNum)


        }))
        
        return res.status(201).json(newPosts)

    }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Failed to get posts"
        })
    }
})

app.post("/users/request/:userId/:friendId",authenticateToken, async(req,res) => {
    try{    
        const {userId} = req.params
        const {friendId} = req.params
        const result = await pool.query(
            "insert into relationships(userId,friendId) values (?, ?)",[userId,friendId]
        )
        return res.status(201).json("request sended succesfuly")
    }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Failed to send request"
        })
    }
})

app.get("/users/request/:userId/:friendId", async(req,res) => {
    try{
        const {userId} = req.params
        const {friendId} = req.params

        const result = await pool.query(
            "select status from relationships where userId = ? and friendId = ?",[friendId,userId]   
        )

        return res.status(200).json(result[0].status)

    }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Failed to check status"
        })
    }
})

app.get("/users/requests/:userId" , async (req,res) => {
    try{
        const {userId} = req.params

        const result = await pool.query(
            "select users.name, relationships.id,relationships.userId from relationships join users on relationships.userId = users.id where friendId = ? and status = 'pending'" ,[userId]
        )

        res.status(201).json(result)
    }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Failed to get notifications"
        })
    }
})

app.put("/users/requests/:userId/:friendId/",authenticateToken,async(req,res) => {
    try{    
        const {userId} = req.params
        const {friendId} = req.params
        const answer = req.body?.answer
        console.log(answer)
        const result = await pool.query(
            "update relationships set status = ? where userId = ? and friendId = ?",[answer,userId,friendId]
        )
        
        

        return res.status(200).json(result)


    }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Failed to update"
        })
    }
})

app.get("/:userId/friends",async (req,res)=> {
    const {userId} = req.params

    const result = await pool.query(
        `SELECT users.name, users.id AS friendId, relationships.id
   FROM relationships
   JOIN users
     ON users.id = CASE
       WHEN relationships.userId = ? THEN relationships.friendId
       ELSE relationships.userId
     END
   WHERE relationships.status = 'accepted'
     AND (relationships.friendId = ? OR relationships.userId = ?)`,
  [userId, userId, userId]
    )

    res.status(200).json(result)
    
})

app.delete("/request/:userId/:friendId", authenticateToken, async(req,res) => {
    try{
        const {userId} = req.params
        const {friendId} = req.params

        const result = await pool.query(
            "delete from relationships where (userId = ? and friendId = ?) or (userId = ? and friendId = ?)",[userId,friendId,friendId,userId]
        ) 
    }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Failed to delete"
        })
    }
    
   

})

app.post("/posts/:postId/like/:userId",authenticateToken,async(req,res) => {
    try{

        const {postId} = req.params
        const {userId} = req.params
       
        const checkLike = await pool.query(
            "select * from likes where userId = ? and postId = ?",[userId,postId]
        )
        

        if(checkLike.length >= 1){
            await pool.query(
                "delete from likes where userId = ? and postId = ?",[userId,postId]
            )
            return res.status(200).json({
                message:"Setted succesfuly"
            })
        }else if(checkLike.length <= 0){
            await pool.query(
                "insert into likes (userId,postId) values (?, ?)",[userId,postId]
            )
            return res.status(200).json({
                message:"Setted succesfuly"
            })
        }

    }catch(error){
        console.log(error)
        return res.status(500).json({
            message:"Failed to set like"
        })
    }
})

app.post("/posts/:postId/repost/:userId",authenticateToken,async(req,res) => {
    try{

        const {postId} = req.params
        const {userId} = req.params
       
        const checkLike = await pool.query(
            "select * from reposts where userId = ? and postId = ?",[userId,postId]
        )
        

        if(checkLike.length >= 1){
            await pool.query(
                "delete from reposts where userId = ? and postId = ?",[userId,postId]
            )
            return res.status(200).json({
                message:"Setted succesfuly"
            })
        }else if(checkLike.length <= 0){
            await pool.query(
                "insert into reposts (userId,postId) values (?, ?)",[userId,postId]
            )
            return res.status(200).json({
                message:"Setted succesfuly"
            })
        }

    }catch(error){
        console.log(error)
        return res.status(500).json({
            message:"Failed to set like"
        })
    }
})

app.post("/posts/:postId/comment/:userId",authenticateToken, async(req,res) => {
    try{
        const {postId,userId} = req.params
        const {comment} = req.body

        if(!comment ||!comment.trim()){
            return es.status(400).json({
                message: "Comment cannot be empty"
            })
        }

        const result = await pool.query(
            "insert into comments(userId,postId,commentText) values(?, ?, ?)",[userId,postId,comment.trim()]
        )

        return res.status(201).json({
            message:"Posted succesfuly"
        })

    }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Failed to post comment"
        })
    }
})

app.get("/posts/:postId/comment",async (req,res) => {
    try{
        const {postId} = req.params
        
        const rows =await  pool.query(
        `SELECT 
        users.name,
        comments.commentText,
        comments.userId,
        comments.id
        FROM comments
        JOIN users ON comments.userId = users.id
        WHERE comments.postId = ?`,
        [postId]    
        )
        

        if(rows.length <= 0){
            return res.status(404).json({
                message:"Could not find comment",
                        
            })
        }

        return res.json(rows)
        



    }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Faled to get comments"
        })
    }
})

app.delete("/posts/comments/:commentId",authenticateToken, async(req,res) => {
    try{
        const {commentId} = req.params

        const result = await pool.query(
            "delete from comments where id = ? ",[commentId]
        )

        res.status(200).json({
            message:"Deleted succesfuly"
        })


    }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Failed to delete comment"
        })
    }
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Working at port ${PORT}`);
});
