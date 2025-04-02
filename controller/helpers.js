const jwt = require("jsonwebtoken");

class Helper {
	constructor(req, res) {
		this.jwt = jwt;
		this.jsonRequest = req;
		this.jsonResponse = res;
	}

	sanitizeInput(input) {
		// Return null or undefined as is
		if (input === null) {
			return null;
		} else if (input === undefined) {
			return undefined;
		}

		// Only process strings
		if (typeof input !== "string") {
			return input;
		}

		// Trim whitespace
		const trimmed = input.trim();

		// Check if input is an IP address (IPv4 or IPv6)
		const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
		const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}:[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,4}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){0,2}[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,3}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){0,3}[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,2}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){0,4}[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:)?[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}::[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}::$/;

		// Check if input is a JWT token (three base64url-encoded strings separated by dots)
		const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

		// Only return the input if it's either a valid IP address or JWT token
		if (ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed)) {
			return trimmed; // Valid IP address
		} else if (jwtRegex.test(trimmed)) {
			// Additional validation for JWT: check that each part is valid base64url
			const parts = trimmed.split('.');
			const isValidBase64url = parts.every(part => {
				// Test if it's a valid base64url string (letters, numbers, underscore, hyphen)
				return /^[A-Za-z0-9_-]*$/.test(part);
			});

			if (isValidBase64url) {
				return trimmed; // Valid JWT token
			}
		}

		// If it's not a valid IP or JWT, return an empty string or consider throwing an error
		return "";
	}


	createToken(ip) {
		const token = this.jwt.sign(
			{
				ip: ip,
			},
			process.env.JWT_SECRET,
			{
				expiresIn: process.env.JWT_EXPIRE,
			}
		);
		return token;
	}

	isValidIPAddress(ipAddress) {
		// Handle null or undefined input
		if (ipAddress === null || ipAddress === undefined) {
			return false;
		}

		// Ensure input is a string
		if (typeof ipAddress !== "string") {
			return false;
		}

		// Trim any whitespace
		ipAddress = ipAddress.trim();

		// Regular expression pattern for IP address validation
		const ipv4Pattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;

		// Check if the provided string matches the IP address pattern
		if (!ipv4Pattern.test(ipAddress)) {
			return false;
		}

		// Split the IP address into its octets
		const octets = ipAddress.split(".");

		// Check if each octet is a valid number between 0 and 255
		for (let i = 0; i < octets.length; i++) {
			const octet = parseInt(octets[i], 10);

			// Check for invalid octet values
			if (isNaN(octet) || octet < 0 || octet > 255) {
				return false;
			}

			// Additional check for leading zeros (e.g., "01" is not valid)
			// This prevents octal interpretation in some environments
			if (octets[i].length > 1 && octets[i].charAt(0) === '0') {
				return false;
			}
		}

		return true;
	}
}
module.exports = Helper;
