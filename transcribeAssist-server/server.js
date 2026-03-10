const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Configuración de Socket.io con opciones de ping para mantener viva la conexión
const io = new Server(server, {
  cors: {
    origin: '*', // En producción, deberías especificar tu dominio Vercel
    methods: ['GET', 'POST']
  },
  pingTimeout: 15000,
  pingInterval: 5000 // Envía ping cada 5s para evitar que 
                     // Firewalls de Universidades cierren la conexión
});

io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado:', socket.id);

  // El MAESTRO (host) o ALUMNO se unen a una sala específica por su ID corto (ej: 5zw46)
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Usuario ${socket.id} se unió a la sala: ${roomId}`);
    
    // Contar cuántos clientes hay en esa sala
    const room = io.sockets.adapter.rooms.get(roomId);
    const numClients = room ? room.size : 0;
    
    // Notificamos a TODOS en esa sala cuántos usuarios hay (útil para la UI del maestro)
    io.to(roomId).emit('peer_count', numClients);
  });

  // Escuchar cualquier broadcast de datos (ej. transcripción) y retransmitirlo a la sala
  socket.on('broadcast_data', ({ roomId, data }) => {
    // Retransmite a todos en la sala EXCEPTO al emisor (el maestro)
    socket.to(roomId).emit('data_received', data);
  });
  
  // Responder a peticiones de heartbeat del maestro
  socket.on('ping_room', (roomId) => {
     socket.to(roomId).emit('ping');
  });

  socket.on('pong_room', (roomId) => {
     socket.to(roomId).emit('pong');
  });

  socket.on('disconnecting', () => {
    // Antes de desconectar por completo, avisar a todas las salas a las que pertenecía
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) { // Evitar la sala por default de sí mismo
        const room = io.sockets.adapter.rooms.get(roomId);
        const numClients = room ? room.size - 1 : 0;
        io.to(roomId).emit('peer_count', numClients);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Ruta básica para que Render sepa que el servicio está vivo
app.get('/', (req, res) => {
  res.send('Servidor de TranscribeAssist en funcionamiento ⚡');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor de Señalización (Socket.io) corriendo en el puerto ${PORT}`);
});
