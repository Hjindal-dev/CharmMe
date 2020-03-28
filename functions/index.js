const functions = require('firebase-functions');
const admin = require('firebase-admin');

// const serviceAccount = require('../functions/key.json');

admin.initializeApp({
    // credential: admin.credential.cert(serviceAccount),
    // databaseURL: "https://charm-me.firebaseio.com"
  });

const express = require('express');
const app = express();

app.get('/posts', (req, res) => {
    admin.firestore().collection('posts').get()
    .then((data) => {
        let posts = [];
        data.forEach((doc) => {
            posts.push(doc.data());
    });
    return res.json(posts);
})
.catch((err) => console.error(err));
})

app.post('/post', (request, response) => {
    const post = {
        //body of request. body is property
        body: request.body.body,
        userName: request.body.userName,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
    };
 
    admin.firestore()
     .collection('posts')
     .add(post)
     .then(doc =>{
         response.json({message: `document ${doc.id} created successfully`});
     })
     .catch(err =>{
         response.status(500).json({ error: "Something went wrong"});
         console.error(err);
         });
});

//https://baseurl.com/api/

exports.api = functions.https.onRequest(app);