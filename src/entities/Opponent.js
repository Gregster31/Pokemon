import GameEntity from './GameEntity.js';
import { pokemonFactory } from '../globals.js';
import { pickRandomElement } from '../../lib/Random.js';
import PokemonName from '../enums/PokemonName.js';

export default class Opponent extends GameEntity {
	/**
	 * The character that the player fights during battle.
	 * Has a party of Pokemon they can use to battle the
	 * player's Pokemon.
	 *
	 * @param {object} entityDefinition
	 */
	constructor(entityDefinition = {}) {
		super(entityDefinition);

		this.party = this.initializeParty();
	}

	/**
	 * Right now there's only ever one Pokemon in the party, but this
	 * can be extended to contain more since it returns an array.
	 */
	initializeParty() {
		const pokemonName = pickRandomElement([
			PokemonName.Bulbasaur,
			PokemonName.Charmander,
			PokemonName.Squirtle,
		]);
		const pokemon = pokemonFactory.createInstance(pokemonName);

		return [pokemon];
	}
}
