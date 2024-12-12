import Pokemon from "../entities/Pokemon.js";
import PokemonName from "../enums/PokemonName.js";

export default class PokemonFactory {
	constructor(context) {
		this.context = context;
		this.pokemon = {};
	}

	load(pokemonDefinitions) {
		this.pokemon = pokemonDefinitions;

		Object.keys(pokemonDefinitions).forEach((name) => {
			PokemonName[name] = name;
		});
	}

	get(name) {
		return this.pokemon[name];
	}

	createInstance(name, level = 1) {
		return new Pokemon(name, this.pokemon[name], level);
	}
}
