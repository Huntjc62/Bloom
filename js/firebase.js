import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { onAuthStateChanged };

export async function registerUser({name,email,password,role}) {
  const credential = await createUserWithEmailAndPassword(auth,email,password);
  const user = credential.user;

  await setDoc(doc(db,"users",user.uid),{
    uid:user.uid,
    name,
    email:user.email,
    role:role === "partner" ? "partner" : "mum",
    familyId:null,
    partnerUid:null,
    createdAt:serverTimestamp()
  });

  await sendEmailVerification(user);
  return user;
}

export async function loginUser(email,password) {
  const credential = await signInWithEmailAndPassword(auth,email,password);
  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function getProfile(uid) {
  const snap = await getDoc(doc(db,"users",uid));
  return snap.exists() ? snap.data() : null;
}

export async function createFamily(uid) {
  const familyRef = doc(collection(db,"families"));
  const familyId = familyRef.id;

  await setDoc(familyRef,{
    familyId,
    ownerUid:uid,
    memberIds:[uid],
    memberCount:1,
    stage:"pregnancy",
    createdAt:serverTimestamp()
  });

  await updateDoc(doc(db,"users",uid),{familyId});
  return familyId;
}

function inviteCode() {
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes=new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes,b=>alphabet[b%alphabet.length]).join("");
}

export async function createPartnerInvite(uid) {
  const profile=await getProfile(uid);
  if(!profile?.familyId) throw new Error("You need a Bloom family before inviting a partner.");

  const familySnap=await getDoc(doc(db,"families",profile.familyId));
  if(!familySnap.exists()) throw new Error("Bloom family not found.");

  const family=familySnap.data();
  if(family.ownerUid!==uid) throw new Error("Only the family owner can create the partner invitation.");
  if((family.memberIds||[]).length>=2) throw new Error("Your Bloom family already has two members.");

  const code=inviteCode();

  await setDoc(doc(db,"partnerInvites",code),{
    code,
    familyId:profile.familyId,
    createdByUid:uid,
    status:"open",
    createdAt:serverTimestamp()
  });

  return code;
}

export async function joinFamilyWithInvite(uid,code) {
  const clean=code.trim().toUpperCase();
  if(!clean) throw new Error("Enter your invitation code.");

  const inviteRef=doc(db,"partnerInvites",clean);
  const userRef=doc(db,"users",uid);

  await runTransaction(db,async tx=>{
    const inviteSnap=await tx.get(inviteRef);
    if(!inviteSnap.exists()) throw new Error("That invitation code was not found.");
    const invite=inviteSnap.data();

    if(invite.status!=="open") throw new Error("That invitation has already been used.");

    const familyRef=doc(db,"families",invite.familyId);
    const familySnap=await tx.get(familyRef);
    if(!familySnap.exists()) throw new Error("The Bloom family could not be found.");

    const family=familySnap.data();
    const members=family.memberIds||[];

    if(members.length>=2) throw new Error("This Bloom family already has two members.");
    if(members.includes(uid)) throw new Error("You are already in this Bloom family.");

    const updatedMembers=[...members,uid];

    tx.update(familyRef,{
      memberIds:updatedMembers,
      memberCount:2
    });

    tx.update(userRef,{
      familyId:invite.familyId,
      partnerUid:family.ownerUid
    });

    // Do not edit the owner's user document from the partner's browser.
    // The family memberIds are the source of truth for the connection.

    tx.update(inviteRef,{
      status:"used",
      usedByUid:uid,
      usedAt:serverTimestamp()
    });
  });

  return true;
}

async function familyForUser(uid) {
  const profile=await getProfile(uid);
  if(!profile?.familyId) return null;
  const snap=await getDoc(doc(db,"families",profile.familyId));
  return snap.exists()?snap.data():null;
}

export async function ensureFamily(uid) {
  const profile=await getProfile(uid);
  if(!profile) throw new Error("Bloom profile not found.");
  if(profile.familyId) return familyForUser(uid);
  await createFamily(uid);
  return familyForUser(uid);
}

export async function saveFamily(uid,data) {
  const profile=await getProfile(uid);
  if(!profile?.familyId) throw new Error("No Bloom family is connected to this account.");
  await setDoc(doc(db,"families",profile.familyId),data,{merge:true});
}

export async function addCheckin(uid,data) {
  const profile=await getProfile(uid);
  if(!profile?.familyId) throw new Error("No Bloom family is connected to this account.");
  return addDoc(collection(db,"families",profile.familyId,"checkins"),{
    ...data,
    createdByUid:uid,
    createdAt:serverTimestamp()
  });
}

export async function addBabyActivity(uid,data) {
  const profile=await getProfile(uid);
  if(!profile?.familyId) throw new Error("No Bloom family is connected to this account.");
  return addDoc(collection(db,"families",profile.familyId,"babyActivity"),{
    ...data,
    createdByUid:uid,
    createdAt:serverTimestamp()
  });
}

export async function loadCheckins(uid) {
  const profile=await getProfile(uid);
  if(!profile?.familyId) return [];
  const q=query(
    collection(db,"families",profile.familyId,"checkins"),
    orderBy("createdAt","desc"),
    limit(50)
  );
  const snap=await getDocs(q);
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}

export async function loadBabyActivity(uid) {
  const profile=await getProfile(uid);
  if(!profile?.familyId) return [];
  const q=query(
    collection(db,"families",profile.familyId,"babyActivity"),
    orderBy("createdAt","desc"),
    limit(100)
  );
  const snap=await getDocs(q);
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}
