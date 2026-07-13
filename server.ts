import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();

  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  const PORT = process.env.PORT || 3000;

  // Track active rooms and their user counts for fast lookup
  const shardCounts = new Map<string, number>();
  
  // Track messages per shard for chat history
  const shardMessages = new Map<string, any[]>();
  
  // Track which shard each user is in
  const socketToShard = new Map<string, string>();

  function getAvailableShard(): string {
    const shardName = 'global_shard';
    if (!shardCounts.has(shardName)) {
      shardCounts.set(shardName, 0);
    }
    return shardName;
  }

  io.on('connection', (socket: Socket) => {
    // 1. Get deviceId from handshake
    const deviceId = socket.handshake.auth?.deviceId;
    const deviceRoom = deviceId ? `device_${deviceId}` : `device_${socket.id}`; // Fallback if missing

    // 2. Assign to a shard
    const shard = getAvailableShard();
    
    // 3. Join the rooms (Public Shard + Private Device Room)
    socket.join(shard);
    socket.join(deviceRoom);
    
    // 4. Update state
    socketToShard.set(socket.id, shard);
    shardCounts.set(shard, (shardCounts.get(shard) || 0) + 1);
    io.to(shard).emit('user_count', shardCounts.get(shard));

    // 5. Notify user which shard they are in
    socket.emit('assigned_shard', shard);

    // 6. Send chat history
    const history = shardMessages.get(shard) || [];
    // Mark messages as isSelf if they were sent by this deviceId
    const personalizedHistory = history.map(msg => ({
      ...msg,
      isSelf: msg.deviceId === deviceId
    }));
    // Clean history before sending (remove deviceId)
    const cleanHistory = personalizedHistory.map(({ deviceId, ...safeMsg }) => safeMsg);
    socket.emit('chat_history', cleanHistory);

    console.log(`User ${socket.id} joined ${shard} and ${deviceRoom}. Users in shard: ${shardCounts.get(shard)}`);

    // Handle messages
    socket.on('send_message', (payload) => {
      // Create a clean payload with only safe data
      const cleanPayload = {
        id: payload.id,
        text: payload.text,
        sender: payload.sender,
        timestamp: payload.timestamp,
        gifUrl: payload.gifUrl,
        gifAspect: payload.gifAspect
      };

      // Save to history
      const msgForHistory = { ...cleanPayload, deviceId: socket.handshake.auth?.deviceId };
      if (!shardMessages.has(shard)) {
        shardMessages.set(shard, []);
      }
      shardMessages.get(shard)!.push(msgForHistory);

      // Broadcast to all OTHER users in the specific shard
      socket.to(shard).except(deviceRoom).emit('new_message', cleanPayload);

      // Emit to all tabs of the SAME user in their private device room with isSelf flag
      io.to(deviceRoom).emit('new_message', { ...cleanPayload, isSelf: true });
    });

    // Handle disconnects gracefully
    socket.on('disconnect', () => {
      const userShard = socketToShard.get(socket.id);
      if (userShard) {
        socketToShard.delete(socket.id);
        const currentCount = (shardCounts.get(userShard) || 1) - 1;
        
        if (currentCount <= 0) {
          // Clean up empty rooms to avoid memory leaks
          shardCounts.delete(userShard);
          shardMessages.delete(userShard);
          console.log(`Shard ${userShard} is empty and was cleaned up.`);
        } else {
          shardCounts.set(userShard, currentCount);
          console.log(`User ${socket.id} left ${userShard}. Users left: ${currentCount}`);
          io.to(userShard).emit('user_count', currentCount);
        }
      }
    });
  });

  // API Health/Debug route
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      shards: Object.fromEntries(shardCounts)
    });
  });

  // GIF Search Proxy Route
  app.get('/api/gifs/search', async (req, res) => {
    try {
      const apiKey = process.env.GIPHY_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'GIPHY_API_KEY is not configured on the server.' });
      }
      const query = req.query.q as string || '';
      const limit = req.query.limit || 20;
      
      const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g`);
      if (!response.ok) {
         return res.status(response.status).json({ error: 'Giphy API error' });
      }
      const data = await response.json();
      res.json(data);
    } catch (e) {
      console.error('Error fetching gifs:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GIF Trending Proxy Route
  app.get('/api/gifs/trending', async (req, res) => {
    try {
      const apiKey = process.env.GIPHY_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'GIPHY_API_KEY is not configured on the server.' });
      }
      const limit = req.query.limit || 20;
      
      const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=${limit}&rating=g`);
      if (!response.ok) {
         return res.status(response.status).json({ error: 'Giphy API error' });
      }
      const data = await response.json();
      res.json(data);
    } catch (e) {
      console.error('Error fetching trending gifs:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
