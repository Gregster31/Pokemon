import Easing from "../../../lib/Easing.js";
import State from "../../../lib/State.js";
import { CANVAS_HEIGHT, stateStack, timer } from "../../globals.js";
import Menu from "../../user-interface/elements/Menu.js";
import BattleMessageState from "./BattleMessageState.js";
import BattleState from "./BattleState.js";
import BattleTurnState from "./BattleTurnState.js";
import TransitionState from "./TransitionState.js";

export default class BattleMenuState extends State {
	static MENU_OPTIONS = {
		Fight: "FIGHT",
		Run: "RUN",
	}

	/**
	 * Represents the menu during the battle that the Player can choose an action from.
	 *
	 * @param {BattleState} battleState
	 */
	constructor(battleState) {
		super();

		this.battleState = battleState;

		const items = [
			{ text: BattleMenuState.MENU_OPTIONS.Fight, onSelect: () => this.fight() },
			{ text: BattleMenuState.MENU_OPTIONS.Run, onSelect: () => this.run() },
		];

		this.battleMenu = new Menu(
			Menu.BATTLE_MENU.x,
			Menu.BATTLE_MENU.y,
			Menu.BATTLE_MENU.width,
			Menu.BATTLE_MENU.height,
			items,
		);
	}

	update() {
		this.battleMenu.update();
		this.battleState.update();
	}

	render() {
		this.battleMenu.render();
	}

	fight() {
		stateStack.pop();
		stateStack.push(new BattleTurnState(this.battleState));
	}

	run() {
		timer.tween(
			this.battleState.playerPokemon.position,
			{ y: CANVAS_HEIGHT },
			0.2,
			Easing.linear,
			() => {
				stateStack.push(
					new BattleMessageState(
						`${this.battleState.playerPokemon.name} Go away safely!`,
						0,
						() => {
							stateStack.pop();
							this.battleState.exitBattle()
						}
					)
				);
			}
		);
	}
}
