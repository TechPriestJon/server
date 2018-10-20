

function foodConsumed(numberOfPeople, elevationChange, temperature){
    let elevationFactor = 1 + Math.max(0, elevationChange);
    let temperatureFactor = 1 + Math.min(0, temperature);
    return numberOfPeople * (baseAmountOfFood * elevationFactor *  temperatureFactor;
}

function totalCarryableMass(numberOfPeople){
    return Math.exp(numberOfPeople); 
}

console.log(totalCarryableMass);