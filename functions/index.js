const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

// const serviceAccount = require('../functions/key.json');

admin.initializeApp(
    // credential: admin.credential.cert(serviceAccount),
    // databaseURL: "https://charm-me.firebaseio.com"
);

  const config = {
    apiKey: "AIzaSyBUC-wT8D_XvXLhypAXCy4o-Yi14_b9d14",
    authDomain: "charm-me.firebaseapp.com",
    databaseURL: "https://charm-me.firebaseio.com",
    projectId: "charm-me",
    storageBucket: "charm-me.appspot.com",
    messagingSenderId: "808694461908",
    appId: "1:808694461908:web:b94e017eafd83f45fc5241",
    measurementId: "G-T8RG92QX9F"
  };


const firebase = require('firebase');
firebase.initializeApp(config);

const db = admin.firestore();

app.get('/posts', (req, res) => {
    db.collection('posts')
    .orderBy('createdAt','desc')
    .get()
    .then((data) => {
        let posts = [];
        data.forEach((doc) => {
            posts.push({
                postId: doc.id,
                body: doc.data().body,
                userName :doc.data().userName,
                createdAt: doc.data().createdAt
            });
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
        createdAt: new Date().toISOString()
    };
 
    db
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

const isEmail = (email) =>{
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true;
    else return false;
}

const isEmpty = (string) =>{
    if(string.trim() === '') return true;
    else return false;
}

app.post('/signup', (req, res) =>{
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

let errors = {};

if(isEmpty(newUser.email)){
    errors.email ='Must not be empty'
} else if (!isEmail(newUser.email)){
    errors.email = 'Must be a valid email address'
}

if(isEmpty(newUser.password)) errors.password = 'Must not be empty'
if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Paswords must match';
if(isEmpty(newUser.handle)) errors.handle = "Must not be empty"

if(Object.keys(errors).length > 0) return res.status(400).json(errors);

// validate data
let token, userId;
db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
        if(doc.exists){
            return res.status(400).json({ handle: 'this handle is already taken'});
        } else{
            return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password);
        }
    })
    .then(data => {
        userId = data.user.uid;
        return data.user.getIdToken();
    })
    .then((idToken) => {
        token = idToken;
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            userId
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
        return res.status(201).json({ token });
    })
    .catch(err => {
        console.error(err);
        if(err.code === 'auth/email-already-in-use'){
            return res.status(400).json({ email : 'Email is already in use'})
    } else {
        return res.status(500).json({ error: err.code });
    } 
    });
});

exports.api = functions.region('us-central1').https.onRequest(app);
