const { verificarToken } = require('../utils/jwtUtils');
const User = require('../models/User');

/**
 * Middleware para proteger rutas - Verifica JWT
 */
const protegerRuta = async (req, res, next) => {
  try {
    // 1. Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token no proporcionado'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // 2. Verificar token
    const decoded = verificarToken(token);

    // 3. Buscar usuario y verificar que el token esté en su lista de tokens activos
    const user = await User.findOne({
      _id: decoded.id,
      'tokens.token': token
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Usuario no encontrado o sesión expirada'
      });
    }

    // 4. Verificar que el usuario esté activo
    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    // 5. Agregar usuario y token a la request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Token inválido o expirado',
      error: error.message
    });
  }
};


module.exports = {
  protegerRuta,
  protect: protegerRuta
  // verificarRol // Comentado - ya no se exporta
};