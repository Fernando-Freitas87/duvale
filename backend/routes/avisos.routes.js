const express = require("express");
const router = express.Router();
const avisosController = require("../controllers/avisos.controller");

// Rotas para avisos
router.get("/mensalidades/atraso", avisosController.getMensalidadesAtraso);
router.get("/contratos/vencimentos", avisosController.getContratosVencimentos);
router.post("/contratos", avisosController.addNovoContrato);
router.post("/caixa", avisosController.addMovimentacaoCaixa);

module.exports = router;