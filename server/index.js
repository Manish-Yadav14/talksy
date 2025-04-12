import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
require('dotenv').config();

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

const users = new Map();
const lastMatchedUsers = new Map();
const COOLDOWN_TIME = 10000;

const pickTwoRandom = (availableUsers) => {
  const i1 = Math.floor(Math.random() * availableUsers.length);
  let i2;
  do {
    i2 = Math.floor(Math.random() * availableUsers.length);
  } while (i2 === i1);
  return [availableUsers[i1], availableUsers[i2]];
};


const isCooldownExpired = (timeStamp)=>{
  return Date.now() - timeStamp > COOLDOWN_TIME;
}

setInterval(()=>{
  io.emit("online_users",{onlineUsers:users.size})
  lastMatchedUsers.forEach((timeStamp,pairId)=>{
    if(isCooldownExpired(timeStamp)){
      lastMatchedUsers.delete(pairId);
      tryMatchUsers();
    }
  })
},1000)

const tryMatchUsers = () => {
  const availableUsers = Array.from(users.entries()).filter(
    ([_, user]) => user.inCall===false && !lastMatchedUsers.has(user.peerId)
  );
  // console.log("AVAILABLE USERS:- ",availableUsers); 

  if (availableUsers.length >= 2) {
    const [user1, user2] = pickTwoRandom(availableUsers);
    // console.log("TWO RANDOM USERS:" , user1,user2);
    
    users.get(user1[0]).inCall = true;
    users.get(user2[0]).inCall = true;
    users.get(user1[0]).partner = user2[0];
    users.get(user2[0]).partner = user1[0];

    // Store in the cooldown map with current timestamp
    lastMatchedUsers.set(user1[1].peerId, Date.now());
    lastMatchedUsers.set(user2[1].peerId, Date.now());

    // Send each peer the other's PeerJS ID
    io.to(user1[0]).emit("matched", { peerId: user2[1].peerId });
    io.to(user2[0]).emit("matched", { peerId: user1[1].peerId });
    // console.log("USERS AFTER MATCHING:- ",user1,user2);
  }
};


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register-peer-id", ({ peerId }) => {
    // console.log(`Registering peerId: ${peerId} for socket: ${socket.id}`);
    users.set(socket.id, { peerId, inCall: false, partner: null });
    tryMatchUsers();
  });


  socket.on("leave-call", () => {
    const user = users.get(socket.id);
    if (!user || !user.partner) return;

    const partnerSocketId = user.partner;

    if (partnerSocketId && users.has(partnerSocketId)) {
      const partner = users.get(partnerSocketId);
      partner.inCall = false;
      partner.partner = null;
  
      // Place both users in cooldown after leaving the call
      lastMatchedUsers.set(user.peerId, Date.now());
      lastMatchedUsers.set(partner.peerId, Date.now());

      // io.to(partnerSocketId).emit("partner-disconnected");
    }

    user.inCall = false;
    user.partner = null;

    tryMatchUsers(); // Try matching again
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const user = users.get(socket.id);
    // console.log("USERS AFTER DISCONNECT:- ",users);

    if (!user) return;  

    const partnerSocketId = user.partner;

    if (partnerSocketId && users.has(partnerSocketId)) {
      const partner = users.get(partnerSocketId);
      partner.inCall = false;
      partner.partner = null;
      io.to(partnerSocketId).emit("partner-disconnected");
    }

    users.delete(socket.id);
    tryMatchUsers(); // Try matching again
  });
});

app.use(cors())
app.options('*', cors()); // Enable preflight for all routes

app.get("/", (req, res) => {
  res.send("Server is running....");
});

const PORT =  process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}...`);
});
