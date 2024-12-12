import Colour from "../../enums/Colour.js";
import ProgressBar from "./ProgressBar.js";

export default class HealthBar extends ProgressBar {
    static WIDTH = 160;
    static HEIGHT = 8;

    constructor(x, y, width, height, color, currentValue, maxValue, pokemon) {
        super(x, y, width, height, color, currentValue, maxValue)

        this.pokemon = pokemon;
    }

    update() {
        super.update(this.pokemon.currentHealth, 1, this.pokemon.currentHealth <= this.pokemon.health / 2 ? this.pokemon.currentHealth <= this.pokemon.health / 4 ? Colour.Red : Colour.Yellow : Colour.Green);
    }

    render() {
        super.render();
    }

}