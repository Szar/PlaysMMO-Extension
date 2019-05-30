import Phaser from 'phaser';
import './style.css';
import {
	assets
} from './Assets';
import {
	map
} from './Map';
import {
	encodePoint,
	decodePoint,
	getRandomInt
} from './Utils';
import cursor from "./assets/sprites/cursor.png";
import io from 'socket.io-client';
const config = require('./Config');
export const socket = io('https://' + config.server.host + ":" + config.server.port + '/');

var game, frame_width, frame_height, map_tiles;

class Player extends Phaser.GameObjects.Sprite {
	constructor(conf) {

		super(conf.scene, conf.x, conf.y, conf.skin);
		for (var k in conf) {
			this[k] = conf[k]
		}

		this.scene = conf.scene;
		this.scene.physics.world.enable(this);
		this.scene.add.existing(this);
		this.smoothed = false;
		this.animate("stand")

		this.text = this.scene.add.bitmapText(conf.x, conf.y, config.font.default, this.name, config.font.size)

		this.chat = this.scene.add.text(conf.x, conf.y, "Lorem ipsum dolor sit amet, consectetur adipiscing elit", {
			font: "10px Arial",
			fill: '#000000',
			backgroundColor: 'rgba(255,255,255,0.9)',
			wordWrap: {
				width: 130,
				useAdvancedWrap: true
			}
		});
		this.chat.setPadding(8, 5);
		this.chat.setLineSpacing(-1);
		this.chat.setVisible(false);

		this.depth = conf.depth
		this.direction = "sw"
		this.moveText(conf.x, conf.y, conf.depth)
		this.animating = false
	}

	animate(a, l) {
		if (!this.animating) {
			l = typeof l === "undefined" ? l = true : l;
			this.anims.play(this.skin + a, l);
		}

	}
	moveText(x, y, depth) {
		this.text.setPosition(x - (this.text.width / 2), y - (config.sprite.height / 2) - (this.text.height));
		this.text.depth = depth

		this.chat.setPosition(x - (this.chat.width / 2), y - (config.sprite.height / 2) - (this.text.height + this.chat.height) - 7);
		this.chat.depth = depth
	}
	facingForward(d) {
		return d == "se" || d == "sw";
	}
	move(x, y, d, m) {
		var animation = m ? this.facingForward(d) ? 'walk' : 'back_walk' : this.facingForward(d) ? 'stand' : 'back_stand',
			c = decodePoint(x, y, frame_width, frame_height);

		this.flipX = d == "se" || d == "ne";
		this.animate(animation, true);
		this.setPosition(c.x, c.y);
		this.x = c.x
		this.y = c.y
		this.moveText(c.x, c.y, y)
		this.depth = y
		this.direction = d

	}
	jump(data) {
		var animation = this.facingForward(data.d) ? 'jump' : 'back_jump';
		this.flipX = data.d == "se" || data.d == "ne";
		this.animate(animation, false);
		this.animating = true;
		var t = this
		setTimeout(function() {
			t.animating = false
		}, 500)

	}

	update(data) {
		var d = this.direction,
			m = false,
			animation = m ? this.facingForward(d) ? 'walk' : 'back_walk' : this.facingForward(d) ? 'stand' : 'back_stand'

		this.flipX = d == "se" || d == "ne";
		this.skin = data.skin
		this.name = data.name
		this.text.setText(this.name);
		this.moveText(this.x, this.y);
		this.animate(animation, true);
	}
	message(data) {
		this.chat.setText(data.message);
		this.chat.setPosition(this.x - (this.chat.width / 2), this.y - (config.sprite.height / 2) - (this.text.height + this.chat.height) - 7);
		this.chat.setVisible(true);
		var t = this;
		clearTimeout(this.timeout);
		this.timeout = setTimeout(function() {
			t.chat.setVisible(false);
		}, config.chat.timeout)
	}

	remove() {
		this.text.setActive(false);
		this.text.setVisible(false);
		this.chat.setActive(false);
		this.chat.setVisible(false);
		this.setActive(false);
		this.setVisible(false);
	}
}

