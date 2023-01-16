const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

main().then(() => console.log('MONGO CONNECTION OPEN!'));
main().catch(err => {
  console.log('MONGO CONNECTION ERROR!!!');
  console.log(err);
});
 
async function main() {
  await mongoose.connect('mongodb://localhost:27017/yelp-camp');
};

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Error:'));
db.once('open', () => {
  console.log('Database connected!');
});

const sample = array => 
  array[Math.floor(Math.random() * array.length)];

const seedDB = async() => {
  await Campground.deleteMany({});
  for (let i = 0; i < 300; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      author: '638f5f7bb61efc808eb7374a',
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      description: 'Lorem ipsum dolor sit amet consectetur',
      price: price,
      geometry: {
        type: 'Point',
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ]
      },
      images: [
        {
          url: 'https://res.cloudinary.com/ddzygotrx/image/upload/v1670921333/YelpCamp/bbzifjy74adjikisdxxe.jpg',
          filename: 'YelpCamp/bbzifjy74adjikisdxxe',
        },
      ]
    })
    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
})