import {betterAuth} from 'better-auth';
import {database} from './database';
export function createAuth(setup=false){
 if(!process.env.BETTER_AUTH_SECRET)throw Error('Creator authentication is not configured');
 return betterAuth({
  appName:'Moonlit Lofi Studio',
  baseURL:process.env.BETTER_AUTH_URL||'https://moonlit-lofi-website.vercel.app',
  secret:process.env.BETTER_AUTH_SECRET,
  database:database(),
  emailAndPassword:{enabled:true,disableSignUp:!setup,minPasswordLength:12},
  rateLimit:{enabled:true,storage:'database',window:60,max:30},
  session:{expiresIn:86400,updateAge:3600},
  advanced:{cookiePrefix:'moonlit-studio',useSecureCookies:process.env.NODE_ENV==='production'},
 });
}
