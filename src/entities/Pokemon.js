import GameEntity from './GameEntity.js';
import { getRandomPositiveInteger } from '../../lib/Random.js';
import Sprite from '../../lib/Sprite.js';
import Vector from '../../lib/Vector.js';
import { context, images } from '../globals.js';

export default class Pokemon extends GameEntity {
	static FRONT_POSITION = {
		sprite: 0,
		start: { x: 480, y: 30 },
		end: { x: 280, y: 30 },
		attack: { x: 260, y: 30 },
	};
	static BACK_POSITION = {
		sprite: 1,
		start: { x: -160, y: 96 },
		end: { x: 30, y: 96 },
		attack: { x: 50, y: 96 },
	};
	static LOW_HEALTH_THRESHOLD = 0.25;

	/**
	 * The titular monster/creature that the whole game is
	 * based around. A Pokemon is nothing more than a box of
	 * numbers at the end of the day. One Pokemon's numbers
	 * are compared to another Pokemon's numbers, and things
	 * happen as a result. It's really a genius concept!
	 *
	 * @param {object} definition Defined in config/pokemon.json.
	 * @param {number} level
	 */
	constructor(name, definition, level) {
		super();

		this.name = name;
		this.level = level;
		this.position = new Vector();
		this.battlePosition = new Vector();
		this.attackPosition = new Vector();

		this.battleSprites = [
			new Sprite(
				images.get(`${this.name.toLowerCase()}-front`),
				0,
				0,
				160,
				160
			),
			new Sprite(
				images.get(`${this.name.toLowerCase()}-back`),
				0,
				0,
				160,
				160
			),
		];
		this.iconSprites = [
			new Sprite(
				images.get(`${this.name.toLowerCase()}-icon`),
				0,
				0,
				64,
				64
			),
			new Sprite(
				images.get(`${this.name.toLowerCase()}-icon`),
				64,
				0,
				64,
				64
			),
		];
		this.sprites = this.battleSprites;

		this.baseHealth = definition.baseHealth;
		this.baseAttack = definition.baseAttack;
		this.baseDefense = definition.baseDefense;
		this.baseSpeed = definition.baseSpeed;
		this.baseExperience = definition.baseExperience;

		this.initializeIndividualValues();

		this.health = 0;
		this.attack = 0;
		this.defense = 0;
		this.speed = 0;

		
		this.calculateStats();
		
		this.oldHealth = this.health;
		this.oldAttack = this.attack;
		this.oldDefense = this.defense;
		this.oldSpeed = this.speed;

		this.targetExperience = this.experienceFromLevel(level + 1);
		this.currentExperience = this.experienceFromLevel(level);
		this.levelExperience = this.experienceFromLevel(level);

		this.currentHealth = this.health;

		// Used to flash the Pokemon when taking damage.
		this.alpha = 1;
	}

	render() {
		context.save();
		context.globalAlpha = this.alpha;
		super.render(this.position.x, this.position.y);
		context.restore();
	}

	/**
	 * @see https://bulbapedia.bulbagarden.net/wiki/Individual_values
	 */
	initializeIndividualValues() {
		this.healthIV = getRandomPositiveInteger(0, 31);
		this.attackIV = getRandomPositiveInteger(0, 31);
		this.defenseIV = getRandomPositiveInteger(0, 31);
		this.speedIV = getRandomPositiveInteger(0, 31);
	}

	/**
	 * The "front" sprite is usually the opponent's sprite
	 * in a battle. This could also be used in the Pokedex
	 * or when evolving as well. The "back" sprite is usually
	 * the player's sprite in a battle.
	 *
	 * @param {object} position Pokemon.FRONT_POSITION or Pokemon.BACK_POSITION.
	 */
	prepareForBattle(position) {
		this.sprites = this.battleSprites;
		this.currentFrame = position.sprite;
		this.position.set(position.start.x, position.start.y);
		this.battlePosition.set(position.end.x, position.end.y);
		this.attackPosition.set(position.attack.x, position.attack.y);
	}

	levelUp() {
		this.level++;
		this.levelExperience = this.experienceFromLevel(this.level);
		this.targetExperience = this.experienceFromLevel(this.level + 1);

		return this.calculateStats();
	}

	/**
	 * @returns Using the Medium Fast formula.
	 * @see https://bulbapedia.bulbagarden.net/wiki/Experience#Medium_Fast
	 */
	experienceFromLevel(level) {
		return level === 1 ? 0 : level * level * level;
	}

	/**
	 * @param {Pokemon} opponent
	 * @returns The amount of experience to award the Pokemon that defeated this Pokemon.
	 * @see https://bulbapedia.bulbagarden.net/wiki/Experience#Gain_formula
	 */
	calculateExperienceToAward(opponent) {
		return Math.round((opponent.baseExperience * opponent.level) / 7);
	}

	heal(amount = this.health) {
		this.currentHealth = Math.min(this.health, this.currentHealth + amount);
	}

	isLowHealth() {
		const percentage = this.currentHealth / this.health;

		return percentage <= Pokemon.LOW_HEALTH_THRESHOLD && percentage > 0;
	}

	/**
	 * @see https://bulbapedia.bulbagarden.net/wiki/Individual_values
	 */
	calculateStats() {
		this.oldHealth = this.health;
		this.oldAttack = this.attack;
		this.oldDefense = this.defense;
		this.oldSpeed = this.speed;

		this.health = this.calculateHealth();
		this.attack = this.calculateStat(this.baseAttack, this.attackIV);
		this.defense = this.calculateStat(this.baseDefense, this.defenseIV);
		this.speed = this.calculateStat(this.baseSpeed, this.speedIV);
	}

	calculateHealth() {
		return (
			Math.floor(
				((2 * this.baseHealth + this.healthIV) * this.level) / 100
			) +
			this.level +
			10
		);
	}

	calculateStat(base, iv) {
		return Math.floor(((2 * base + iv) * this.level) / 100) + 5;
	}

	/**
	 * @param {Pokemon} defender
	 * @see https://bulbapedia.bulbagarden.net/wiki/Damage
	 */
	inflictDamage(defender) {
		const power = 40;
		const damage = Math.max(
			1,
			Math.floor(
				(((2 * this.level) / 5 + 2) *
					power *
					(this.attack / defender.defense)) /
					50 +
					2
			)
		);

		defender.currentHealth = Math.max(0, defender.currentHealth - damage);
	}

	getHealthMeter() {
		return `${Math.floor(this.currentHealth)} / ${this.health}`;
	}

	getExperienceMeter() {
		return `${Math.floor(
			this.currentExperience - this.levelExperience
		)} / ${this.targetExperience - this.levelExperience}`;
	}
}
