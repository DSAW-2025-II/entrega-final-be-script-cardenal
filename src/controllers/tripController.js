const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Booking = require('../models/Booking');

/**
 * Crear un nuevo viaje
 * POST /api/trips
 * Requiere autenticación y ser conductor con vehículo registrado
 */
exports.crearViaje = async (req, res) => {
  try {
    const conductorId = req.user._id;

    // Verificar que el usuario sea conductor con vehículo
    const vehiculo = await Vehicle.findOne({ conductorId, activo: true });

    if (!vehiculo) {
      return res.status(403).json({
        success: false,
        message: 'Debes tener un vehículo registrado para crear viajes'
      });
    }

    // Soportar ambos formatos (frontend y estándar)
    const {
      // Formato frontend
      origen,
      destino,
      hora,
      asientosDisponibles,
      precio,
      ruta,
      estado,
      // Formato backend estándar (opcional)
      puntoInicio,
      puntoFinal,
      fechaSalida,
      horaSalida,
      cuposDisponibles,
      tarifaPorPasajero
    } = req.body;

    // Mapear campos del frontend al backend
    const puntoInicioFinal = origen || puntoInicio;
    const puntoFinalFinal = destino || puntoFinal;
    const horaSalidaFinal = hora || horaSalida;
    const cuposFinal = asientosDisponibles || cuposDisponibles || vehiculo.capacidad;
    const tarifaFinal = precio || tarifaPorPasajero;
    const fechaSalidaFinal = fechaSalida || new Date(); // Si no se envía fecha, usar hoy

    // Validaciones básicas
    if (!puntoInicioFinal || !puntoFinalFinal || !horaSalidaFinal || !tarifaFinal) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben estar completos (origen, destino, hora, precio)'
      });
    }

    // Validar que cuposDisponibles no exceda la capacidad del vehículo
    if (cuposFinal > vehiculo.capacidad) {
      return res.status(400).json({
        success: false,
        message: `Los cupos disponibles no pueden exceder la capacidad del vehículo (${vehiculo.capacidad})`
      });
    }

    // Crear el viaje
    const nuevoViaje = new Trip({
      conductorId,
      vehiculoId: vehiculo._id,
      puntoInicio: puntoInicioFinal,
      puntoFinal: puntoFinalFinal,
      ruta,
      fechaSalida: fechaSalidaFinal,
      horaSalida: horaSalidaFinal,
      cuposDisponibles: cuposFinal,
      cuposTotales: cuposFinal,
      tarifaPorPasajero: tarifaFinal,
      estado: estado === 'activo' ? 'disponible' : (estado || 'disponible')
    });

    await nuevoViaje.save();

    // Populate para devolver información completa
    await nuevoViaje.populate([
      { path: 'conductorId', select: 'nombre apellido foto telefono' },
      { path: 'vehiculoId', select: 'placa marca modelo capacidad fotoVehiculo' }
    ]);

    // Formatear respuesta para el frontend
    const viajeFormateado = {
      _id: nuevoViaje._id,
      origen: nuevoViaje.puntoInicio,
      destino: nuevoViaje.puntoFinal,
      ruta: nuevoViaje.ruta,
      hora: nuevoViaje.horaSalida,
      asientosDisponibles: nuevoViaje.cuposDisponibles,
      asientosTotales: nuevoViaje.cuposTotales,
      precio: nuevoViaje.tarifaPorPasajero,
      estado: nuevoViaje.estado,
      conductor: nuevoViaje.conductorId,
      vehiculo: nuevoViaje.vehiculoId
    };

    res.status(201).json({
      success: true,
      message: 'Viaje creado exitosamente',
      data: {
        trip: viajeFormateado
      }
    });

  } catch (error) {
    console.error('Error al crear viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el viaje',
      error: error.message
    });
  }
};

/**
 * Obtener todos los viajes disponibles
 * GET /api/trips
 * Público - con filtros opcionales
 */
