const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * Rutas protegidas (requieren autenticación)
 * IMPORTANTE: Estas deben ir ANTES de las rutas con :id para evitar conflictos
 */

// Obtener los viajes creados por el conductor autenticado
// GET /api/trips/my-trips
router.get('/my-trips', protect, tripController.obtenerMisViajes);

// Crear un nuevo viaje (solo conductores con vehículo)
// POST /api/trips
router.post('/', protect, tripController.crearViaje);

// Unirse a un viaje (crear reserva)
// POST /api/trips/:id/join
router.post('/:id/join', protect, tripController.joinTrip);

// Cancelar un viaje (solo el conductor propietario)
// PUT /api/trips/:id/cancel
router.put('/:id/cancel', protect, tripController.cancelarViaje);

// Actualizar un viaje existente (solo el conductor propietario)
// PUT /api/trips/:id
router.put('/:id', protect, tripController.actualizarViaje);

// Eliminar (desactivar) un viaje (solo el conductor propietario)
// DELETE /api/trips/:id
router.delete('/:id', protect, tripController.eliminarViaje);

/**
 * Rutas públicas (no requieren autenticación)
 */

// Obtener todos los viajes disponibles con filtros opcionales
// GET /api/trips?origen=X&destino=Y&fechaSalida=Z&cupos=N&estado=activo
router.get('/', tripController.obtenerViajes);

// Obtener un viaje específico por ID
// GET /api/trips/:id
router.get('/:id', tripController.obtenerViajePorId);

module.exports = router;
