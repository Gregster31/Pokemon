import { context } from "../../globals.js";
import { roundedRectangle } from "../../../lib/Drawing.js";
import Colour from "../../enums/Colour.js";
import { timer } from "../../globals.js";
import Easing from "../../../lib/Easing.js";

export default class ProgressBar {
    static WIDTH = 150;
    static HEIGHT = 8;

    constructor(x, y, width, height, color = Colour.Green, pokemon) {
        this.position = { x, y };
        this.dimensions = { x: width, y: height };

        this.color = color;
        this.pokemon = pokemon;
        this.barLifeSize = this.getLifeBarSize();
    }

    update() {
        const targetBarSize = this.getLifeBarSize();

        timer.tween(
            this, 
            { barLifeSize: targetBarSize }, 
            0.5, 
            Easing.linear, 
            () => this.updateColor(this.calculateHealthColor())
        );
    }

    render() {
        context.save();

        roundedRectangle(context, this.position.x, this.position.y, this.dimensions.x, this.dimensions.y, 4, true, false);
        context.fillStyle = Colour.White;
        roundedRectangle(context, this.position.x + 1, this.position.y + 1, this.dimensions.x - 3, this.dimensions.y - 3, 4, true, false);

        if (this.pokemon.currentHealth > 0) {
            context.fillStyle = this.color;
            roundedRectangle(context, this.position.x + 1, this.position.y + 1, this.barLifeSize, this.dimensions.y - 3, 4, true, false);
        }

        context.restore();
    }

    updateColor(color) {
        this.color = color;
    }

    calculateHealthColor() {
        const healthPercentage = this.pokemon.currentHealth / this.pokemon.health;

        if (healthPercentage > 0.5) 
            return Colour.Green;
        else if (healthPercentage > 0.25)
            return Colour.Gold;
        else
            return Colour.Crimson;
    }

    getLifeBarSize() {
        return Math.floor((this.pokemon.currentHealth / this.pokemon.health) * this.dimensions.x - 2);
    }
}
