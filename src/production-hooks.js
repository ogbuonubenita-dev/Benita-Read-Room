
import { supabase } from "./supabaseClient";

export async function signUp({email,password,fullName}){
  return supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});
}
export async function signIn({email,password}){
  return supabase.auth.signInWithPassword({email,password});
}
export async function signOut(){ return supabase.auth.signOut(); }

export async function currentUser(){
  const {data,error}=await supabase.auth.getUser();
  if(error) throw error;
  return data.user;
}

export async function listPublishedBooks(){
  const {data,error}=await supabase.from("books").select("*").eq("published",true).order("created_at",{ascending:false});
  if(error) throw error;
  return data || [];
}

export async function createBookRecord(book){
  const {data,error}=await supabase.functions.invoke("admin-books",{body:book});
  if(error) throw error;
  return data;
}

export async function uploadBookAsset(file, kind, bookId){
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
  const path=`${bookId}/${Date.now()}-${safe}`;
  const bucket=kind==="cover" ? "covers" : "ebooks";
  const {data,error}=await supabase.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||undefined});
  if(error) throw error;
  return data.path;
}

export async function publishBook({bookId, title, slug, description, priceKobo, currency, coverFile, ebookFile, published=true}){
  const coverPath=coverFile ? await uploadBookAsset(coverFile,"cover",bookId) : null;
  const ebookPath=ebookFile ? await uploadBookAsset(ebookFile,"ebook",bookId) : null;
  return createBookRecord({
    id:bookId,title,slug,description,price_kobo:priceKobo,currency,
    cover_path:coverPath,ebook_path:ebookPath,published
  });
}

export async function startBookCheckout(bookId){
  const {data,error}=await supabase.functions.invoke("create-checkout",{body:{bookId}});
  if(error) throw error;
  window.location.href=data.authorization_url;
}

export async function downloadBook(bookId){
  const {data,error}=await supabase.functions.invoke("create-download",{body:{bookId}});
  if(error) throw error;
  window.location.href=data.url;
}
