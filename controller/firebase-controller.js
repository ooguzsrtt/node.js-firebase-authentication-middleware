const e = require("express");
const firebaseService = require("../service/firebase-service");
const jwt = require("jsonwebtoken");
const Helper = require("./helpers");
helper = new Helper();

require("dotenv").config();

exports.searchToken = async function (req, res) {
	reqIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

	if (helper.isValidIPAddress(reqIp) == false) {
		if (res.headersSent == false) {
			res.status(400).send({
				Message: "Bad Request",
				Code: 392,
				Description: "IP is not valid",
			});
		}
	}
	reqIp = helper.sanitizeInput(reqIp);
	if (reqIp == undefined) {
		if (res.headersSent == false) {
			res.status(400).send({
				Message: "Bad Request",
				Code: 393,
				Description: "IP is undefined",
			});
		}
	}

	deleted = await firebaseService.deleteOldTokens();
	if (deleted == false) {
		if (res.headersSent == false) {
			res.status(500).send({
				Message: "Internal Server Error",
				Code: 380,
				Description: "Error while deleting token",
			});
		}
	}

	firebaseService.read(reqIp).then((response) => {
		if (response == undefined) {
			const token = helper.createToken(reqIp);
			let write = firebaseService.write(reqIp, {
				ip: reqIp,
				limit: process.env.TOKEN_LIMIT,
				token: token,
				timestamp: new Date(),
			});

			if (write == undefined) {
				if (res.headersSent == false) {
					res.status(500).send({
						Message: "Internal Server Error",
						Code: 381,
						Description: "Error while writing token",
					});
				}
			} else {
				const token = helper.createToken(reqIp);
				if (res.headersSent == false) {
					res.set("X-RateLimit-Remaining", process.env.TOKEN_LIMIT);
					res.set("X-Auth-Token", token);
					res.status(200).send({
						Message: "OK",
						Code: 100,
					});
				}
			}
		} else {
			jwt.verify(
				response.token,
				process.env.JWT_SECRET,
				function (err, decoded) {
					if (err) {
						if (res.headersSent == false) {
							res.status(401).send({
								Message: "Unauthorized",
								Code: 309,
								Description: "Token is not valid",
							});
						}
					}
				}
			);
			if (response.limit <= 0) {
				if (res.headersSent == false) {
					res.status(401).send({
						Message: "Unauthorized",
						Code: 310,
						Description: "Token limit exceeded",
					});
				}
			} else {
				if (res.headersSent == false) {
					firebaseService.update(reqIp, { limit: response.limit - 1 });
					res.set("X-RateLimit-Remaining", response.limit - 1);
					res.set("X-Auth-Token", response.token);
					res.status(200).send({
						Message: "OK",
						Code: 100,
					});
				}
			}
		}
	});
};
