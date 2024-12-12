import PokemonStatsPanel from '../../user-interface/PokemonStatsPanel.js';
import State from '../../../lib/State.js';
import Input from '../../../lib/Input.js';
import { input, sounds, stateStack } from '../../globals.js';
import SoundName from '../../enums/SoundName.js';

export default class PokemonStatsState extends State {
	constructor(pokemon) {
		super();

		this.panel = new PokemonStatsPanel(pokemon);
	}

	enter() {
		sounds.play(SoundName.MenuOpen);
	}

	update(dt) {
		this.panel.update(dt);

		if (
			input.isKeyPressed(Input.KEYS.ESCAPE) ||
			input.isKeyPressed(Input.KEYS.ENTER)
		) {
			stateStack.pop();
		}
	}

	render() {
		this.panel.render();
	}
}