exports.obtenerViajes = async (req, res) => {
  try {
    const {
      // Soportar ambos formatos
      origen,
      destino,
      cupos,
      estado,
      puntoInicio,
      puntoFinal,
      fechaSalida,
      cuposMinimos
    } = req.query;

    // Construir query de filtros
    const filtros = { activo: true };

    // Mapear estado: 'activo' del frontend a 'disponible' del backend
    if (estado) {
      filtros.estado = estado === 'activo' ? 'disponible' : estado;
    } else {
      filtros.estado = 'disponible'; // Por defecto mostrar solo disponibles
    }

    // Soportar ambos nombres de campos
    if (origen || puntoInicio) {
      filtros.puntoInicio = { $regex: origen || puntoInicio, $options: 'i' };
    }

    if (destino || puntoFinal) {
      filtros.puntoFinal = { $regex: destino || puntoFinal, $options: 'i' };
    }

    if (fechaSalida) {
      // Buscar viajes en la fecha especificada
      const fecha = new Date(fechaSalida);
      const fechaInicio = new Date(fecha.setHours(0, 0, 0, 0));
      const fechaFin = new Date(fecha.setHours(23, 59, 59, 999));

      filtros.fechaSalida = {
        $gte: fechaInicio,
        $lte: fechaFin
      };
    }

    if (cupos || cuposMinimos) {
      filtros.cuposDisponibles = { $gte: parseInt(cupos || cuposMinimos) };
    }

    // Obtener viajes con información del conductor y vehículo
    const viajes = await Trip.find(filtros)
      .populate('conductorId', 'nombre apellido foto telefono')
      .populate('vehiculoId', 'placa marca modelo capacidad fotoVehiculo')
      .sort({ fechaSalida: 1, horaSalida: 1 });

    // Formatear viajes para el frontend
    const viajesFormateados = viajes.map(viaje => ({
      _id: viaje._id,
      origen: viaje.puntoInicio,
      destino: viaje.puntoFinal,
      ruta: viaje.ruta,
      hora: viaje.horaSalida,
      asientosDisponibles: viaje.cuposDisponibles,
      asientosTotales: viaje.cuposTotales,
      precio: viaje.tarifaPorPasajero,
      estado: viaje.estado === 'disponible' ? 'activo' : viaje.estado,
      conductor: viaje.conductorId,
      vehiculo: viaje.vehiculoId
    }));

    res.json({
      success: true,
      cantidad: viajesFormateados.length,
      data: {
        trips: viajesFormateados
      }
    });

  } catch (error) {
    console.error('Error al obtener viajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los viajes',
      error: error.message
    });
  }
};

/**
 * Obtener un viaje específico por ID
 * GET /api/trips/:id
 * Público
 */
exports.obtenerViajePorId = async (req, res) => {
  try {
    const { id } = req.params;

    const viaje = await Trip.findOne({ _id: id, activo: true })
      .populate('conductorId', 'nombre apellido foto telefono')
      .populate('vehiculoId', 'placa marca modelo capacidad fotoVehiculo');

    if (!viaje) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    res.json({
      success: true,
      viaje
    });

  } catch (error) {
    console.error('Error al obtener viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el viaje',
      error: error.message
    });
  }
};

/**
 * Obtener los viajes creados por el conductor autenticado
 * GET /api/trips/my-trips
 * Requiere autenticación
 */
exports.obtenerMisViajes = async (req, res) => {
  try {
    const conductorId = req.user._id;

    const viajes = await Trip.find({ conductorId, activo: true })
      .populate('vehiculoId', 'placa marca modelo capacidad fotoVehiculo')
      .sort({ fechaSalida: -1 });

    // Para cada viaje, obtener las reservas
    const viajesConReservas = await Promise.all(
      viajes.map(async (viaje) => {
        const reservas = await Booking.find({ tripId: viaje._id, activo: true })
          .populate('pasajeroId', 'nombre apellido foto telefono')
          .select('cuposReservados puntoRecogida estado precioTotal');

        // Formatear para el frontend
        return {
          _id: viaje._id,
          origen: viaje.puntoInicio,
          destino: viaje.puntoFinal,
          ruta: viaje.ruta,
          hora: viaje.horaSalida,
          asientosDisponibles: viaje.cuposDisponibles,
          asientosTotales: viaje.cuposTotales,
          precio: viaje.tarifaPorPasajero,
          estado: viaje.estado === 'disponible' ? 'activo' : viaje.estado,
          vehiculo: viaje.vehiculoId,
          reservas
        };
      })
    );

    res.json({
      success: true,
      cantidad: viajesConReservas.length,
      data: {
        trips: viajesConReservas
      }
    });

  } catch (error) {
    console.error('Error al obtener mis viajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus viajes',
      error: error.message
    });
  }
};

