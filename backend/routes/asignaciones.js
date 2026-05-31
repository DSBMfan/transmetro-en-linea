const router = require('express').Router();
const c = require('../controllers/asignacionesController');
const { verificarToken } = require('../middleware/auth');
router.use(verificarToken);
router.get('/', c.listar);
router.post('/', c.crear);
router.put('/:id', c.actualizar);
router.delete('/:id', c.eliminar);
module.exports = router;
