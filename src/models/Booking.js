const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Referencias
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'El viaje es requerido']
  },
  pasajeroId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El pasajero es requerido']
  },
  
  // Detalles de la reserva
  cuposReservados: {
    type: Number,
    required: [true, 'La cantidad de cupos es requerida'],
    min: [1, 'Debe reservar al menos 1 cupo']
  },
  puntoRecogida: {
    type: String,
    required: [true, 'El punto de recogida es requerido'],
    trim: true
  },
  
  // Estado
  estado: {
    type: String,
    enum: {
      values: ['pendiente', 'confirmada', 'cancelada', 'completada'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'pendiente'
  },
  
  // Precio
  precioTotal: {
    type: Number,
    required: [true, 'El precio total es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar búsquedas
bookingSchema.index({ tripId: 1 });
bookingSchema.index({ pasajeroId: 1 });
bookingSchema.index({ tripId: 1, pasajeroId: 1 }, { unique: true }); // Evita reservas duplicadas

// Middleware pre-save: Calcular precio total automáticamente
bookingSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Trip = mongoose.model('Trip');
      const trip = await Trip.findById(this.tripId);
      
      if (!trip) {
        return next(new Error('El viaje no existe'));
      }
      
      // Calcular precio total
      this.precioTotal = trip.tarifaPorPasajero * this.cuposReservados;
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Método para verificar si la reserva puede ser cancelada
bookingSchema.methods.puedeSerCancelada = function() {
  return this.estado === 'pendiente' || this.estado === 'confirmada';
};

// Método estático para verificar si un pasajero ya tiene una reserva en un viaje
bookingSchema.statics.existeReserva = async function(tripId, pasajeroId) {
  const reserva = await this.findOne({
    tripId,
    pasajeroId,
    estado: { $in: ['pendiente', 'confirmada'] }
  });
  return !!reserva;
};

// Virtual para obtener información resumida
bookingSchema.virtual('resumen').get(function() {
  return {
    cupos: this.cuposReservados,
    total: this.precioTotal,
    estado: this.estado
  };
});

// Configurar virtuals en JSON
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;