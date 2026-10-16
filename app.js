import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const configured = firebaseConfig.apiKey !== "PASTE_API_KEY_HERE" && firebaseConfig.projectId !== "PASTE_PROJECT_ID";
let auth, db, currentUser = null, isAdmin = false;
if (configured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app); db = getFirestore(app);
}
const demoProducts = [
  {id:"demo-shirt",name:"Stylish T-Shirt",description:"Everyday comfort with a clean, modern look.",price:299,stock:10,imageUrl:"",emoji:"👕"},
  {id:"demo-bag",name:"Everyday Tote Bag",description:"A handy companion for shopping and daily use.",price:199,stock:15,imageUrl:"",emoji:"👜"},
  {id:"demo-mug",name:"Classic Coffee Mug",description:"A simple mug for your favourite hot drink.",price:149,stock:20,imageUrl:"",emoji:"☕"}
];
let products = [...demoProducts], cart = [];
const $ = id => document.getElementById(id);
const money = n => Number(n||0).toLocaleString("en-IN");
function notice(msg){ $("notice").textContent = msg; }
function renderProducts(){
  $("productGrid").innerHTML = products.map(p=>`<article class="product"><div class="product-visual">${p.imageUrl?`<img src="${escapeHtml(p.imageUrl)}" alt="">`:`<span>${p.emoji||"🛍️"}</span>`}<span class="tag">${Number(p.stock||0)>0?"IN STOCK":"CHECK AVAILABILITY"}</span></div><div class="product-body"><h3>${escapeHtml(p.name||"Product")}</h3><p>${escapeHtml(p.description||"A great find from BiswaKart.")}</p><div class="product-foot"><span class="price">₹${money(p.price)}</span><button class="add-btn" data-add="${escapeHtml(p.id)}">Add to cart +</button></div></div></article>`).join("");
  document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addToCart(b.dataset.add));
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function addToCart(id){const p=products.find(x=>x.id===id);if(!p)return;const found=cart.find(x=>x.id===id);if(found)found.quantity++;else cart.push({...p,quantity:1});renderCart();}
function renderCart(){
  $("cartCount").textContent=cart.reduce((s,p)=>s+p.quantity,0);
  $("cartTotal").textContent=money(cart.reduce((s,p)=>s+Number(p.price||0)*p.quantity,0));
  $("cartItems").innerHTML=cart.length?cart.map(p=>`<div class="cart-row"><div><b>${escapeHtml(p.name)}</b><small>${p.quantity} × ₹${money(p.price)}</small></div><button class="remove-btn" data-remove="${escapeHtml(p.id)}">Remove</button></div>`).join(""):'<p class="muted">Your cart is empty.</p>';
  document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart=cart.filter(p=>p.id!==b.dataset.remove);renderCart();});
}
function openAuth() {
  const dialog = document.getElementById("authDialog");

  if (!dialog) {
    alert("Login form nahi mila!");
    return;
  }

  if (!configured) {
    alert("Firebase configuration check karo!");
    return;
  }

  dialog.showModal();
}
$("accountBtn").onclick=()=>currentUser?signOut(auth):openAuth();
$("loginBtn").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("email").value,$("password").value);$("authDialog").close();}catch(e){$("authMessage").textContent=e.message;}};
$("signupBtn").onclick=async()=>{try{await createUserWithEmailAndPassword(auth,$("email").value,$("password").value);$("authDialog").close();}catch(e){$("authMessage").textContent=e.message;}};
$("refreshBtn").onclick=loadProducts;
$("checkoutBtn").onclick=async()=>{
  if(!cart.length){alert("Your cart is empty.");return;}
  if(!configured){alert("Demo mode only. Connect Firebase to place a real order.");return;}
  if(!currentUser){openAuth();return;}
  try{
    const total=cart.reduce((s,p)=>s+Number(p.price||0)*p.quantity,0);
    await addDoc(collection(db,"orders"),{userId:currentUser.uid,items:cart.map(p=>({productId:p.id,productName:p.name,unitPrice:Number(p.price||0),quantity:p.quantity})),totalPrice:total,status:"pending",createdAt:serverTimestamp()});
    cart=[];renderCart();alert("Order submitted! You can check its status under My orders.");loadMyOrders();
  }catch(e){alert("Order could not be placed: "+e.message);}
};
$("loadOrdersBtn").onclick=loadAdminOrders;
async function loadProducts(){
  if(!configured){products=[...demoProducts];renderProducts();notice("Demo preview is showing sample products. Connect Firebase to load real products.");return;}
  try{
    const snap=await getDocs(collection(db,"products"));
    products=snap.docs.map(d=>({id:d.id,...d.data()}));
    if(!products.length){products=[...demoProducts];notice("No products in Firestore yet, so sample products are shown. Add products in the products collection.");}
    else notice("Products loaded from your BiswaKart Firebase project.");
  }catch(e){products=[...demoProducts];notice("Could not load Firebase products. Check the Firebase config and Firestore Rules.");}
  renderProducts();
}
async function loadMyOrders(){
  if(!configured||!currentUser)return;
  $("ordersSection").classList.remove("hidden");
  try{const snap=await getDocs(query(collection(db,"orders"),where("userId","==",currentUser.uid),orderBy("createdAt","desc"),limit(30)));
    $("myOrders").innerHTML=snap.empty?'<p class="muted">No orders yet.</p>':snap.docs.map(d=>orderCard(d.id,d.data(),false)).join("");
  }catch(e){$("myOrders").innerHTML='<p class="muted">Orders are not available yet. Confirm your Firestore Rules and index settings.</p>';}
}
function orderCard(id,o,admin){
  const items=(o.items||[]).map(i=>`${escapeHtml(i.productName)} × ${Number(i.quantity||1)}`).join(", ");
  return `<article class="order-card"><h3>Order ${escapeHtml(id.slice(0,8))}</h3><p>${items||escapeHtml(o.productName||"Order")}</p><p>Total: <b>₹${money(o.totalPrice)}</b></p><span class="status">${escapeHtml(o.status||"pending")}</span>${admin?`<p>Customer UID: ${escapeHtml(o.userId||"")}</p>`:""}</article>`;
}
async function loadAdminOrders(){
  if(!currentUser){openAuth();return;}
  try{
    const adminDoc=await getDoc(doc(db,"admins",currentUser.uid));
    if(!adminDoc.exists()||adminDoc.data().active!==true){alert("This account is not enabled as an admin yet.");return;}
    const snap=await getDocs(query(collection(db,"orders"),orderBy("createdAt","desc"),limit(50)));
    $("adminSection").classList.remove("hidden");
    $("adminOrders").innerHTML=snap.empty?'<p class="muted">No orders yet.</p>':snap.docs.map(d=>orderCard(d.id,d.data(),true)).join("");
  }catch(e){alert("Admin orders could not load. Check Firestore Rules and admin setup.");}
}
if(configured){
 onAuthStateChanged(auth,async user=>{
   currentUser=user;
   $("accountBtn").textContent=user?(user.email?user.email.split("@")[0]:"Account")+" · Logout":"Login";
   if(user){try{const a=await getDoc(doc(db,"admins",user.uid));isAdmin=a.exists()&&a.data().active===true;if(isAdmin)$("adminSection").classList.remove("hidden");}catch{} await loadMyOrders();}
   else{$("ordersSection").classList.add("hidden");$("adminSection").classList.add("hidden");}
 });
}
renderProducts();renderCart();loadProducts();
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