var loadAnimations = function(game) {
	for (let i = 0; i < assets["skins"]["files"].length; i++) {
		for (let j = 0; j < assets["skins"]["animations"].length; j++) {
			game.anims.create({
				key: assets["skins"]["files"][i]["name"] + assets["skins"]["animations"][j]["name"],
				frames: !assets["skins"]["animations"][j]["animated"] ? [{
					key: assets["skins"]["files"][i]["name"],
					frame: assets["skins"]["animations"][j]["frames"][0]
				}] : game.anims.generateFrameNumbers(assets["skins"]["files"][i]["name"], {
					start: assets["skins"]["animations"][j]["frames"][0],
					end: assets["skins"]["animations"][j]["frames"][1]
				}),
				frameRate: 7,
			});
		}
	}
}

var createMap = function(game) {
	var map_tiles = [
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		[5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	];

	game.blocks = game.physics.add.staticGroup();
	game.ground = game.physics.add.staticGroup();

	const tile_width = 64,
		tile_height = 32,
		width = config.game.width,
		height = config.game.height,
		ratio = map_tiles[0].length / map_tiles.length,
		n = Math.floor(width / tile_width),
		centerX = width / 2,
		centerY = ((height - (tile_height * map_tiles.length)) / 2),
		i = 0;

	for (var y = 0; y < map_tiles.length; y++) {
		for (var x = 0; x < map_tiles[y].length; x++) {
			if (map_tiles[y][x] !== null && map_tiles[y][x] >= 0) {
				var type = map.types[map_tiles[y][x]],
					group = type == 'bush1' || type == 'water' || type == 'bush2'  || x==0 || y==0 || x==map_tiles[y].length-1 || y==map_tiles.length-1 ? game.blocks : game.ground,
					tx = width > frame_width ? (x - y) * (tile_width / 2) - ((width - frame_width) / tile_width) : (x - y) * (tile_width / 2),
					ty = height > frame_height ? ((x + y) * (tile_height / 2) - ((width / ratio - frame_height) / tile_height)) : (x + y) * (tile_height / 2);

				var tile = group.create(centerX + tx, type == 'bush1' ? centerY + ty - 7 : centerY + ty, 'tileset', type),
					c = encodePoint(tile.x, tile.y - tile_height);
				tile.depth = c.y - 9999;
				if (type == 'bush1') {
					tile.setSize(64, 32).setOffset(0, 13)
					tile.depth = y == n / ratio || x == n ? c.y : tile.depth;
				}

			}
		}
	}

	game.physics.add.collider(game.cursor, game.blocks);
}


var preload = function() {
	game = this
	this.load.atlas('tileset', assets["map"]["file"], assets["map"]["json"]);
	for (let i = 0; i < assets["skins"]["files"].length; i++) {
		this.load.spritesheet(assets["skins"]["files"][i]["name"],
			assets["skins"]["files"][i]["file"], {
				frameWidth: config.sprite.width,
				frameHeight: config.sprite.height
			});
	}
	for (let i = 0; i < assets["fonts"].length; i++) {
		var f = assets["fonts"][i]
		this.load.bitmapFont(f["name"], f["file"], f["xml"]);
	}
	this.load.image('cursor', cursor);
	this.players = {}

}


var create = function() {
	loadAnimations(this)
	var start = decodePoint(getRandomInt(-config.game.spawn_area, config.game.spawn_area), getRandomInt(-config.game.spawn_area, config.game.spawn_area));
	//var start = decodePoint(, 0);
	this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
	this.data = {
		moving: false,
		was_moving: false,
		x: start.x,
		y: start.y,
		skin: assets["skins"]["files"][0]["name"]
	}
	this.cursor = this.physics.add.image(this.data.x, this.data.y, 'cursor')
	this.cursor.setBounce(0.5);
	this.physics.world.enable(this.cursor);
	this.cursor.setCollideWorldBounds(true)
	this.cursor.setSize(config.sprite.hitbox.width, config.sprite.hitbox.height)
	this.cursor.setOffset((config.sprite.width - config.sprite.hitbox.width) / 2, config.sprite.height - config.sprite.hitbox.height)
	this.scene = this
	createMap(this);
	this.cameras.main.startFollow(this.cursor);

	var data = this.data,
		c = encodePoint(this.data.x, this.data.y);
	data.x = c.x
	data.y = c.y
	socket.emit('connected', data);


}

var update = function() {
	var cursors = this.input.keyboard.createCursorKeys(),
		update = false,
		moving = true,
		speed = cursors.shift.isDown ? config.game.speed * config.game.speed_multiplier : config.game.speed;

	if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
		socket.emit('jump');
	}
	if (cursors.left.isDown || cursors.right.isDown || cursors.up.isDown || cursors.down.isDown) {
		if (cursors.left.isDown) {
			this.data.x = -1
			this.data.y = -1
			this.data.d = "nw"

		} else if (cursors.right.isDown) {
			this.data.x = 1
			this.data.y = 1
			this.data.d = "se"

		}
		if (cursors.up.isDown) {
			this.data.x = 1
			this.data.y = -1
			this.data.d = "ne"

		} else if (cursors.down.isDown) {
			this.data.x = -1
			this.data.y = 1
			this.data.d = "sw"
		}
	} else {
		this.data.x = 0
		this.data.y = 0
		moving = false;
	}

	if (moving) {
		this.data.moving = true
		this.data.was_moving = this.data.moving
		this.cursor.body.velocity.x = this.data.x * speed;
		this.cursor.body.velocity.y = this.data.y * speed * 0.5;
		update = true
	} else {
		if (this.data.was_moving) {
			this.data.moving = false
			this.data.was_moving = this.data.moving
			update = true
		}
		this.cursor.body.velocity.y = 0;
		this.cursor.body.velocity.x = 0;
	}
	if (update) {
		var data = this.data,
			c = encodePoint(this.cursor.x, this.cursor.y);
		data.x = c.x
		data.y = c.y
		socket.emit('move', data);

	}


}

