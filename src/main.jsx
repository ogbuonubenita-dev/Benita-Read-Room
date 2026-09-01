import React,{useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";
import { supabase } from "./supabaseClient";
const books=[
 {id:1,title:"A Scandalous Attraction",cat:"Romance · Fiction",price:7.99,desc:"A polished digital reading experience for your featured novel.",cover:"linear-gradient(145deg,#24173d,#7655ff)"},
 {id:2,title:"Ideas That Move You",cat:"Personal Growth",price:5.99,desc:"Practical ideas for growth, creativity and everyday decisions.",cover:"linear-gradient(145deg,#283132,#789b94)"},
 {id:3,title:"The Reading Room",cat:"Collection",price:9.99,desc:"A curated collection of essays, reflections and useful ideas.",cover:"linear-gradient(145deg,#49321f,#c9995b)"}
];
const posts=[
 {tag:"Writing",title:"Building a writing habit that lasts",desc:"Simple ways to make space for your ideas even on busy days."},
 {tag:"Behind the book",title:"What happens before a book reaches you?",desc:"A look inside the creative and publishing process."},
 {tag:"Life & ideas",title:"Five ideas I'm carrying into this season",desc:"A short collection of reflections and practical takeaways."}
];

function App(){
 const [page,setPage]=useState(location.hash.slice(2)||"home");
 const [user,setUser]=useState(JSON.parse(localStorage.getItem("brrUser")||"null"));
 const [member,setMember]=useState(localStorage.getItem("brrMember")==="1");
 const [toast,setToast]=useState("");
 const go=p=>{setPage(p);location.hash="#/"+p;scrollTo(0,0)};
 const notify=m=>{setToast(m);setTimeout(()=>setToast(""),2500)};
 const login=e=>{e.preventDefault();const email=e.currentTarget.email.value;const u={name:email.split("@")[0],email,admin:email.toLowerCase().includes("admin")};localStorage.setItem("brrUser",JSON.stringify(u));setUser(u);go("dashboard")};
 const signup=e=>{e.preventDefault();const u={name:e.currentTarget.name.value,email:e.currentTarget.email.value,admin:false};localStorage.setItem("brrUser",JSON.stringify(u));setUser(u);go("dashboard")};
 const subscribe=plan=>{localStorage.setItem("brrMember","1");setMember(true);notify(`${plan} membership selected — connect Paystack/Flutterwave/Stripe for live checkout.`);go("dashboard")};
const buy = async (b) => {
  const email = user?.email;
  if (!email) return notify("Please log in before purchasing.");

  const { data, error } = await supabase.functions.invoke("create-payment", {
    body: { email, amount: Number(b.price) * 100 }
  });

  if (error) return notify(error.message);

  if (data?.data?.authorization_url) {
    window.location.href = data.data.authorization_url;
  } else {
    notify("Unable to start payment.");
  } 
 const logout=()=>{localStorage.removeItem("brrUser");setUser(null);go("home")};

 function Nav(){return <header><div className="nav wrap"><button className="logo" onClick={()=>go("home")}>BENITA<span>.</span></button><div className="links"><button onClick={()=>go("books")}>Books</button><button onClick={()=>go("blog")}>Blog</button><button onClick={()=>go("membership")}>Membership</button>{user?<button onClick={()=>go("dashboard")}>Dashboard</button>:<button onClick={()=>go("login")}>Login</button>}{user?.admin&&<button onClick={()=>go("admin")}>Admin</button>}<button className="pill dark" onClick={()=>go(user?"dashboard":"signup")}>{user?"My account":"Join"}</button></div></div></header>}
 const Cover=({b})=><div className="cover" style={{background:b.cover}}><small>{b.cat}</small><strong>{b.title}</strong><small>BENITA CHINENYE</small></div>;
 const BookCard=({b})=><article className="card"><Cover b={b}/><h3>{b.title}</h3><p>{b.desc}</p><div className="row"><b>${b.price.toFixed(2)}</b><button className="pill dark" onClick={()=>buy(b)}>Buy book</button></div></article>;
 function Home(){return <><section className="hero wrap"><div><span className="eyebrow">BOOKS · BLOGS · EXCLUSIVE IDEAS</span><h1>Stories worth reading.<br/>Ideas worth keeping.</h1><p>A premium home for your books, essays and subscriber-only writing. Build a loyal reading community around your work.</p><div className="actions"><button className="pill dark" onClick={()=>go("books")}>Explore the bookstore →</button><button className="pill" onClick={()=>go("membership")}>See membership</button></div></div><div className="stack"><div className="mock b1"><small>FEATURED</small><b>A Scandalous<br/>Attraction</b><small>BENITA CHINENYE</small></div><div className="mock b2"><small>NEW</small><b>Ideas That<br/>Move You</b><small>BENITA CHINENYE</small></div><div className="mock b3"><small>COLLECTION</small><b>The<br/>Reading Room</b><small>BENITA CHINENYE</small></div></div></section><section className="wrap"><SectionHead title="Featured books" text="Sell individual ebooks while giving members an even richer reading experience."/><div className="grid">{books.map(b=><BookCard key={b.id} b={b}/>)}</div></section><section className="wrap"><SectionHead title="From the blog" text="Publish essays and behind-the-scenes notes between book releases."/><div className="bloggrid"><div className="feature"><span className="eyebrow">FEATURED ESSAY</span><h2>Why we keep returning to stories that change us</h2><p>Thoughts on reading, growth, relationships and the ideas that stay with us.</p><button className="pill" onClick={()=>go("blog")}>Read the blog →</button></div><div className="posts">{posts.map(p=><Post key={p.title} p={p}/>)}</div></div></section><CTA subscribe={subscribe}/></>}
 function SectionHead({title,text}){return <div className="sectionhead"><h2>{title}</h2><p>{text}</p></div>}
 function Post({p,premium=false}){return <article className="post"><span>{p.tag}</span><h3>{p.title}</h3><p>{p.desc}</p><button className="textbtn" onClick={()=>premium&&!member?go("membership"):notify("Article reader opened — connect your CMS/content API for full posts.")}>{premium&&!member?"Unlock →":"Read →"}</button></article>}
 function CTA(){return <section className="darksection"><div className="wrap cta"><div><span className="eyebrow">READER MEMBERSHIP</span><h2>Turn occasional readers into a community.</h2><p>Give subscribers premium posts, bonus chapters, early releases and a members-only letter.</p></div><div className="mini"><b>$7.99</b><small>/ month</small><button className="pill purple" onClick={()=>subscribe("Monthly")}>Start membership →</button></div></div></section>}
 function Books(){return <section className="wrap page"><SectionHead title="Bookstore" text="Your digital shop for books, collections and future releases."/><div className="grid">{books.map(b=><BookCard key={b.id} b={b}/>)}</div></section>}
 function Blog(){return <section className="wrap page"><SectionHead title="Blog" text="Free thoughts and premium writing for your readers."/><div className="posts big">{posts.map(p=><Post key={p.title} p={p}/>)}<Post premium p={{tag:"Members only",title:"The chapter I almost deleted",desc:"A behind-the-scenes story about editing, doubt and finishing the work."}}/></div></section>}
 function Membership(){return <section className="wrap page"><SectionHead title="Membership" text="Choose a plan and unlock the full reading room."/><div className="plans">{[["Monthly","7.99"],["Annual","79"]].map(([n,p])=><div className="plan" key={n}><span className="eyebrow">READER</span><h3>{n}</h3><strong>${p}<small>{n==="Annual"?"/ year":"/ month"}</small></strong><ul><li>Premium blog archive</li><li>Exclusive chapters</li><li>Early book releases</li><li>Members-only letters</li>{n==="Annual"&&<li>Annual digital collection</li>}</ul><button className="pill purple full" onClick={()=>subscribe(n)}>{member?"Manage membership":"Join "+n.toLowerCase()}</button></div>)}</div></section>}
 function Auth({signupMode=false}){return <section className="auth wrap"><form className="form" onSubmit={signupMode?signup:login}><span className="eyebrow">{signupMode?"JOIN THE READING ROOM":"WELCOME BACK"}</span><h2>{signupMode?"Create your account":"Log in"}</h2><p>{signupMode?"Start free and upgrade whenever you're ready.":"Access your books, membership and reading dashboard."}</p>{signupMode&&<label>Name<input name="name" required placeholder="Your name"/></label>}<label>Email<input name="email" type="email" required placeholder="you@example.com"/></label><label>Password<input type="password" required placeholder="••••••••"/></label><button className="pill dark full">{signupMode?"Create account":"Log in"}</button><button type="button" className="textbtn" onClick={()=>go(signupMode?"login":"signup")}>{signupMode?"Already have an account? Log in":"New here? Create an account"}</button></form></section>}
 function Dashboard(){if(!user){go("login");return null}return <section className="wrap page"><div className="dash"><aside className="side"><h3>Reader Room</h3><button onClick={()=>go("dashboard")}>Overview</button><button onClick={()=>go("books")}>Browse books</button><button onClick={()=>go("blog")}>Blog</button><button onClick={()=>go("membership")}>Membership</button>{user.admin&&<button onClick={()=>go("admin")}>Admin dashboard</button>}<button onClick={logout}>Log out</button></aside><main><SectionHead title={`Welcome, ${user.name}.`} text="Your personal reading dashboard."/><div className="stats"><Stat t="Membership" v={member?"Active":"Free"}/><Stat t="Books available" v="3"/><Stat t="Saved" v="0"/></div><div className="panel"><h3>Continue reading</h3><p>No active reading session yet.</p><button className="pill dark" onClick={()=>go("books")}>Browse books</button></div></main></div></section>}
 function Stat({t,v}){return <div className="stat"><span>{t}</span><b>{v}</b></div>}
 function Admin(){
  if(!user?.admin){go("login");return null}
  const [catalog,setCatalog]=useState(books.map(b=>({...b,status:"Published"})));
  const [q,setQ]=useState("");
  const [filter,setFilter]=useState("All");
  const [selected,setSelected]=useState([]);
  const [draft,setDraft]=useState({title:"",cat:"",price:"",desc:"",status:"Draft"});
  const filtered=catalog.filter(b=>(filter==="All"||b.status===filter)&&
    (b.title.toLowerCase().includes(q.toLowerCase())||b.cat.toLowerCase().includes(q.toLowerCase())));
  const toggle=id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const toggleAll=()=>setSelected(selected.length===filtered.length?[]:filtered.map(b=>b.id));
  const bulk=status=>{setCatalog(catalog.map(b=>selected.includes(b.id)?{...b,status}:b));setSelected([]);notify(`Selected books marked ${status.toLowerCase()}.`)}
  const add=e=>{e.preventDefault();const b={id:Date.now(),title:draft.title||"Untitled book",cat:draft.cat||"Uncategorized",price:Number(draft.price)||0,desc:draft.desc||"",cover:"linear-gradient(145deg,#24173d,#7655ff)",status:draft.status};setCatalog([b,...catalog]);setDraft({title:"",cat:"",price:"",desc:"",status:"Draft"});notify("Book added to the catalog.");}
  const remove=id=>{setCatalog(catalog.filter(b=>b.id!==id));setSelected(selected.filter(x=>x!==id));notify("Book removed from this demo catalog.");}
  return <section className="wrap page">
    <SectionHead title="Author / Admin dashboard" text="Publish and manage an unlimited book catalog without editing your website code."/>
    <div className="stats">
      <Stat t="Total books" v={catalog.length}/>
      <Stat t="Published" v={catalog.filter(b=>b.status==="Published").length}/>
      <Stat t="Drafts" v={catalog.filter(b=>b.status==="Draft").length}/>
    </div>

    <div className="panel">
      <div className="paneltop"><div><h3>Book catalog</h3><p>Search, filter and manage your entire library.</p></div><button className="pill purple" onClick={()=>document.getElementById("add-book")?.scrollIntoView({behavior:"smooth"})}>+ Add book</button></div>
      <div className="catalogtools">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by title or category"/>
        <select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Published</option><option>Draft</option></select>
      </div>
      {selected.length>0&&<div className="bulkbar"><b>{selected.length} selected</b><button className="pill" onClick={()=>bulk("Published")}>Publish selected</button><button className="pill" onClick={()=>bulk("Draft")}>Unpublish selected</button></div>}
      <div className="tablewrap"><table><thead><tr><th><input type="checkbox" checked={filtered.length>0&&selected.length===filtered.length} onChange={toggleAll}/></th><th>Book</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{filtered.map(b=><tr key={b.id}><td><input type="checkbox" checked={selected.includes(b.id)} onChange={()=>toggle(b.id)}/></td><td><b>{b.title}</b><small>{b.desc?.slice(0,60)}</small></td><td>{b.cat}</td><td>${Number(b.price).toFixed(2)}</td><td><span className={`status ${b.status.toLowerCase()}`}>{b.status}</span></td><td><button className="textbtn" onClick={()=>setCatalog(catalog.map(x=>x.id===b.id?{...x,status:x.status==="Published"?"Draft":"Published"}:x))}>{b.status==="Published"?"Unpublish":"Publish"}</button> · <button className="textbtn danger" onClick={()=>remove(b.id)}>Delete</button></td></tr>)}</tbody></table></div>
      {filtered.length===0&&<div className="empty">No books match your search.</div>}
    </div>

    <div className="panel" id="add-book">
      <div className="paneltop"><div><h3>Add a new book</h3><p>Create another title whenever you are ready. There is no catalog limit in the application.</p></div></div>
      <form className="adminform" onSubmit={add}>
        <div className="twocol"><label>Book title<input required value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="e.g. The Next Chapter"/></label><label>Category<input value={draft.cat} onChange={e=>setDraft({...draft,cat:e.target.value})} placeholder="Romance, nonfiction, essays..."/></label></div>
        <div className="twocol"><label>Price (USD)<input type="number" min="0" step="0.01" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} placeholder="7.99"/></label><label>Publication status<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option>Draft</option><option>Published</option></select></label></div>
        <label>Description<textarea value={draft.desc} onChange={e=>setDraft({...draft,desc:e.target.value})} placeholder="Short book description"/></label>
        <div className="uploadgrid"><div className="uploadbox">🖼️<b>Cover upload</b><small>Connect to Supabase Storage: covers/</small></div><div className="uploadbox">📖<b>EPUB / PDF upload</b><small>Connect to private Storage: ebooks/</small></div></div>
        <button className="pill dark">Add book to catalog</button>
      </form>
    </div>

    <div className="panel"><h3>Publishing workflow</h3><div className="workflow"><span>1<br/><b>Create</b></span><span>→</span><span>2<br/><b>Upload</b></span><span>→</span><span>3<br/><b>Preview</b></span><span>→</span><span>4<br/><b>Publish</b></span><span>→</span><span>5<br/><b>Sell</b></span></div></div>
  </section>}
 let content=page==="home"?<Home/>:page==="books"?<Books/>:page==="blog"?<Blog/>:page==="membership"?<Membership/>:page==="login"?<Auth/>:page==="signup"?<Auth signupMode/>:page==="dashboard"?<Dashboard/>:page==="admin"?<Admin/>:<Home/>;
 return <><Nav/>{content}<footer className="wrap"><span>© 2026 Benita Chinenye</span><span>Books · Blog · Membership · Reader Dashboard</span></footer>{toast&&<div className="toast">{toast}</div>}</>
}
createRoot(document.getElementById("root")).render(<App/>);
