const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary configurado:');
console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || '❌ NO CONFIGURADO');
console.log('   API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Configurado' : '❌ NO CONFIGURADO');
console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Configurado' : '❌ NO CONFIGURADO');

/**
 * Subir imagen desde buffer (memoria)
 * @param {Buffer} buffer - Buffer del archivo
 * @param {String} folder - Carpeta en Cloudinary
 * @returns {Promise} - Resultado de la subida
 */
const uploadImage = (buffer, folder = 'wheels') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Error al subir imagen: ${error.message}`));
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Eliminar imagen de Cloudinary
 * @param {String} publicId - ID público de la imagen
 * @returns {Promise}
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Error al eliminar imagen: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage
};