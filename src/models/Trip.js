const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  // Referencias
  conductorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El conductor es requerido']
  },
  vehiculoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'El vehículo es requerido']
  },
  
  // Información del viaje
  puntoInicio: {
    type: String,
    required: [true, 'El punto de inicio es requerido'],
    trim: true
  },
  puntoFinal: {
    type: String,
    required: [true, 'El punto final es requerido'],
    trim: true
  },
  ruta: {
    type: String,
    trim: true
  },
  
  // Horario
  fechaSalida: {
    type: Date,
    required: [true, 'La fecha de salida es requerida']
  },
  horaSalida: {
    type: String,
    required: [true, 'La hora de salida es requerida']
  },
  
  // Capacidad
  cuposDisponibles: {
    type: Number,
    required: [true, 'Los cupos disponibles son requeridos'],
    min: [0, 'Los cupos disponibles no pueden ser negativos']
  },
  cuposTotales: {
    type: Number,
    required: [true, 'Los cupos totales son requeridos'],
    min: [1, 'Debe haber al menos 1 cupo']
  },
  
  // Precio
  tarifaPorPasajero: {
    type: Number,
    required: [true, 'La tarifa por pasajero es requerida'],
    min: [0, 'La tarifa no puede ser negativa']
  },
  
  // Estado
  estado: {
    type: String,
    enum: {
      values: ['disponible','lleno', 'en_curso', 'completado', 'cancelado'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'disponible'
  },
  
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar búsquedas
tripSchema.index({ conductorId: 1 });
tripSchema.index({ estado: 1, fechaSalida: 1 });
tripSchema.index({ puntoInicio: 1, puntoFinal: 1 });

// Validación: La fecha no puede ser en el pasado
tripSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('fechaSalida')) {
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);
    
    const fechaViaje = new Date(this.fechaSalida);
    fechaViaje.setHours(0, 0, 0, 0);
    
    if (fechaViaje < ahora) {
      return next(new Error('La fecha de salida no puede ser en el pasado'));
    }
  }
  next();
});

// Validación: Cupos disponibles no pueden exceder cupos totales
tripSchema.pre('save', function(next) {
  if (this.cuposDisponibles > this.cuposTotales) {
    return next(new Error('Los cupos disponibles no pueden exceder los cupos totales'));
  }
  next();
});

// Virtual para verificar si el viaje está lleno
tripSchema.virtual('estaLleno').get(function() {
  return this.cuposDisponibles === 0;
});

// Virtual para obtener las reservas de este viaje
tripSchema.virtual('reservas', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'tripId'
});

// Configurar virtuals en JSON
tripSchema.set('toJSON', { virtuals: true });
tripSchema.set('toObject', { virtuals: true });

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;