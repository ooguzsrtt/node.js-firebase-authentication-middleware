var router = require("express").Router();

var controllerFirebase = require("../controller/firebase-controller");

var tokenMiddleware = require("../middlewares/token-middleware");



router.post("/token", controllerFirebase.searchToken);



router.get("/", tokenMiddleware.verifyToken, (req, res, next) => {
	res.status(403).send({
		Message: "Forbidden",
		Code: 300000,
		Description: "No direct access to the root (/)",
	});
});


router.get("/test", tokenMiddleware.verifyToken, (req, res, next) => {
	res.status(200).send({
		Message: "OK",
		Code: 300001,
		Description: "Connection Established",
	});
});

module.exports = router;
