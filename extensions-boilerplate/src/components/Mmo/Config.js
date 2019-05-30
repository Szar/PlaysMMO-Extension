var config = {
	game: {
		width: 1280,
		height: 720,
		speed: 100,
		speed_multiplier: 5,
		spawn_area: 100
	},
	sprite: {
		width: 34,
		height: 56,
		hitbox: {
			width: 20,
			height: 15
		}
	},
	font: {
		size: 9,
		default: "gem"
	},
	server: {
		host: "hennessy.co.de",
		port: 8000,
		ssl_dir:'./ssl/',
		clientid: 'ge5ik0u9iy46mbln5jg9dn1zgs9vbf',
		
	},
	chat: {
		timeout: 5000
	}
};

module.exports = config;