const MmoGame = function() {
	var t = this
	this.resize = function(w, h) {
		frame_width = w
		frame_height = h
		if (typeof game !== "undefined") {
			game.physics.world.setBounds(0, 0, frame_width, frame_height, true, true, true, true);
			game.cameras.main.setBounds(0, 0, frame_width, frame_height);
			//for (let i = 0; i < game.players; i++) {
			//	move(data["players"][i])
			//}
		}

	}
	this.init = function(w, h) {
		frame_width = w
		frame_height = h
		var scale = frame_width / config.game.width
		new Phaser.Game({
			type: Phaser.AUTO,
			width: config.game.width,
			height: config.game.height,
			parent: 'playsmmo',
			pixelArt: true,
			transparent: true,
			zoom: scale,
			physics: {
				default: 'arcade',
				arcade: {
					//debug: true
				}
			},
			scene: {
				preload: preload,
				create: create,
				update: update
			}
		});
		var join = function(player) {
			if (!game.players.hasOwnProperty(player["id"])) {
				var c = decodePoint(player.x, player.y);
				game.players[player["id"]] = new Player({
					scene: game,
					skin: player.skin,
					x: c.x,
					y: c.y,
					name: player.name,
					depth: player.y
				})
			}
	
		}
		socket.on("joined", function(data) {
			join(data)
		})
		socket.on("message", function(player) {
			if (game.players.hasOwnProperty(player["id"])) {
				//console.log("=== message ===");
				//console.log(player);
				game.players[player["id"]].message(player)
			}
		})
		socket.on("update", function(player) {
	
			if (game.players.hasOwnProperty(player["id"])) {
				//console.log("=== Update ===");
				//console.log(player);
				game.players[player["id"]].update(player)
			}
		})
		socket.on("jump", function(player) {
			if (game.players.hasOwnProperty(player["id"])) {
				game.players[player["id"]].jump(player)
			}
		})
		socket.on("connected", function(data) {
			game.data.id = data["id"]
			//console.log("=== Players ===");
			//console.log(data["players"]);
			for (let i = 0; i < data["players"].length; i++) {
	
				join(data["players"][i])
			}
		});
		socket.on('move', function(data) {
			if (game.players.hasOwnProperty(data["id"])) {
				//console.log("=== Move ===");
				//console.log(data)
				game.players[data["id"]].move(data.x, data.y, data.d, data.moving)
			}
		});
	
		socket.on('remove', function(player) {
			if (game.players.hasOwnProperty(player["id"])) {
				game.players[player["id"]].remove();
				delete game.players[player["id"]];
			}
		});

	}
	
	socket.on("map", function(data) {
		console.log("maptiles")
		//map_tiles = data
	})
	

}



export const Mmo = new MmoGame();