/**
 * Actualizar un viaje existente
 * PUT /api/trips/:id
 * Requiere autenticación y ser el conductor del viaje
 */
exports.actualizarViaje = async (req, res) => {
  try {
    const { id } = req.params;
    const conductorId = req.user._id;

    // Buscar el viaje
    const viaje = await Trip.findOne({ _id: id, conductorId, activo: true });

    if (!viaje) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado o no tienes permiso para modificarlo'
      });
    }

    // Validar que el viaje no esté en curso o completado
    if (viaje.estado === 'en_curso' || viaje.estado === 'completado') {
      return res.status(400).json({
        success: false,
        message: 'No puedes modificar un viaje que ya está en curso o completado'
      });
    }

    const {
      puntoInicio,
      puntoFinal,
      ruta,
      fechaSalida,
      horaSalida,
      cuposDisponibles,
      tarifaPorPasajero,
      estado
    } = req.body;

    // Actualizar solo los campos proporcionados
    if (puntoInicio) viaje.puntoInicio = puntoInicio;
    if (puntoFinal) viaje.puntoFinal = puntoFinal;
    if (ruta !== undefined) viaje.ruta = ruta;
    if (fechaSalida) viaje.fechaSalida = fechaSalida;
    if (horaSalida) viaje.horaSalida = horaSalida;
    if (tarifaPorPasajero) viaje.tarifaPorPasajero = tarifaPorPasajero;
    if (estado) viaje.estado = estado;

    // Si se actualizan los cupos, validar
    if (cuposDisponibles !== undefined) {
      const cuposReservados = viaje.cuposTotales - viaje.cuposDisponibles;
      const nuevosTotales = cuposDisponibles + cuposReservados;

      const vehiculo = await Vehicle.findById(viaje.vehiculoId);
      if (nuevosTotales > vehiculo.capacidad) {
        return res.status(400).json({
          success: false,
          message: 'Los cupos totales no pueden exceder la capacidad del vehículo'
        });
      }

      viaje.cuposDisponibles = cuposDisponibles;
      viaje.cuposTotales = nuevosTotales;
    }

    await viaje.save();

    await viaje.populate([
      { path: 'conductorId', select: 'nombre apellido foto telefono' },
      { path: 'vehiculoId', select: 'placa marca modelo capacidad fotoVehiculo' }
    ]);

    res.json({
      success: true,
      message: 'Viaje actualizado exitosamente',
      viaje
    });

  } catch (error) {
    console.error('Error al actualizar viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el viaje',
      error: error.message
    });
  }
};

/**
 * Eliminar (desactivar) un viaje
 * DELETE /api/trips/:id
 * Requiere autenticación y ser el conductor del viaje
 */
exports.eliminarViaje = async (req, res) => {
  try {
    const { id } = req.params;
    const conductorId = req.user._id;

    const viaje = await Trip.findOne({ _id: id, conductorId, activo: true });

    if (!viaje) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado o no tienes permiso para eliminarlo'
      });
    }

    // Verificar si hay reservas activas
    const reservasActivas = await Booking.countDocuments({
      tripId: id,
      activo: true,
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    if (reservasActivas > 0) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar un viaje con reservas activas. Cancela las reservas primero.'
      });
    }

    // Desactivar el viaje (soft delete)
    viaje.activo = false;
    viaje.estado = 'cancelado';
    await viaje.save();

    res.json({
      success: true,
      message: 'Viaje eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el viaje',
      error: error.message
    });
  }
};

