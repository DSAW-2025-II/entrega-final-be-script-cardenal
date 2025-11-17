const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const User = require('../models/User');

/**
 * Obtener todas las reservas del usuario autenticado (como pasajero)
 * GET /api/bookings/my-bookings
 * Requiere autenticación
 */
exports.obtenerMisReservas = async (req, res) => {
  try {
    const pasajeroId = req.user._id;

    const reservas = await Booking.find({ pasajeroId, activo: true })
      .populate({
        path: 'tripId',
        select: 'puntoInicio puntoFinal ruta horaSalida fechaSalida tarifaPorPasajero estado conductorId vehiculoId',
        populate: [
          { path: 'conductorId', select: 'nombre apellido foto telefono' },
          { path: 'vehiculoId', select: 'placa marca modelo fotoVehiculo' }
        ]
      })
      .sort({ createdAt: -1 });

    // Formatear respuestas para el frontend
    const reservasFormateadas = reservas.map(reserva => ({
      _id: reserva._id,
      cuposReservados: reserva.cuposReservados,
      puntoRecogida: reserva.puntoRecogida,
      estado: reserva.estado,
      precioTotal: reserva.precioTotal,
      fechaReserva: reserva.createdAt,
      viaje: reserva.tripId ? {
        _id: reserva.tripId._id,
        origen: reserva.tripId.puntoInicio,
        destino: reserva.tripId.puntoFinal,
        ruta: reserva.tripId.ruta,
        hora: reserva.tripId.horaSalida,
        fecha: reserva.tripId.fechaSalida,
        precio: reserva.tripId.tarifaPorPasajero,
        estado: reserva.tripId.estado,
        conductor: reserva.tripId.conductorId,
        vehiculo: reserva.tripId.vehiculoId
      } : null
    }));

    res.json({
      success: true,
      cantidad: reservasFormateadas.length,
      data: {
        bookings: reservasFormateadas
      }
    });

  } catch (error) {
    console.error('Error al obtener mis reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus reservas',
      error: error.message
    });
  }
};

/**
 * Obtener una reserva específica por ID
 * GET /api/bookings/:id
 * Requiere autenticación
 */
exports.obtenerReservaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const reserva = await Booking.findOne({ _id: id, activo: true })
      .populate({
        path: 'tripId',
        select: 'puntoInicio puntoFinal ruta horaSalida fechaSalida tarifaPorPasajero estado conductorId vehiculoId',
        populate: [
          { path: 'conductorId', select: 'nombre apellido foto telefono' },
          { path: 'vehiculoId', select: 'placa marca modelo fotoVehiculo' }
        ]
      })
      .populate('pasajeroId', 'nombre apellido foto telefono');

    if (!reserva) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    // Verificar que el usuario sea el pasajero o el conductor del viaje
    const esPasajero = reserva.pasajeroId._id.toString() === userId.toString();
    const esConductor = reserva.tripId.conductorId._id.toString() === userId.toString();

    if (!esPasajero && !esConductor) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta reserva'
      });
    }

    // Formatear respuesta
    const reservaFormateada = {
      _id: reserva._id,
      cuposReservados: reserva.cuposReservados,
      puntoRecogida: reserva.puntoRecogida,
      estado: reserva.estado,
      precioTotal: reserva.precioTotal,
      fechaReserva: reserva.createdAt,
      pasajero: reserva.pasajeroId,
      viaje: {
        _id: reserva.tripId._id,
        origen: reserva.tripId.puntoInicio,
        destino: reserva.tripId.puntoFinal,
        ruta: reserva.tripId.ruta,
        hora: reserva.tripId.horaSalida,
        fecha: reserva.tripId.fechaSalida,
        precio: reserva.tripId.tarifaPorPasajero,
        estado: reserva.tripId.estado,
        conductor: reserva.tripId.conductorId,
        vehiculo: reserva.tripId.vehiculoId
      }
    };

    res.json({
      success: true,
      data: {
        booking: reservaFormateada
      }
    });

  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la reserva',
      error: error.message
    });
  }
};

/**
 * Obtener las reservas de un viaje específico (solo para el conductor)
 * GET /api/bookings/trip/:tripId
 * Requiere autenticación y ser el conductor del viaje
 */
exports.obtenerReservasDeViaje = async (req, res) => {
  try {
    const { tripId } = req.params;
    const conductorId = req.user._id;

    // Verificar que el viaje exista y pertenezca al conductor
    const viaje = await Trip.findOne({ _id: tripId, conductorId, activo: true });

    if (!viaje) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado o no tienes permiso para ver sus reservas'
      });
    }

    // Obtener todas las reservas del viaje
    const reservas = await Booking.find({ tripId, activo: true })
      .populate('pasajeroId', 'nombre apellido foto telefono')
      .sort({ createdAt: -1 });

    // Formatear reservas
    const reservasFormateadas = reservas.map(reserva => ({
      _id: reserva._id,
      cuposReservados: reserva.cuposReservados,
      puntoRecogida: reserva.puntoRecogida,
      estado: reserva.estado,
      precioTotal: reserva.precioTotal,
      fechaReserva: reserva.createdAt,
      pasajero: reserva.pasajeroId
    }));

    res.json({
      success: true,
      cantidad: reservasFormateadas.length,
      viaje: {
        _id: viaje._id,
        origen: viaje.puntoInicio,
        destino: viaje.puntoFinal,
        hora: viaje.horaSalida,
        cuposDisponibles: viaje.cuposDisponibles,
        cuposTotales: viaje.cuposTotales
      },
      data: {
        bookings: reservasFormateadas
      }
    });

  } catch (error) {
    console.error('Error al obtener reservas del viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las reservas del viaje',
      error: error.message
    });
  }
};

