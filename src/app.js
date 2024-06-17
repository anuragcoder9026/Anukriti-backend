import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import userRouter from './routes/userRouter.js';
import postRouter from './routes/postRouter.js';
import passport from 'passport';
import { Strategy as OAuth2Strategy } from "passport-google-oauth20";
import cookieSession from 'cookie-session';
import { User } from './models/userModel.js';
import session from 'express-session';
const app = express();


app.use(cors({
  origin: 'https://anuragcoder9026.github.io', // Update with your React app's URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true // Allow cookies to be sent with requests
}));
app.use(session({
  secret: "1256256sertdyfugihouty09876Y5",
  resave: false,
  saveUninitialized: true
}));

const oauth2StrategyLogIn = new OAuth2Strategy({
  clientID: process.env.CLIENT_ID_LOGIN,
  clientSecret: process.env.CLIENT_SECRET_LOGIN,
  callbackURL: "https://anukriti.onrender.com/auth/google/login/callback", // Corrected URL
  scope: ["profile", "email"]
}, async (accessToken, refreshToken, profile, done) => {
  try {
    return done(null, profile);
  } catch (error) {
    return done(error, null);
  }
});


passport.use("google-login",oauth2StrategyLogIn);

app.get("/auth/google/login", passport.authenticate("google-login", { scope: ["profile", "email"] }));

app.get("/auth/google/login/callback", passport.authenticate("google-login", {session:false}),
async(req,res)=>{   
  const email=req.user.emails[0].value;
  const user=await User.findOne({email});
  if(!user){
    return res.redirect('https://anuragcoder9026.github.io/Anukriti/sign?error=email_not_exists');
  }
  const accessToken=user.generateAccessToken();
  const options = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: 'None'
  }; 
  res.cookie("accessToken",accessToken,options)  ;
  res.redirect(`https://anuragcoder9026.github.io/Anukriti/profile/${user.username}`)  
});




const oauth2StrategySignUp = new OAuth2Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "https://anukriti.onrender.com/auth/google/sign/callback", // Corrected URL
  scope: ["profile", "email"]
}, async (accessToken, refreshToken, profile, done) => {
  try {
    return done(null, profile);
  } catch (error) {
    return done(error, null);
  }
});

passport.use("google-sign",oauth2StrategySignUp);

app.get("/auth/google/sign", passport.authenticate("google-sign", { scope: ["profile", "email"] }));

app.get("/auth/google/sign/callback", passport.authenticate("google-sign", {session:false}),
async(req,res)=>{   
  const email=req.user.emails[0].value;
  const user=await User.findOne({email});
  if(user){
    return res.redirect('https://anuragcoder9026.github.io/Anukriti/sign?error=email_exists');
  }
  
  const username=req.user.displayName+req.user.id;
  const firstName=req.user.name.givenName;
  const lastName=req.user.name.familyName;
  const profileImage=req.user.photos[0].value;
  let createdUser=await User.create({username, email,firstName,lastName,profileImage});    
  
  const accessToken=createdUser.generateAccessToken();
  const options = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: 'None'
  }; 
  res.cookie("accessToken",accessToken,options)  ;
  res.redirect(`https://anuragcoder9026.github.io/Anukriti/profile/${createdUser.username}`)  
});


passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://anuragcoder9026.github.io'); // Replace with your frontend URL
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Intercept OPTIONS method
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/users", userRouter);
app.use("/api/posts",postRouter);
export default app;
