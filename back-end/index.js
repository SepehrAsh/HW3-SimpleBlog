require('dotenv').config()
var express = require('express')
var cors = require('cors')
var app = express()
const jwt = require("jsonwebtoken");

app.use(express.json())
app.use(cors())
app.use(express.urlencoded())


// parse server and dashboard
var ParseServer = require('parse-server').ParseServer;
var api = new ParseServer({
    databaseURI: 'mongodb://localhost:27017/devv', // Connection string for your MongoDB database
    cloud: './cloud/main.js', // Path to your Cloud Code
    appId: 'myAppId',
    masterKey: 'myMasterKey', // Keep this key secret!
    fileKey: 'optionalFileKey',
    serverURL: 'http://localhost:1337/parse' // Don't forget to change to https if needed
});

// Serve the Parse API on the /parse URL prefix
app.use('/parse', api);

app.listen(1337, function() {
  console.log('parse-server-example running on port 1337.');
});

var ParseDashboard = require('parse-dashboard');
var dashboard = new ParseDashboard({
    "apps": [
      {
        "serverURL": "http://localhost:1337/parse",
        "appId": "myAppId",
        "masterKey": "myMasterKey",
        "appName": "MyApp"
      }
    ]
});
app.use('/dashboard', dashboard);
//-------------------------------------------------------------------------


 
// --------- SignUp ------------ 

app.post('/api/signup', (req, res) => {
    var p1 = signUp(req.body.email, req.body.password);
    p1.then(value => {
        res.status(201).send({"message": "user has been created."}); // Success!
      }, reason => {
        let header_status = 400;
        if (reason.code==202) {
            header_status = 409;
        } else if (reason.code == 125) {
            header_status == 400;
        }
        res.status(header_status).send(reason); // Error!
    });
})


async function signUp(mail, userpass) {
    if(userpass.length < 5) {
        let messageErr = {code:125 ,message:"filed `password`.length should be > 5"};
        return Promise.reject(messageErr);
    }
    Parse.User.enableUnsafeCurrentUser()
    const user = new Parse.User();
    user.set("username", mail);
    user.set("email", mail);
    user.set("password", userpass); 
    try {
        await user.signUp();
        return "Hooray! Let them use the app now.";

    } catch (error) {
        let messageErr = {code:error.code ,message:error.message};
        return Promise.reject(messageErr);
    }

}


// ----------- SignIn -------------

app.post('/api/signin', (req,res) =>{
    var p1 = signIn(req.body.email, req.body.password);
    p1.then(value => {
        const username = req.body.email;
        const user = { name : username };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
        console.log(accessToken);
        res.json({ accessToken : accessToken });
      }, reason => {
          console.log(reason);
        let header_status = 400;
        if (reason.code==201) {
            header_status = 400;
        } else if (reason.code == 101) {
            header_status == 401;
        }
        res.status(header_status).send(reason); 
    });

})

async function signIn(username, userpass) {
    if(false) { // todo username is not email
        let messageErr = {code:201 ,message:"filed `email` is not valid"};
        return Promise.reject(messageErr);
    } else if (username === undefined || userpass === undefined) { //todo request length
        let messageErr = {code:201 ,message:"Request Length should be 2"};
        return Promise.reject(messageErr);
    }
    Parse.User.enableUnsafeCurrentUser()
    try {
        const user = await Parse.User.logIn(username, userpass);
        return user.getEmail();
    } catch (error) {
        let messageErr = {code:error.code ,message:error.message};
        return Promise.reject(messageErr);
    }
    
}

// --------- Getting All Posts (just a random observer) -----------

app.get('/api/post/', function(req, res){
    let posts = getAllPosts();
    posts.then(value => {
        res.json({
            "post" : value
        });
    }, reason => {res.send("something went wrong")});
})

async function getAllPosts() {
    const PostObjects = Parse.Object.extend("Post");
    const query = new Parse.Query(PostObjects);
    const results = await query.find();
    //console.log("Successfully retrieved " + results.length + " scores.");
    let posts = [];
    for (let i = 0; i < results.length; i++) {
        const object = results[i];
        //const creator =await (new Parse.Query(Parse.Object.extend("User"))).get(object.get('created_by').id);
        this_post = {
            id: object.get('title_id'),
            title: object.get('title'),
            content: object.get('content'),
            created_by: object.get('created_by'),
            created_at: object.get('createdAt'),
        }
        posts.push(this_post);
    }
    return posts;
}


