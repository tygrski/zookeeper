const fs = require("fs");
const path = require("path");
const express = require("express");

const PORT = process.env.PORT || 3001;
// instantiate the server
const app = express();

// parse incoming string or array data
// mounts a function to the server that our requests will pass through before getting to the intended endpoint.
// The functions we can mount to our server are referred to as middleware.
app.use(express.urlencoded({ extend: true }));

// parse incoming JSON to data,  takes incoming POST data in the form of JSON and parses it into the req.body
app.use(express.json());

// route that the front-end can request data from
const { animals } = require("./data/animals");
const { off } = require("process");

function filterByQuery(query, animalsArray) {
  let personalityTraitsArray = [];
  // Note that we save the animalsArray as filteredResults here:
  let filteredResults = animalsArray;
  if (query.personalityTraits) {
    // Save personalityTraits as a dedicated array.
    // If personalityTraits is a string, place it into a new array and save.
    if (typeof query.personalityTraits === "string") {
      personalityTraitsArray = [query.personalityTraits];
    } else {
      personalityTraitsArray = query.personalityTraits;
    }
    // Loop through each trait in the personalityTraits array:
    personalityTraitsArray.forEach((trait) => {
      // Check the trait against each animal in the filteredResults array.
      // Remember, it is initially a copy of the animalsArray,
      // but here we're updating it for each trait in the .forEach() loop.
      // For each trait being targeted by the filter, the filteredResults
      // array will then contain only the entries that contain the trait,
      // so at the end we'll have an array of animals that have every one
      // of the traits when the .forEach() loop is finished.
      filteredResults = filteredResults.filter(
        (animal) => animal.personalityTraits.indexOf(trait) !== -1
      );
    });
  }
  if (query.diet) {
    filteredResults = filteredResults.filter(
      (animal) => animal.diet === query.diet
    );
  }
  if (query.species) {
    filteredResults = filteredResults.filter(
      (animal) => animal.species === query.species
    );
  }
  if (query.name) {
    filteredResults = filteredResults.filter(
      (animal) => animal.name === query.name
    );
  }
  // return the filtered results:
  return filteredResults;
}

// function , takess in id and array of animals and returns a single animal object
function findById(id, animalsArray) {
  const result = animalsArray.filter((animal) => animal.id === id)[0];
  return result;
}

// function that accepts the POST route's req.body value and the array we want to add the data to
function createNewAnimal(body, animalsArray) {
  const animal = body;
  animalsArray.push(animal);
  fs.writeFileSync(
    path.join(__dirname, "./data/animals.json"),
    JSON.stringify({ animals: animalsArray }, null, 2)
  );
  return animal;
}

function validateAnimal(animal) {
  if (!animal.name || typeof animal.name !== "string") {
    return false;
  }
  if (animal.species || typeof animal.species !== "string") {
    return false;
  }
  if (animal.diet || typeof animal.diet !== "string") {
    return false;
  }
  if (animal.personalityTraits || !Array.isArray(animal.personalityTraits)) {
    return false;
  }
  return true;
}

// add the route. get() method requires two arguments. The first is a string that describes the route the client will have to fetch from. The second is a callback function that will execute every time that route is accessed with a GET request.
app.get("/api/animals", (req, res) => {
  let results = animals;
  if (req.query) {
    results = filterByQuery(req.query, results);
  }
  res.json(results);
});

// route for data on animal by id
app.get("/api/animals/:id", (req, res) => {
  const result = findById(req.params.id, animals);
  if (result) {
    res.json(result);
  } else {
    res.send(404);
  }
});

// route on our server that accepts data to be used or stored server-side
app.post("/api/animals", (req, res) => {
  // set id based on what the next index of the array will be
  req.body.id = animals.length.toString();

  // if any data in the req.body is oncorrect, send 400 error back
  if(!validateAnimal(req.body)){
    res.status(400).send('The animal is not properly formatted');
  } else {
  // add animal to json file and animals array in this function
  const animal = createNewAnimal(req.body, animals);
  res.json(animal);
 }
});

// method to make server listen by chaining the listen() method onto the server
app.listen(PORT, () => {
  console.log(`API server now on port ${PORT}!`);
});
