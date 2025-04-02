const e = require("express");

const firebaseService = require("../service/firebase-service");

const jwt = require("jsonwebtoken");

const Helper = require("../controller/helpers");
helper = new Helper();

require("dotenv").config();

exports.verifyToken = async function (req, res, next) {
	firebaseService.deleteOldTokens();
	reqToken = req.headers["x-auth-token"];
	reqIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

	if (reqToken == undefined || reqIp == undefined) {
		res.status(400).send({
			Message: "Bad Request",
			Code: 391,
			Description: "Token, IP or both are undefined",
		});
	} else {
		reqIp = helper.sanitizeInput(reqIp);
		reqToken = helper.sanitizeInput(reqToken);
	}

	if (helper.isValidIPAddress(reqIp) == false) {
		if (res.headersSent == false) {
			res.status(400).send({
				Message: "Bad Request",
				Code: 390,
				Description: "IP is not valid",
			});
		}
	}

	jwt.verify(reqToken, process.env.JWT_SECRET, function (err, decoded) {
		if (err) {
			if (res.headersSent == false) {
				res.status(401).send({
					Message: "Unauthorized",
					Code: 301,
					Description: "Token is not valid",
				});
			}
		}
	});

	firebaseService.read(reqIp).then((response) => {
		if (response == undefined) {
			if (res.headersSent == false) {
				res.status(401).send({
					Message: "Unauthorized",
					Code: 303,
					Description: "Token not found",
				});
			}
		} else {
			if (reqToken != response.token) {
				if (res.headersSent == false) {
					res.status(401).send({
						Message: "Unauthorized",
						Code: 304,
						Description: "Request token is not valid",
					});
				}
			} else if (reqIp != response.ip) {
				if (res.headersSent == false) {
					res.status(401).send({
						Message: "Unauthorized",
						Code: 305,
						Description: "IP is not valid",
					});
				}
			} else if (response.timestamp > new Date()) {
				if (res.headersSent == false) {
					res.status(401).send({
						Message: "Unauthorized",
						Code: 306,
						Description: "Token is not valid",
					});
				}
			} else if (response.limit <= 0) {
				if (res.headersSent == false) {
					res.status(401).send({
						Message: "Unauthorized",
						Code: 307,
						Description: "Token limit is expired",
					});
				}
			} else if (response.limit > process.env.TOKEN_LIMIT) {
				if (res.headersSent == false) {
					res.status(401).send({
						Message: "Unauthorized",
						Code: 308,
						Description: "Token limit is not valid",
					});
				}
			} else {
				if (res.headersSent == false) {
					firebaseService.update(reqIp, {
						limit: response.limit - 1,
					});
					res.set("X-Auth-Token", reqToken);
					res.set("X-RateLimit-Remaining", response.limit - 1);
					res.set("X-RateLimit-Proceeding", response.limit);
					next();
				}
			}
		}
	});
};
