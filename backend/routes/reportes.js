const router = require('express').Router();
const c = require('../controllers/reportesController');
const { verificarToken } = require('../middleware/auth');
router.use(verificarToken);
router.get('/estadisticas', c.estadisticasGenerales);
router.get('/pdf/:tipo', c.exportarPDF);
router.get('/excel/:tipo', c.exportarExcel);
module.exports = router;
