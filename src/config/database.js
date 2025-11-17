const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Opciones de conexión (mongoose 6+ no necesita useNewUrlParser ni useUnifiedTopology)
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Eventos de la conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB desconectado');
    });

  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.log('⚠️ Verifica tu MONGODB_URI en el archivo .env');
    process.exit(1); // Salir con error - RESTAURAMOS ESTO
  }
};

module.exports = connectDB;