/**
 * Cancelar un viaje
 * PUT /api/trips/:id/cancel
 * Requiere autenticación y ser el conductor del viaje
 */
exports.cancelarViaje = async (req, res) => {
  try {
    const { id } = req.params;
    const conductorId = req.user._id;

    const viaje = await Trip.findOne({ _id: id, conductorId, activo: true });

    if (!viaje) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    if (viaje.estado === 'cancelado' || viaje.estado === 'completado') {
      return res.status(400).json({
        success: false,
        message: 'El viaje ya está cancelado o completado'
      });
    }

    // Cancelar el viaje
    viaje.estado = 'cancelado';
    await viaje.save();

    // Cancelar todas las reservas asociadas
    await Booking.updateMany(
      { tripId: id, activo: true },
      { estado: 'cancelada' }
    );

    res.json({
      success: true,
      message: 'Viaje cancelado exitosamente. Se han cancelado todas las reservas asociadas.'
    });

  } catch (error) {
    console.error('Error al cancelar viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar el viaje',
      error: error.message
    });
  }
};

/**
 * Unirse a un viaje (crear reserva)
 * POST /api/trips/:id/join
 * Requiere autenticación
 */
exports.joinTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const pasajeroId = req.user._id;
    const { numCupos, pickupPoints } = req.body;

    // Validaciones básicas
    if (!numCupos || numCupos < 1) {
      return res.status(400).json({
        success: false,
        message: 'Debes seleccionar al menos un cupo'
      });
    }

    if (!pickupPoints || pickupPoints.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debes seleccionar los puntos de recogida'
      });
    }

    // Buscar el viaje
    const viaje = await Trip.findOne({ _id: id, activo: true })
      .populate('conductorId', 'nombre apellido');

    if (!viaje) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    // Verificar que el viaje esté disponible
    if (viaje.estado !== 'disponible') {
      return res.status(400).json({
        success: false,
        message: 'Este viaje no está disponible'
      });
    }

    // Verificar que no sea el conductor del viaje
    if (viaje.conductorId._id.toString() === pasajeroId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No puedes reservar tu propio viaje'
      });
    }

    // Verificar que haya cupos suficientes
    if (viaje.cuposDisponibles < numCupos) {
      return res.status(400).json({
        success: false,
        message: `Solo hay ${viaje.cuposDisponibles} cupos disponibles`
      });
    }

    // Verificar que el pasajero no tenga ya una reserva para este viaje
    const reservaExistente = await Booking.findOne({
      tripId: id,
      pasajeroId,
      activo: true,
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    if (reservaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una reserva para este viaje'
      });
    }

    // Calcular precio total
    const precioTotal = viaje.tarifaPorPasajero * numCupos;

    // Crear la reserva con los puntos de recogida
    const puntoRecogida = pickupPoints.map(p => p.puntoNombre).join(', ');

    const nuevaReserva = new Booking({
      tripId: id,
      pasajeroId,
      cuposReservados: numCupos,
      puntoRecogida,
      estado: 'pendiente',
      precioTotal
    });

    await nuevaReserva.save();

    // Actualizar cupos disponibles del viaje
    viaje.cuposDisponibles -= numCupos;

    // Si no quedan cupos, cambiar estado a 'lleno'
    if (viaje.cuposDisponibles === 0) {
      viaje.estado = 'lleno';
    }

    await viaje.save();

    // Populate la reserva para devolver información completa
    await nuevaReserva.populate('pasajeroId', 'nombre apellido foto telefono');

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: {
        booking: nuevaReserva,
        viaje: {
          _id: viaje._id,
          origen: viaje.puntoInicio,
          destino: viaje.puntoFinal,
          hora: viaje.horaSalida,
          asientosDisponibles: viaje.cuposDisponibles
        }
      }
    });

  } catch (error) {
    console.error('Error al unirse al viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la reserva',
      error: error.message
    });
  }
};
