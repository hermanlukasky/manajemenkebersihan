import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join room based on role
    socket.on('join-room', (role: string) => {
      socket.join(role);
      console.log(`User ${socket.id} joined room: ${role}`);
    });

    // Handle new laporan submission
    socket.on('laporan-submitted', (data: { laporanId: string; pegawai: string; ruangan: string }) => {
      // Notify admin room
      io.to('admin').emit('notification', {
        type: 'laporan_baru',
        message: `Laporan baru dari ${data.pegawai} untuk ${data.ruangan}`,
        data: data,
        timestamp: new Date().toISOString()
      });
    });

    // Handle jadwal update
    socket.on('jadwal-updated', (data: { pegawaiId: string; jadwal: any }) => {
      // Notify specific pegawai
      io.emit(`pegawai-${data.pegawaiId}`, {
        type: 'jadwal_update',
        message: 'Jadwal Anda telah diperbarui',
        data: data.jadwal,
        timestamp: new Date().toISOString()
      });
    });

    // Handle laporan verification
    socket.on('laporan-verified', (data: { laporanId: string; pegawaiId: string; rating: number; komentar: string }) => {
      // Notify specific pegawai
      io.emit(`pegawai-${data.pegawaiId}`, {
        type: 'laporan_verified',
        message: `Laporan Anda telah diverifikasi dengan rating ${data.rating}/5`,
        data: data,
        timestamp: new Date().toISOString()
      });
    });

    // Handle real-time location tracking (if enabled)
    socket.on('location-update', (data: { pegawaiId: string; location: { lat: number; lng: number } }) => {
      // Broadcast to admin room
      io.to('admin').emit('location-update', {
        pegawaiId: data.pegawaiId,
        location: data.location,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Manajemen Kebersihan Kantor System',
      timestamp: new Date().toISOString(),
    });
  });
};