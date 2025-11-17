const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  // Relación con el usuario conductor
  conductorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El conductor es requerido'],
    unique: true  // Un conductor solo puede tener un vehículo
  },
  
  // Datos del vehículo
  placa: {
    type: String,
    required: [true, 'La placa es requerida'],
    unique: true,
    uppercase: true,
    trim: true
  },
  
  marca: {
    type: String,
    trim: true,
    default: ''
  },
  
  modelo: {
    type: String,
    required: [true, 'El modelo es requerido'],
    trim: true
  },
  
  capacidad: {
    type: Number,
    required: [true, 'La capacidad es requerida'],
    min: [1, 'La capacidad mínima es 1'],
    max: [5, 'La capacidad máxima es 5']
  },
  
  // URLs de las imágenes en Cloudinary
  fotoVehiculo: {
    type: String,
    required: [true, 'La foto del vehículo es requerida']
  },
  
  fotoSOAT: {
    type: String,
    required: [true, 'La foto del SOAT es requerida']
  },
  
  // Estado del vehículo
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;