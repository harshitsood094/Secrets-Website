require('dotenv').config()                       // Acquiring dotenv
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");              //hashing func
const bcrypt = require('bcryptjs');
const session = require('express-session');        //Requiring packages or cookies and sessions
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const saltRounds = 10;                      // Number of times salting to be done

const app =express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({                                           //Use session
  secret: 'Random Secret String',                          // random string
  resave: false,                                           // Forces the session to be saved back to the session store
  saveUninitialized: false,
  cookie: {}                              // Forces a session that is "uninitialized" to be saved to the store
}));

app.use(passport.initialize());                           //Initializing passport
app.use(passport.session());                              // Use passport to manage sessions

mongoose.connect("mongodb+srv://admin-harshit:Test123@cluster0.0ursx.mongodb.net/userDB",{useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex: true });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  secret: String
});
                                                 // Random Secret string for encryption
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["Password"]});                // encrypting the password fields of our entries

userSchema.plugin(passportLocalMongoose);                     //To use hash and salt fpr our passwords
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());                      // passport  mongoose configuration
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({                             ////Using google login startegy from passport
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://pure-harbor-28541.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {                      //get access token in case of callback
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home");
});

// Authenticate using google at google route
app.get("/auth/google",passport.authenticate("google", { scope: ['profile','email'] }));                //Since we need user profile

// Redirecting after login with google
app.get('/auth/google/secrets',passport.authenticate('google', { failureRedirect: '/login' }),function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

// Render register page
app.get("/register",function(req,res){
  res.render("register");
});

// render login page
app.get("/login",function(req,res){
  res.render("login");
});

// If user is authenticated (already logged in session) he can directly go to secrets page
app.get("/secrets",function(req,res){
  User.find({"secret": {$ne: null}},function(err,result){
    if(err)
    console.log(err);
    else{
      if(result){
      res.render("secrets", {usersWithSecrets: result});
    }
  }
});
});

// Logout route: Deauthenticate user and end user session
app.get("/logout",function(req,res){
req.logout();
res.redirect("/");
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }
  else{
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const secret = req.body.secret;
  User.findById(req.user.id,function(err,result){                    //Passport saves the user info (id email etc) in req
if(err)
console.log(err);
else{
  if(result){
  result.secret = secret;
  result.save(function(){
    res.redirect("/secrets");
  });
}
}
  });

});

//post request to register route
app.post("/register",function(req,res){

  User.register({username: req.body.username}, req.body.password, function(err,user){      //.register method comes from passpoort local mongoose and is used to store data in DB.this method itself does salting and hashig
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res,function(){     //Callback function is triggered only when authenticaton is successfull or we manage to create a cookie and save current loged in session
         res.redirect("/secrets");                           // redirect to secrets when session is created
      });
    }
  });
});

//post request to login route
app.post("/login",function(req,res){
const newUser = new User({
  username: req.body.username,
  password: req.body.password
});
req.login(newUser, function(err){                          //Function provided by passport to check passwor and login user
  if(err){
  console.log(err);
}
  else{
    passport.authenticate("local")(req,res,function(){     //Callback function is triggered only when authenticaton is successfull or we manage to create a cookie and save current loged in session
       res.redirect("/secrets");                           // redirect to secrets when session is created
    });
  }
})            ;
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,function(){
  console.log("Server started on port 3000");
})
