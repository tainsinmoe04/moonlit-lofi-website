import {memberFor} from '../../../membership';
export async function GET(req:Request){const member=await memberFor(req);return Response.json(member?{member:true,name:member.name,expires:member.expires}:{member:false},{headers:{'Cache-Control':'private, no-store'}})}
