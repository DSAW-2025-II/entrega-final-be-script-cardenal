const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Datos básicos
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true
  },
  idUniversidad: {
    type: String,
    required: [true, 'El ID de universidad es requerido'],
    unique: true,
    trim: true
  },
  correo: {
    type: String,
    required: [true, 'El correo es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un correo válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No devolver la contraseña por defecto en las consultas
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true
  },
  foto: {
    type: String,
    default: null
  },
  
  // Rol del usuario (simplificado - ya no se usa para restricciones)
  rol: {
    type: String,
    default: 'usuario'
  },

  // Indica si el usuario tiene un vehículo registrado
  conductorRegistrado: {
    type: Boolean,
    default: false
  },
  
  // Estado de la cuenta
  activo: {
    type: Boolean,
    default: true
  },
  
  // Tokens de sesión activos (para logout)
  tokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 días en segundos
    }
  }]
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// MIDDLEWARES DEL SCHEMA 

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

//  MÉTODOS DEL SCHEMA 

// Método para comparar contraseñas
userSchema.methods.compararPassword = async function(passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// Método para obtener datos públicos del usuario (sin contraseña)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.tokens;
  delete user.__v;
  return user;
};

// Método para agregar token a la lista de tokens activos
userSchema.methods.agregarToken = async function(token) {
  this.tokens = this.tokens.concat({ token });
  await this.save();
};

// Método para remover un token específico (logout)
userSchema.methods.removerToken = async function(token) {
  this.tokens = this.tokens.filter(t => t.token !== token);
  await this.save();
};

// Método para remover todos los tokens (logout de todas las sesiones)
userSchema.methods.removerTodosTokens = async function() {
  this.tokens = [];
  await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;