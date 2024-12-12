import { context } from "../../globals.js";
import { roundedRectangle } from "../../../lib/Drawing.js";
import Colour from "../../enums/Colour.js";
import { timer } from "../../globals.js";
import Easing from "../../../lib/Easing.js";
import ProgressBar from "./ProgressBar.js";

export default class ExperienceBar extends ProgressBar {
    static WIDTH = 150;
    static HEIGHT = 8;

    constructor(x, y, width, height, pokemon) {
        super(x, y, width, height, Colour.Blue, pokemon);
        this.barSize = this.getExperienceBarSize();
    }

    update() {
        const targetBarSize = this.getExperienceBarSize();

        timer.tween(
            this, 
            { barSize: targetBarSize },
            0.5, 
            Easing.linear, 
        );
    }

    render() {
        context.save();

        roundedRectangle(
            context,
            this.position.x,
            this.position.y,
            this.dimensions.x,
            this.dimensions.y,
            4,
            true,
            false
        );

        context.fillStyle = Colour.White;
        roundedRectangle(
            context,
            this.position.x + 1,
            this.position.y + 1,
            this.dimensions.x - 3,
            this.dimensions.y - 3,
            4,
            true,
            false
        );

        if (this.pokemon.currentExperience - this.pokemon.levelExperience > 0) {
            context.fillStyle = Colour.DodgerBlue;
            roundedRectangle(
                context,
                this.position.x + 1,
                this.position.y + 1,
                this.barSize,
                this.dimensions.y - 3,
                4,
                true,
                false
            );
        }

        context.restore();
    }

    getExperienceBarSize() {
        const experienceGained = this.pokemon.currentExperience - this.pokemon.levelExperience;
        const experienceRequired = this.pokemon.targetExperience - this.pokemon.levelExperience;
    
        if(experienceGained > experienceRequired) {
            return Math.floor(1 * (this.dimensions.x - 3));
        }
        return Math.floor(
            (experienceGained / experienceRequired) * (this.dimensions.x - 3)
        );
    }
    
}
