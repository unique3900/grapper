import { PrismaClient } from "@prisma/client";
import passport from 'passport';
import LocalStrategy from 'passport-local';
import GoogleStrategy from 'passport-google-oauth20';
import bcrypt from 'bcrypt';


const prisma=new PrismaClient();

const LocalStrategyAuth=LocalStrategy.Strategy
const GoogleStrategyAuth=GoogleStrategy.Strategy

// Local Strategy
passport.use(new LocalStrategyAuth(
    {
        usernameField:'email',
    },
    async(email:string,password:string,done:Function)=>{
        try{
            const user=await prisma.user.findUnique({
                where:{email}
            })
            if(!user){
                return done(null,false,{message:'User not found'});
            }
            if (!user.password) {
                return done(null, false, { message: 'Use Google login instead.' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password' });
            }
            return done(null, user);
        }catch(error){
            return done(error);
        }
    }
))



// Google Strategy
passport.use(
    new GoogleStrategyAuth(
      {
        clientID: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        callbackURL: '/auth/google/callback', 
      },
      async (accessToken:string, refreshToken:string, profile:any, done:Function) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
  
          let user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            // Create user if not found
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName || 'Unnamed',
                googleId,
                provider: 'GOOGLE',
                verified: true,
              },
            });
          }
  
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );


  passport.serializeUser((user, done) => {
    // @ts-ignore
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      // @ts-ignore
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });


  export default passport