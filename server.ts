import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const MAX_USERS_PER_ROOM = 50;

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  const PORT = 3000;

  // Track active rooms and their user counts for fast lookup
  const shardCounts = new Map<string, number>();
  
  // Track which shard each user is in
  const socketToShard = new Map<string, string>();

  function getAvailableShard(): string {
    for (const [shardName, count] of shardCounts.entries()) {
      if (count < MAX_USERS_PER_ROOM) {
        return shardName;
      }
    }
    // Generate a new shard if all active ones are full or if none exist
    let newShardIndex = 1;
    let newShardId = `global_shard_${newShardIndex}`;
    while (shardCounts.has(newShardId)) {
      newShardIndex++;
      newShardId = `global_shard_${newShardIndex}`;
    }
    
    shardCounts.set(newShardId, 0);
    console.log(`Generated new shard: ${newShardId}`);
    return newShardId;
  }

  io.on('connection', (socket: Socket) => {
    // 1. Assign to a shard
    const shard = getAvailableShard();
    
    // 2. Join the room
    socket.join(shard);
    
    // 3. Update state
    socketToShard.set(socket.id, shard);
    shardCounts.set(shard, (shardCounts.get(shard) || 0) + 1);

    // 4. Notify user which shard they are in
    socket.emit('assigned_shard', shard);

    console.log(`User ${socket.id} joined ${shard}. Users in shard: ${shardCounts.get(shard)}`);

    // Handle messages
    socket.on('send_message', (payload) => {
      // payload expects: { id: string, text: string, sender: string, timestamp: number }
      // Broadcast to all users in the specific shard
      io.to(shard).emit('new_message', payload);
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
          console.log(`Shard ${userShard} is empty and was cleaned up.`);
        } else {
          shardCounts.set(userShard, currentCount);
          console.log(`User ${socket.id} left ${userShard}. Users left: ${currentCount}`);
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
