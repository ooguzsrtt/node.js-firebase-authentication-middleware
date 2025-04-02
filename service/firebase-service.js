require('dotenv').config();
const fbase = require("firebase-admin");


const PATH_TO_SERVICE_ACCOUNT = process.env.PATH_TO_SERVICE_ACCOUNT;
var serviceAccount = require(PATH_TO_SERVICE_ACCOUNT);

fbase.initializeApp({
	credential: fbase.credential.cert(serviceAccount)
});


const db = fbase.firestore();
const tokenDb = db.collection("tokens");

exports.read = async function readToken(id) {
	try {
		const userRef = tokenDb.doc(id);
		const response = await userRef.get();
		return response.data();
	} catch (error) {
		return error;
	}
};

exports.write = async function writeToken(id, data) {
	try {
		const userRef = tokenDb.doc(id);
		const response = await userRef.set(data);
		return response;
	} catch (error) {
		return error;
	}
};

exports.update = async function updateToken(id, data) {
	try {
		const userRef = tokenDb.doc(id);
		const response = await userRef.update(data);
		return response;
	} catch (error) {
		return error;
	}
};

exports.delete = async function deleteToken(id) {
	try {
		const userRef = tokenDb.doc(id);
		const response = await userRef.delete();
		return response;
	} catch (error) {
		return error;
	}
};

exports.deleteOldTokens = async function deleteOld() {
	try {
		const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

		const tokensSnapshot = await tokenDb
			.where("timestamp", "<", fifteenMinutesAgo)
			.get();

		const batch = db.batch();

		tokensSnapshot.forEach((doc) => {
			batch.delete(doc.ref);
		});

		await batch.commit();

		return true;
	} catch (error) {
		return false;
	}
};

exports.isExpried = async function isExpried(id) {
	try {
		const userRef = tokenDb.doc(id);
		const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
		const response = await userRef.get();
		if (response.data().timestamp < fifteenMinutesAgo) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		return error;
	}
};
