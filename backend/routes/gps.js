const router = require('express').Router();
const c = require('../controllers/gpsController');
const { verificarToken } = require('../middleware/auth');
router.get('/', verificarToken, c.obtenerUbicaciones);
router.post('/:unidad_id', c.actualizarUbicacion);
router.get('/:unidad_id/historial', verificarToken, c.historial);
module.exports = router;