/**
 * Cancelar una reserva (como pasajero)
 * PUT /api/bookings/:id/cancel
 * Requiere autenticación y ser el pasajero de la reserva
 */
exports.cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const pasajeroId = req.user._id;

    // Buscar la reserva
    const reserva = await Booking.findOne({
      _id: id,
      pasajeroId,
      activo: true
    });

    if (!reserva) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    // Verificar que la reserva pueda ser cancelada
    if (reserva.estado === 'cancelada') {
      return res.status(400).json({
        success: false,
        message: 'Esta reserva ya está cancelada'
      });
    }

    if (reserva.estado === 'completada') {
      return res.status(400).json({
        success: false,
        message: 'No puedes cancelar una reserva completada'
      });
    }

    // Buscar el viaje para liberar los cupos
    const viaje = await Trip.findById(reserva.tripId);

    if (!viaje) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    // Cancelar la reserva
    reserva.estado = 'cancelada';
    await reserva.save();

    // Liberar los cupos en el viaje
    viaje.cuposDisponibles += reserva.cuposReservados;

    // Si el viaje estaba lleno, cambiar estado a disponible
    if (viaje.estado === 'lleno') {
      viaje.estado = 'disponible';
    }

    await viaje.save();

    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente. Los cupos han sido liberados.',
      data: {
        booking: {
          _id: reserva._id,
          estado: reserva.estado,
          cuposLiberados: reserva.cuposReservados
        },
        viaje: {
          _id: viaje._id,
          cuposDisponibles: viaje.cuposDisponibles,
          estado: viaje.estado
        }
      }
    });

  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la reserva',
      error: error.message
    });
  }
};

/**
 * Confirmar una reserva (como conductor)
 * PUT /api/bookings/:id/confirm
 * Requiere autenticación y ser el conductor del viaje
 */
exports.confirmarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const conductorId = req.user._id;

    // Buscar la reserva con el viaje
    const reserva = await Booking.findOne({ _id: id, activo: true })
      .populate('tripId');

    if (!reserva) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    // Verificar que el usuario sea el conductor del viaje
    if (reserva.tripId.conductorId.toString() !== conductorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para confirmar esta reserva'
      });
    }

    // Verificar que la reserva esté pendiente
    if (reserva.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: `Esta reserva ya está ${reserva.estado}`
      });
    }

    // Confirmar la reserva
    reserva.estado = 'confirmada';
    await reserva.save();

    await reserva.populate('pasajeroId', 'nombre apellido foto telefono');

    res.json({
      success: true,
      message: 'Reserva confirmada exitosamente',
      data: {
        booking: {
          _id: reserva._id,
          estado: reserva.estado,
          cuposReservados: reserva.cuposReservados,
          puntoRecogida: reserva.puntoRecogida,
          precioTotal: reserva.precioTotal,
          pasajero: reserva.pasajeroId
        }
      }
    });

  } catch (error) {
    console.error('Error al confirmar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al confirmar la reserva',
      error: error.message
    });
  }
};

/**
 * Completar una reserva (como conductor, cuando el pasajero llegó)
 * PUT /api/bookings/:id/complete
 * Requiere autenticación y ser el conductor del viaje
 */
exports.completarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const conductorId = req.user._id;

    // Buscar la reserva con el viaje
    const reserva = await Booking.findOne({ _id: id, activo: true })
      .populate('tripId');

    if (!reserva) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    // Verificar que el usuario sea el conductor del viaje
    if (reserva.tripId.conductorId.toString() !== conductorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para completar esta reserva'
      });
    }

    // Verificar que la reserva esté confirmada
    if (reserva.estado !== 'confirmada') {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes completar reservas confirmadas'
      });
    }

    // Completar la reserva
    reserva.estado = 'completada';
    await reserva.save();

    await reserva.populate('pasajeroId', 'nombre apellido foto telefono');

    res.json({
      success: true,
      message: 'Reserva completada exitosamente',
      data: {
        booking: {
          _id: reserva._id,
          estado: reserva.estado,
          cuposReservados: reserva.cuposReservados,
          puntoRecogida: reserva.puntoRecogida,
          precioTotal: reserva.precioTotal,
          pasajero: reserva.pasajeroId
        }
      }
    });

  } catch (error) {
    console.error('Error al completar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al completar la reserva',
      error: error.message
    });
  }
};

/**
 * Eliminar (desactivar) una reserva
 * DELETE /api/bookings/:id
 * Requiere autenticación y ser el pasajero de la reserva
 */
exports.eliminarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const pasajeroId = req.user._id;

    const reserva = await Booking.findOne({
      _id: id,
      pasajeroId,
      activo: true
    });

    if (!reserva) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    // Solo se pueden eliminar reservas canceladas o completadas
    if (reserva.estado !== 'cancelada' && reserva.estado !== 'completada') {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes eliminar reservas canceladas o completadas. Para cancelar una reserva activa, usa la opción de cancelar.'
      });
    }

    // Desactivar la reserva (soft delete)
    reserva.activo = false;
    await reserva.save();

    res.json({
      success: true,
      message: 'Reserva eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la reserva',
      error: error.message
    });
  }
};
