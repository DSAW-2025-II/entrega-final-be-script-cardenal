const { body, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const manejarErroresValidacion = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Validaciones para registro
const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  
  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es requerido')
    .isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres'),
  
  body('idUniversidad')
    .trim()
    .notEmpty().withMessage('El ID de universidad es requerido'),
  
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('Debe ser un correo válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es requerido')
    .matches(/^[0-9]{10}$/).withMessage('El teléfono debe tener 10 dígitos'),
  
  body('rol')
    .optional()
    .isIn(['pasajero', 'conductor', 'ambos']).withMessage('Rol inválido'),
  
  manejarErroresValidacion
];

// Validaciones para login
const validarLogin = [
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('Debe ser un correo válido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),

  manejarErroresValidacion
];

// Validaciones para actualizar perfil
const validarActualizarPerfil = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),

  body('apellido')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres'),

  body('telefono')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/).withMessage('El teléfono debe tener 10 dígitos'),

  manejarErroresValidacion
];

// Validaciones para cambiar contraseña
const validarCambioPassword = [
  body('passwordActual')
    .notEmpty().withMessage('La contraseña actual es requerida'),

  body('passwordNuevo')
    .notEmpty().withMessage('La contraseña nueva es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),

  body('confirmarPassword')
    .notEmpty().withMessage('Debe confirmar la contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.passwordNuevo) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  manejarErroresValidacion
];

module.exports = {
  validarRegistro,
  validarLogin,
  validarActualizarPerfil,
  validarCambioPassword
};