const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// MIDDLEWARES DE SEGURIDAD 
app.use(helmet());

// Configuración de CORS
app.use(cors({
    origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:5501',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://wheels-final-project-frontend.onrender.com',
    'https://wheels-final-project.onrender.com'
  ],
  credentials: true
}));



// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde'
});
app.use('/api/', limiter);

//  MIDDLEWARES GENERALES 
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// RUTAS
// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: '🚗 API de Wheels - Carpooling Universitario',
    version: '1.0.0',
    status: 'OK'
  });
});


// Rutas de autenticación
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Rutas de vehículos
const vehicleRoutes = require('./routes/vehicleRoutes');
app.use('/api/vehicles', vehicleRoutes);

// Rutas de viajes
const tripRoutes = require('./routes/tripRoutes');
app.use('/api/trips', tripRoutes);

// Rutas de reservas
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);


// Ruta no encontrada (debe ir DESPUÉS de todas las rutas)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;

//APLICACIÓN UTRAVEL