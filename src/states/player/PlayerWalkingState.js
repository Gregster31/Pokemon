import Animation from '../../../lib/Animation.js';
import { didSucceedPercentChance } from '../../../lib/Random.js';
import State from '../../../lib/State.js';
import Opponent from '../../entities/Opponent.js';
import Player from '../../entities/Player.js';
import Direction from '../../enums/Direction.js';
import PlayerStateName from '../../enums/PlayerStateName.js';
import SoundName from '../../enums/SoundName.js';
import Input from '../../../lib/Input.js';
import { input, sounds, stateStack, timer } from '../../globals.js';
import Tile from '../../services/Tile.js';
import BattleState from '../game/BattleState.js';
import TransitionState from '../game/TransitionState.js';
import Easing from '../../../lib/Easing.js';

export default class PlayerWalkingState extends State {
	static ENCOUNTER_CHANCE = 0.1;

	/**
	 * In this state, the player can move around using the
	 * directional keys. From here, the player can go idle
	 * if no keys are being pressed.
	 *
	 * @param {Player} player
	 */
	constructor(player) {
		super();

		this.player = player;
		this.bottomLayer = this.player.map.bottomLayer;
		this.collisionLayer = this.player.map.collisionLayer;
		this.animation = {
			[Direction.Up]: new Animation([12, 13, 14, 15], 0.2),
			[Direction.Down]: new Animation([0, 1, 2, 3], 0.2),
			[Direction.Left]: new Animation([4, 5, 6, 7], 0.2),
			[Direction.Right]: new Animation([8, 9, 10, 11], 0.2),
		};

		this.isMoving = false;
	}

	update(dt) {
		this.player.currentAnimation = this.animation[this.player.direction];

		this.handleMovement();
	}

	handleMovement() {
		/**
		 * Unlike Zelda, the Player's movement in Pokemon is locked to
		 * the grid. To restrict them from moving freely, we set a flag
		 * to track if they're currently moving from one tile to another,
		 * and reject input if so.
		 */
		if (this.isMoving) {
			return;
		}

		if (
			!input.isKeyHeld(Input.KEYS.W) &&
			!input.isKeyHeld(Input.KEYS.A) &&
			!input.isKeyHeld(Input.KEYS.S) &&
			!input.isKeyHeld(Input.KEYS.D)
		) {
			this.player.changeState(PlayerStateName.Idling);
			return;
		}

		this.updateDirection();
		this.move();
	}

	updateDirection() {
		if (input.isKeyHeld(Input.KEYS.S)) {
			this.player.direction = Direction.Down;
		} else if (input.isKeyHeld(Input.KEYS.D)) {
			this.player.direction = Direction.Right;
		} else if (input.isKeyHeld(Input.KEYS.W)) {
			this.player.direction = Direction.Up;
		} else if (input.isKeyHeld(Input.KEYS.A)) {
			this.player.direction = Direction.Left;
		}
	}

	move() {
		let x = this.player.position.x;
		let y = this.player.position.y;

		switch (this.player.direction) {
			case Direction.Up:
				y--;
				break;
			case Direction.Down:
				y++;
				break;
			case Direction.Left:
				x--;
				break;
			case Direction.Right:
				x++;
				break;
		}

		if (!this.isValidMove(x, y)) {
			sounds.play(SoundName.PlayerBump);
			return;
		}

		this.player.position.x = x;
		this.player.position.y = y;

		this.tweenMovement(x, y);
	}

	tweenMovement(x, y) {
		this.isMoving = true;

		timer.tween(
			this.player.canvasPosition,
			{ x: x * Tile.SIZE, y: y * Tile.SIZE },
			0.25,
			Easing.linear,
			() => {
				this.isMoving = false;

				this.updateDirection();

				if (this.checkForEncounter(x, y)) {
					this.startEncounter();
				}
			}
		);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns Whether the player is going to move on to a non-collidable tile.
	 */
	isValidMove(x, y) {
		return this.collisionLayer.getTile(x, y) === null;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns Whether player is going to move to a grass tile. Succeeds 10% of the time.
	 */
	checkForEncounter(x, y) {
		return (
			this.bottomLayer.isTileGrass(x, y) &&
			didSucceedPercentChance(PlayerWalkingState.ENCOUNTER_CHANCE)
		);
	}

	/**
	 * Starts the encounter by doing a fade transition into a new BattleState.
	 */
	startEncounter() {
		const encounter = new BattleState(this.player, new Opponent());

		sounds.stop(SoundName.Route);
		sounds.play(SoundName.BattleStart);

		TransitionState.fade(() => stateStack.push(encounter));
	}
}
