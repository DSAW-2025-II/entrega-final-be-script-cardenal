const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * TODAS las rutas de bookings requieren autenticación
 */

/**
 * Rutas específicas (deben ir ANTES de las rutas con :id)
 */

// Obtener las reservas del usuario autenticado (como pasajero)
// GET /api/bookings/my-bookings
router.get('/my-bookings', protect, bookingController.obtenerMisReservas);

// Obtener las reservas de un viaje específico (solo conductor del viaje)
// GET /api/bookings/trip/:tripId
router.get('/trip/:tripId', protect, bookingController.obtenerReservasDeViaje);

/**
 * Rutas con :id (deben ir DESPUÉS de las rutas específicas)
 */

// Cancelar una reserva (como pasajero)
// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', protect, bookingController.cancelarReserva);

// Confirmar una reserva (como conductor del viaje)
// PUT /api/bookings/:id/confirm
router.put('/:id/confirm', protect, bookingController.confirmarReserva);

// Completar una reserva (como conductor del viaje, cuando el pasajero llegó)
// PUT /api/bookings/:id/complete
router.put('/:id/complete', protect, bookingController.completarReserva);

// Obtener una reserva específica por ID
// GET /api/bookings/:id
router.get('/:id', protect, bookingController.obtenerReservaPorId);

// Eliminar (desactivar) una reserva
// DELETE /api/bookings/:id
router.delete('/:id', protect, bookingController.eliminarReserva);

module.exports = router;
