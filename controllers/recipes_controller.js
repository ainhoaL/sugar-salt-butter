const Recipe = require('../models/recipe');

module.exports = {

    /**
     * Create recipe using the recipe model
     * @param req {request object}
     * @param res {response object}
     */
    create(req, res) {
        if (req.body && req.body.ingredients) {
            let recipe = req.body;
            let ingredients = module.exports.parseIngredients(recipe.ingredients);
            recipe.ingredients = ingredients;
            // TODO: for now assuming that the request is in the same format as the recipe model
            Recipe.create(recipe).then(dbRecipe => res.send(dbRecipe));
        }
    },

    /**
     * Given a multiline string with a list of ingredients it returns a standardized array of ingredients
     * It standardizes the ingredients units so all ingredients are always stored with same units for easier conversion later on
     * @param ingredientsText {string} - a multiline string with 1 ingredient per line
     * @returns {Array} - array of ingredient objects { quantity (string), unit (string), name (string) }
     */
    parseIngredients(ingredientsText) {
        // separate each ingredient in quantity, unit and name.
        // To find the unit type, using an array of possible units regexes to look for in the ingredients
        const units = [
            { name: 'cup', regex: /cup[s]?/ }, 
            { name: 'cup', regex: /[cC][s]?[.]?\s/ }, 
            { name: 'tsp', regex: /tsp[s]?[.]?/ }, 
            { name: 'tsp', regex: /teaspoon[s]?/ }, 
            // { name: 'tsp', regex: /\st[s]?\s/ }, TODO: need to rework this one! Does any recipe write ingredients like: "1 t butter"
            { name: 'tbsp', regex: /[Tt]bsp[s]?[.]?/ }, 
            // { name: 'tbsp', regex: /T[B]?[s]?[.]?\s/ },  TODO: need to rework this one! Does any recipe write ingredients like: "1 T butter" or "1 TB butter"
            { name: 'tbsp', regex: /[Tt]bl?[s]?[.]?\s/ }, 
            { name: 'tbsp', regex: /tablespoon[s]*[.]*/ }, 
            { name: 'kg', regex: /[Kk]g[s]?[.]?\s/ },
            { name: 'kg', regex: /kilogram[s]?/ },
            { name: 'kg', regex: /kilo[s]?/ },   
            { name: 'g', regex: /g[r]?[s]?[.]?\s/ }, 
            { name: 'g', regex: /gram[s]?/ }, 
            { name: 'ml', regex: /m[Ll][s]?[.]?/ }, 
            { name: 'ml', regex: /milliliter[s]?/ }, 
            { name: 'ml', regex: /mil[s]?[.]?/ }, 
            { name: 'oz', regex: /oz[s]?[.]?/ }, 
            { name: 'oz', regex: /ounce[s]?[.]?/ }, 
            { name: 'l', regex: /[Ll][s]?[.]?\s/ }, 
            { name: 'l', regex: /liter[s]?/ }];
        let formattedIngredients = [];
        let ingredientsArray = ingredientsText.split(/\r?\n/); // Split by lines
        ingredientsArray.forEach((ingredient) => {
            let foundPosition = -1;
            let unitCount = 0;
            let found = false;
            while (!found && unitCount < units.length) {
                found = units[unitCount].regex.test(ingredient);
                unitCount++;
            }
            if (found) { // This ingredient matches one of the unit regexes
                let splitArray = ingredient.split(units[unitCount - 1].regex)
                let quantity = splitArray[0].trim(); // TODO: check it is a number
                let unit = units[unitCount - 1].name;
                let name = splitArray[1].trim();
                formattedIngredients.push({ quantity, unit, name });
            } else { // It does not match any of the unit regex
                // If there is no unit, then this ingredient has the shape <Quantity Name> or just <Name>
                let firstSeparation = ingredient.indexOf(' ');
                let quantity = ingredient.substr(0, firstSeparation).trim(); // TODO: handle "1 1/2 name"
                let name = ingredient.substr(firstSeparation + 1, ingredient.length - 1).trim();

                if (isNaN(parseInt(quantity))) {
                    // Quantity is not a number so this is an ingredient without quantity - For example: a handfull of peanuts
                    quantity = null;
                    name = ingredient;
                }
                formattedIngredients.push({ quantity, name });
            }
        });
        return formattedIngredients;
    }
}