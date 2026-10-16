import {env} from 'cloudflare:workers';
import {admin} from '../../data';
export async function GET(req:Request){
 if(!await admin(req))return new Response('Creator access required',{status:403});
 const q=new URL(req.url).searchParams;
 const to=q.get('to')||new Date().toISOString().slice(0,10),from=q.get('from')||new Date(Date.now()-6*86400000).toISOString().slice(0,10);
 const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(!valid(from)||!valid(to))return new Response('Choose valid dates',{status:400});
 const start=Date.parse(from),end=Date.parse(to)+86400000;
 if(end<=start||end-start>366*86400000)return new Response('Choose a range of up to 366 days',{status:400});
 const track=q.get('track');if(track&&track.length>80)return new Response('Invalid track',{status:400});
 const sql='SELECT track,country,CAST(at/1800000 AS INTEGER)*1800000 AS at,SUM(seconds) AS seconds,COUNT(*) AS samples FROM events WHERE at>=? AND at<?'+(track?' AND track=?':'')+' GROUP BY track,country,CAST(at/1800000 AS INTEGER) ORDER BY at';
 const statement=env.DB!.prepare(sql),rows=await (track?statement.bind(start,end,track):statement.bind(start,end)).all();
 return Response.json({rows:rows.results,from,to},{headers:{'Cache-Control':'no-store'}});
}
