const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento en memoria (temporal)
const storage = multer.memoryStorage();

// Filtro para solo aceptar imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // Máximo 5MB por archivo
  },
  fileFilter: fileFilter
});

module.exports = upload;