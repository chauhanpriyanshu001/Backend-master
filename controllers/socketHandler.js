// socketHandler.js
const socketIO = require('socket.io');

function initializeSocketServer(server) {
  const io = socketIO(server,{
    cors:{
    origin: "*",
   }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
  });

  return io;
}

// New Ride Create
function broadcastMessage(io, message) {
  io.emit('broadcastMessageToDrivers', message);
}

function newRideComing(io, message, targetSocketId) {
  console.log('Before emit:', message, targetSocketId);
  io.to(targetSocketId).emit('newRideComing', message);
  console.log('After emit:', message, targetSocketId);
}

// Make Bid Offer
function sendBidFareToUser(io, message,targetSocketId) {
    console.log('Before emit:', message, targetSocketId);
     try {
        io.to(targetSocketId).emit('sendBidFareToUser', message);
      } catch (error) {
        console.error('Error emitting message:', error);
      }
    console.log('After emit:', message, targetSocketId);
}

// Accept or reject Bid
function updateBidToDriver(io, message, targetSocketId) {
    console.log('Before emit:', message, targetSocketId);
    io.to(targetSocketId).emit('updateBidToDriver', message);
    console.log('After emit:', message, targetSocketId);
}

// Accept or reject Bid
function fetchOngoingRideDriver(io, message, targetSocketId) {
    console.log('Before emit:', message, targetSocketId);
    io.to(targetSocketId).emit('fetchOngoingRideDriver', message);
    console.log('After emit:', message, targetSocketId);
}

// Accept or reject Bid
function updateBidToOtherDriver(io, message, targetSocketId) {
    console.log('Before emit:', message, targetSocketId);
    io.to(targetSocketId).emit('updateBidToOtherDriver', message);
    console.log('After emit:', message, targetSocketId);
}

// Update Ride Status
function updateRideStatus(io, message, targetSocketId) {
    io.to(targetSocketId).emit('updateRideStatus', message);
}

function documentUpdateDriver(io, message, targetSocketId) {
  console.log('Before emit:', message, targetSocketId);
  io.to(targetSocketId).emit('documentUpdate', message);
  console.log('After emit:', message, targetSocketId);
}

module.exports = { initializeSocketServer, broadcastMessage ,sendBidFareToUser ,updateBidToDriver ,updateRideStatus ,updateBidToOtherDriver ,fetchOngoingRideDriver ,documentUpdateDriver,newRideComing };