// -------------------------- ADMIN ZONE -------------------------------

// --- USER ---

// ---------- Get Current User (using id) ----------


app.get('/api/admin/user/crud/:userId', (req, res)=>{
    userId = parseInt(req.params.userId);
    if (isNaN(userId)){
        res.status(400).send({"message": "url id is not valid"})
    } else{
        res.status(200).send({}); //TODO: users should have IDs
    }
});



// --- POSTS ---

// ---------- Making a new Post ---------------

app.post('/api/admin/post/crud', authenticateToken, (req, res)=>{
    //req.user
    let title = req.body.title;
    let content = req.body.content;
    if(title === undefined || content == undefined) {
        res.status(400).send({"message": "Request Length should be 2"});
        return;
    }
    if (title == ''){
        res.status(400).send({"message": "filed `title` is not valid"});
        return;
    }
    createPost(title, content).then(value => {res.status(201).send({'id':value});}, reason => {
        res.status(400).send({"message": reason.message});
    })
})


async function createPost(title, content) {
    const Post = Parse.Object.extend("Post");
    const post = new Post();
    const query = new Parse.Query(Post);
    console.log(title);
    console.log(content)
    let postId = 1 + await query.count();
    console.log("Post ID is: " + postId);
    post.set('title_id',postId);
    post.set('title',title);
    post.set('content',content);
    post.set('created_by', Parse.User.current());
    await post.save()
    return postId;
}


// ------------ Updating a Post ---------------

app.put('/api/admin/post/crud/:titleId', authenticateToken, (req, res)=>{
    titleId = parseInt(req.params.titleId);
    let title = req.body.title;
    let content = req.body.content;
    if(title === undefined || content == undefined) {
        res.status(400).send({"message": "Request Length should be 2"});
        return;
    }
    if (title == ''){
        res.status(400).send({"message": "filed `title` is not valid"});
        return;
    }
    if(title == '') {
        res.status(400).send({"message": "filed `title` is not valid"});
        return;
    }
    updatePost(title, content, titleId).then(value => {res.send({'id':value});}, reason => {
        res.status(400).send({"message": reason.message});
        // TODO: Handling different types of error codes
    })
})


async function updatePost(title, content ,titleId) {
    const Post = Parse.Object.extend("Post");
    const query = new Parse.Query(Post);
    query.equalTo("title_id", titleId);
    const results = await query.find();
    const result = results[0];

    if (result.get('created_by').id !=  Parse.User.current().id) {
        throw new Error("premission denied");
    }
    result.set('title',title);
    result.set('content',content);
    await result.save();
    return "done";
}


// ------------- Deleting a Post -------------

// todo there is a bug : when we create post post.title_id = len post + 1, when we delete post and then create there may be duplicate
app.delete('/api/admin/post/crud/:titleId', authenticateToken, (req, res)=>{
    titleId = parseInt(req.params.titleId);
    deletePost(titleId).then(value => {res.status(204).send({'id':value});}, reason => {
        res.status(400).send({"message": reason.message});
    })
})

async function deletePost(titleId) {
    const Post = Parse.Object.extend("Post");
    const query = new Parse.Query(Post);
    query.equalTo("title_id", titleId);
    const results = await query.find();
    const result = results[0];

    if (result.get('created_by').id !=  Parse.User.current().id) {
        throw new Error("premission denied");
    }

    await result.destroy();
    return "done";
}

// ---------- Getting your Posts (by id) -----------

app.get('/api/admin/post/crud/:titleId', authenticateToken, (req, res)=>{
    titleId = parseInt(req.params.titleId);
    let posts = getAllPosts();
    posts.then(value => {
        for(post of value) {
            console.log(post);
            if(post.id == titleId){
                console.log("here")
                res.json({
                    "post" : post
                });
                return
            }
            
        }
        res.json({
            "post" : value
        });
    }, reason => {res.send("something went wrong")});
})

// ----------- No ID ---------------

app.get('/api/admin/post/crud/', authenticateToken,  (req, res)=>{
    let posts = getAllPosts();
        posts.then(value => {
            res.json({
                "post" : value
            });
        }, reason => {res.send("something went wrong")});
})



// ---------- AUTHENTICATION --------------

function authenticateToken(req, res, next){
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)
        return res.sendStatus(401);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) =>{
        if (err)
            return res.sendStatus(403);
        req.user = user;
        console.log("authenticated successfuly")
        next(); 
    })

}


