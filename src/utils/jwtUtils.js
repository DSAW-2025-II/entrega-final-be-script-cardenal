const jwt = require('jsonwebtoken');

/**
 * Generar un token JWT
 * @param {Object} payload - Datos a incluir en el token
 * @returns {String} - Token generado
 */
const generarToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verificar un token JWT
 * @param {String} token - Token a verificar
 * @returns {Object} - Payload decodificado
 */
const verificarToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

/**
 * Decodificar token sin verificar (útil para debugging)
 * @param {String} token - Token a decodificar
 * @returns {Object} - Payload decodificado
 */
const decodificarToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generarToken,
  verificarToken,
  decodificarToken
};