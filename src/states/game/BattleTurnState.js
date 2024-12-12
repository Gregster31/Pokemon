import State from '../../../lib/State.js';
import SoundName from '../../enums/SoundName.js';
import { CANVAS_HEIGHT, sounds, stateStack, timer } from '../../globals.js';
import Pokemon from '../../entities/Pokemon.js';
import BattleMenuState from './BattleMenuState.js';
import BattleMessageState from './BattleMessageState.js';
import BattleState from './BattleState.js';
import { oneInXChance } from '../../../lib/Random.js';
import Easing from '../../../lib/Easing.js';
import DialogueState from './DialogueState.js';
import Panel from '../../user-interface/elements/Panel.js';

export default class BattleTurnState extends State {
	/**
	 * When Pokemon attack each other, this state takes
	 * care of lowering their health and reflecting the
	 * changes in the UI. If the Player is victorious,
	 * the Pokemon is awarded with experience based on the
	 * opponent Pokemon's stats.
	 *
	 * @param {BattleState} battleState
	 */
	constructor(battleState) {
		super();

		this.battleState = battleState;
		this.playerPokemon = battleState.playerPokemon;
		this.opponentPokemon = battleState.opponentPokemon;

		// Determine the order of attack based on the Pokemons' speed.
		if (this.playerPokemon.speed > this.opponentPokemon.speed) {
			this.firstPokemon = this.playerPokemon;
			this.secondPokemon = this.opponentPokemon;
		} else if (this.playerPokemon.speed < this.opponentPokemon.speed) {
			this.firstPokemon = this.opponentPokemon;
			this.secondPokemon = this.playerPokemon;
		} else if (oneInXChance(2)) {
			this.firstPokemon = this.playerPokemon;
			this.secondPokemon = this.opponentPokemon;
		} else {
			this.firstPokemon = this.opponentPokemon;
			this.secondPokemon = this.playerPokemon;
		}
	}

	enter() {
		this.attack(this.firstPokemon, this.secondPokemon, () => {
			if (this.checkBattleEnded()) {
				stateStack.pop();
				return;
			}

			this.attack(this.secondPokemon, this.firstPokemon, () => {
				if (this.checkBattleEnded()) {
					stateStack.pop();
					return;
				}

				stateStack.pop();
				stateStack.push(new BattleMenuState(this.battleState));
			});
		});
	}

	update() {
		this.battleState.update();
	}

	/**
	 * Animate the attacking Pokemon and deal damage to the defending Pokemon.
	 * Move the attacker forward and back quickly to indicate an attack motion.
	 *
	 * @param {Pokemon} attacker
	 * @param {Pokemon} defender
	 * @param {function} callback
	 */
	attack(attacker, defender, callback) {
		stateStack.push(
			new BattleMessageState(
				`${attacker.name} attacked ${defender.name}!`,
				0.5,
				() => {
					timer.tween(
						attacker.position,
						{ x: attacker.attackPosition.x, y: attacker.attackPosition.y },
						0.1,
						Easing.linear,
						() => {
							timer.tween(
								attacker.position,
								{ x: attacker.battlePosition.x, y: attacker.battlePosition.y },
								0.1,
								Easing.linear,
								() =>
									this.inflictDamage(
										attacker,
										defender,
										callback
									)
							);
						}
					);
				}
			)
		);
	}

	/**
	 * Flash the defender to indicate they were attacked.
	 * When finished, decrease the defender's health bar.
	 */
	async inflictDamage(attacker, defender, callback) {
		sounds.play(SoundName.BattleDamage);

		const action = () => {
			defender.alpha = defender.alpha === 1 ? 0.5 : 1;
		};
		const interval = 0.05;
		const duration = 0.5;

		await timer.addTask(action, interval, duration, () => {
			defender.alpha = 1;

			attacker.inflictDamage(defender);

			// If player pokemon takes damage, otherwise opponent damage
			if(defender == this.playerPokemon){
				// Make the bar go down
				this.battleState.playerPanel.healthBar.update()
			} else {
				this.battleState.opponentPanel.healthBar.update()
			}

			callback();
		});
	}

	checkBattleEnded() {
		if (this.playerPokemon.currentHealth <= 0) {
			this.processDefeat();
			return true;
		} else if (this.opponentPokemon.currentHealth <= 0) {
			this.processVictory();
			return true;
		}

		return false;
	}

	/**
	 * Tween the Player Pokemon off the bottom of the screen.
	 * Fade out and transition back to the PlayState.
	 */
	processDefeat() {
		sounds.play(SoundName.PokemonFaint);
		timer.tween(
			this.playerPokemon.position,
			{ y: CANVAS_HEIGHT },
			0.2,
			Easing.linear,
			() => {
				stateStack.push(
					new BattleMessageState(
						`${this.playerPokemon.name} fainted!`,
						0,
						() => this.battleState.exitBattle()
					)
				);
			}
		);
	}

	/**
	 * Tween the Opponent Pokemon off the bottom of the screen.
	 * Process experience gained by the Player Pokemon.
	 */
	processVictory() {
		sounds.play(SoundName.PokemonFaint);
		timer.tween(
			this.opponentPokemon.position,
			{ y: CANVAS_HEIGHT },
			0.4,
			Easing.linear,
			() => {
				sounds.stop(SoundName.BattleLoop);
				sounds.play(SoundName.BattleVictory);
				stateStack.push(
					new BattleMessageState('You won!', 0, () =>
						this.processExperience()
					)
				);
			}
		);
	}

	processExperience() {
		const experience = this.playerPokemon.calculateExperienceToAward(
			this.opponentPokemon
		);
		const message = `${this.playerPokemon.name} earned ${experience} experience points!`;
		
		this.playerPokemon.currentExperience += experience;
		this.battleState.playerPanel.experienceBar.update()

		stateStack.push(
			new BattleMessageState(message, 0, () => {
				this.processLevelUp()
				}
			)
		);

	}

	processLevelUp() {
		// Level up if we've gone over the experience threshold.
		if (
			this.playerPokemon.currentExperience <
			this.playerPokemon.targetExperience
		) {
			this.battleState.exitBattle();
			return;
		}


		sounds.play(SoundName.ExperienceFull);

		this.playerPokemon.levelUp();

		stateStack.push(
			new BattleMessageState(
				`${this.playerPokemon.name} grew to LV. ${this.playerPokemon.level}!`,
				0,
				() => {
					this.displayStats();
				}
			)
		);
	}

	displayStats() {
		stateStack.push(
			new DialogueState(
				`Health:${this.playerPokemon.oldHealth} > ${this.playerPokemon.health}\n
				Attack:${this.playerPokemon.oldAttack} > ${this.playerPokemon.attack}\n
				Defense:${this.playerPokemon.oldDefense} > ${this.playerPokemon.defense}\n
				Speed:${this.playerPokemon.oldSpeed} > ${this.playerPokemon.speed}`,
				Panel.BOTTOM_LEFT_DIALOGUE,
				() => this.battleState.exitBattle()
			)
		);
	}
}
