var express = require('express')
var cors = require('cors')
var app = express()

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
        let messageErr = {code:125 ,message:"filed `password`.length should be gt 5"};
        return Promise.reject(messageErr);
    }

    Parse.User.enableUnsafeCurrentUser()
    const user = new Parse.User();
    user.set("username", mail);
    user.set("email", mail);
    user.set("password", userpass); //"my pass" thisispass

    // other fields can be set just like with Parse.Object
    //user.set("phone", "415-392-0202");
    try {
        await user.signUp();
        console.log("anjam shod");
        return "Hooray! Let them use the app now.";

    } catch (error) {
        // Show the error message somewhere and let the user try again.
        let messageErr = {code:error.code ,message:error.message};
        return Promise.reject(messageErr);
    }

}


// ----------- SignIn -------------

app.post('/api/signin', (req,res) =>{
    var p1 = signIn(req.body.email, req.body.password);
    p1.then(value => {
        // todo token
        res.send(value); // Success!
      }, reason => {
          console.log(reason);
        let header_status = 400;
        if (reason.code==201) {
            header_status = 400;
        } else if (reason.code == 101) {
            header_status == 401;
        }
        res.status(header_status).send(reason); // Error!
    });

})

async function signIn(username, userpass) {
    if(false) { // todo username is not email
        let messageErr = {code:201 ,message:"filed `email` is not valid"};
        return Promise.reject(messageErr);
    } else if (false) { //todo request length
        let messageErr = {code:201 ,message:"Request Length should be 2"};
        return Promise.reject(messageErr);
    }
    Parse.User.enableUnsafeCurrentUser()
    try {
        const user = await Parse.User.logIn(username, userpass);
        return user.getEmail();
    } catch (error) {
        // Show the error message somewhere and let the user try again.
        let messageErr = {code:error.code ,message:error.message};
        return Promise.reject(messageErr);
    }
    
}

// --------- Getting All Posts (just a random observer) -----------

app.get('/api/post/', function(req, res){
    let posts = getAllPosts();
    //posts.then(value => {res.send(value);}, reason => {res.send("something went wrong")});
    posts.then(value => {
        res.json({
            "post" : value
        });
    }, reason => {res.send("something went wrong")});
})


async function getAllPosts() {
    const PostObjects = Parse.Object.extend("Post");
    const query = new Parse.Query(PostObjects);
    //query.equalTo("playerName", "Dan Stemkoski");
    const results = await query.find();
    console.log("Successfully retrieved " + results.length + " scores.");
    let posts = [];
    for (let i = 0; i < results.length; i++) {
        const object = results[i];
        //const creator =await (new Parse.Query(Parse.Object.extend("User"))).get(object.get('created_by').id);
        //TODO: check wether post belongs to admin or not
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
    titleId = req.params.userId;
    //TODO: handling this api!
    isAdmin().then(value => {
        
    }, reason => {res.send("something went wrong")});
});


// app.post('/api/getuser', (req,res) =>{
//     const currentUser = Parse.User.current();
//     // TODO: other respnse codes
//     if (currentUser) {
//         res.send(currentUser);
//     } else {
//         res.send('no user');
//     }

// })



// --- POSTS ---

// ---------- Making a new Post ---------------

app.post('/api/admin/post/crud', (req, res)=>{
    console.log("hereeee");
    isAdmin().then(value => {
        
        if (value==false){
            res.status(404).send('you are not admin');
            console.log("hereeee2");
            return;
        }
        
        let title = req.body.title;
        let content = req.body.content;
        console.log("hereeee3");
        if(title == '') {
            res.status(400).send({"message": "filed `title` is not valid"});
            return;
        }

        createPost(title, content).then(value => {res.send({'id':value});}, reason => {
            res.status(400).send({"message": reason.message});
        })        
    });
})


async function isAdmin(){
    const currentUser = Parse.User.current();
    console.log(currentUser);
    if (currentUser) {
        // //const query = await new Parse.Query(Parse.Role).equalTo('users', currentUser).find()
        // //console.log(query);
        
        // var queries = [
        //     new Parse.Query('_Role').equalTo('users', currentUser)
        // ];
        // for (var i = 0; i < 2; i++) {
        //     queries.push(new Parse.Query('_Role').matchesQuery('roles', queries[i]));
        // }
        
        // return currentUser.rolesPromise = Parse.Query.or.apply(Parse.Query, queries).find().then(
        //     function(roles) {
        //       return roles.map(function(role) {
        //           if (role.get('name') == 'admin'){ return true;}
        //           else { return false;}
                  
        //         //return role.get('name');
        //       });
        //     }
        //   );
        
        return true;
    } else {
        return false;
    }
}


async function createPost(title, content) {
    const Post = Parse.Object.extend("Post");
    const post = new Post();
    const query = new Parse.Query(Post);
    console.log(title);
    console.log(content)
    //let postId = 1 + await query.count();
    // find id
    // const pipeline = [
    //     { group: { objectId: null, total: { $max: '$title_id' } } }
    // ];

    // let postId = 1 + (await query.aggregate(pipeline))[0].total;

    let postId = 2;
    // TODO: counting the postid
    console.log(postId);

    post.set('title_id',postId);
    post.set('title',title);
    post.set('content',content);
    post.set('created_by', Parse.User.current());
    await post.save()
    return postId;
}


// ------------ Updating a Post ---------------

app.put('/api/admin/post/crud/:titleId', (req, res)=>{
    titleId = parseInt(req.params.titleId);
    isAdmin().then(value => {
        
        if (value==false){
            res.status(404).send('you are not admin');
            return;
        }
        
        let title = req.body.title;
        let content = req.body.content;
        if(title == '') {
            res.status(400).send({"message": "filed `title` is not valid"});
            return;
        }

        updatePost(title, content, titleId).then(value => {res.send({'id':value});}, reason => {
            res.status(400).send({"message": reason.message});
        })        
    });
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
app.delete('/api/admin/post/crud/:titleId', (req, res)=>{
    titleId = parseInt(req.params.titleId);
    isAdmin().then(value => {
        if (value==false){
            res.status(404).send('you are not admin');
            return;
        }
        deletePost(titleId).then(value => {res.status(204).send({'id':value});}, reason => {
            res.status(400).send({"message": reason.message});
        })        
    });
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

app.get('/api/admin/post/crud/:titleId', (req, res)=>{
    titleId = parseInt(req.params.titleId);
    isAdmin().then(value => {
        if (value==false){
            res.status(404).send('you are not admin');
            return;
        }
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
    });
})

// ----------- No ID ----------------

app.get('/api/admin/post/crud/', (req, res)=>{
    isAdmin().then(value => {
        if (value==false){
            res.status(404).send('you are not admin');
            return;
        }
        let posts = getAllPosts();
        posts.then(value => {
            res.json({
                "post" : value
            });
        }, reason => {res.send("something went wrong")});
    });
})



app.listen(3000)