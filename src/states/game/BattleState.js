import State from "../../../lib/State.js";
import Player from "../../entities/Player.js";
import ImageName from "../../enums/ImageName.js";
import SoundName from "../../enums/SoundName.js";
import { images, sounds, stateStack, timer } from "../../globals.js";
import BattleOpponentPanel from "../../user-interface/battle/OpponentPanel.js";
import BattlePlayerPanel from "../../user-interface/battle/PlayerPanel.js";
import Panel from "../../user-interface/elements/Panel.js";
import Pokemon from "../../entities/Pokemon.js";
import BattleMenuState from "./BattleMenuState.js";
import BattleMessageState from "./BattleMessageState.js";
import TransitionState from "./TransitionState.js";
import Opponent from "../../entities/Opponent.js";
import Easing from "../../../lib/Easing.js";

export default class BattleState extends State {
	static PLAYER_PLATFORM = { x: 0, y: 200 };
	static OPPONENT_PLATFORM = { x: 215, y: 80 };

	/**
	 * When a Player encounters a Pokemon in the wild the
	 * Player's Pokemon and Opponent Pokemon will battle.
	 * This state serves as the starting point for the battle.
	 *
	 * @param {Player} player
	 * @param {Opponent} opponent
	 */
	constructor(player, opponent) {
		super();

		this.player = player;
		this.opponent = opponent;
		this.playerPokemon = player.party[0];
		this.opponentPokemon = opponent.party[0];

		this.playerPokemon.prepareForBattle(Pokemon.BACK_POSITION);
		this.opponentPokemon.prepareForBattle(Pokemon.FRONT_POSITION);

		this.didBattleStart = false;

		this.panel = new Panel(
			Panel.BOTTOM_DIALOGUE.x,
			Panel.BOTTOM_DIALOGUE.y,
			Panel.BOTTOM_DIALOGUE.width,
			Panel.BOTTOM_DIALOGUE.height,
		);
		this.playerPanel = new BattlePlayerPanel(
			Panel.BATTLE_PLAYER.x,
			Panel.BATTLE_PLAYER.y,
			Panel.BATTLE_PLAYER.width,
			Panel.BATTLE_PLAYER.height,
			this.playerPokemon,
		);
		this.opponentPanel = new BattleOpponentPanel(
			Panel.BATTLE_OPPONENT.x,
			Panel.BATTLE_OPPONENT.y,
			Panel.BATTLE_OPPONENT.width,
			Panel.BATTLE_OPPONENT.height,
			this.opponentPokemon,
		);
	}

	update() {
		if (!this.didBattleStart) {
			this.triggerBattleStart();
		}

		if (this.playerPokemon.isLowHealth()) {
			sounds.play(SoundName.LowHealth);
		}
		else {
			sounds.stop(SoundName.LowHealth);
		}
	}

	render() {
		this.renderBackground();
		this.renderForeground();
	}

	renderBackground() {
		images.render(ImageName.BattleBackground, 0, 0);
		images.render(ImageName.BattlePlatformGrass, BattleState.OPPONENT_PLATFORM.x, BattleState.OPPONENT_PLATFORM.y);
		images.render(ImageName.BattlePlatformGrass, BattleState.PLAYER_PLATFORM.x, BattleState.PLAYER_PLATFORM.y);
	}

	renderForeground() {
		this.playerPokemon.render();
		this.opponentPokemon.render();
		this.panel.render();
		this.playerPanel.render();
		this.opponentPanel.render();
	}

	triggerBattleStart() {
		this.didBattleStart = true;

		sounds.play(SoundName.BattleLoop);
		timer.tween(this.opponentPokemon.position, { x: Pokemon.FRONT_POSITION.end.x }, 0.75, Easing.linear, () => this.triggerStartingDialogue());
	}

	triggerStartingDialogue() {
		sounds.play(this.opponentPokemon.name.toLowerCase());
		stateStack.push(new BattleMessageState(`A wild ${this.opponentPokemon.name} appeared!`, 0, () => {
			stateStack.push(new BattleMessageState(`Go ${this.playerPokemon.name}!`, 0, () => this.sendOutPlayerPokemon()));
		}));
	}

	sendOutPlayerPokemon() {
		timer.tween(this.playerPokemon.position, { x: Pokemon.BACK_POSITION.end.x }, 0.75, Easing.linear, () => {
			sounds.play(this.playerPokemon.name.toLowerCase());
			stateStack.push(new BattleMenuState(this))
		});
	}

	exitBattle() {
		TransitionState.fade(() => {
			stateStack.pop();
			sounds.stop(SoundName.LowHealth);
			sounds.stop(SoundName.BattleLoop);
			sounds.stop(SoundName.BattleVictory);
			sounds.play(SoundName.Route);
		})
	}
}
