require('dotenv').config();

console.log('IT WORKED!');

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');

const CampgroundsRoutes = require('./routes/campgrounds');
const ReviewsRoutes = require('./routes/reviews');
const UsersRoutes = require('./routes/users');

const MongoDBStore = require('connect-mongo');

const dbUrl = 'mongodb://localhost:27017/yelp-camp'

main().then(() => console.log('MONGO CONNECTION OPEN!'));
main().catch(err => {
  console.log('MONGO CONNECTION ERROR!!!');
  console.log(err);            
});
 
// 'mongodb://localhost:27017/yelp-camp'

async function main() {
  await mongoose.connect(dbUrl);
};

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Error:'));
db.once('open', () => {
  console.log('Database connected!');
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// parse the body
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

const store = MongoDBStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: 'thisshouldbeabettersecret'
  },
  touchAfter: 24 * 60 * 60
});

store.on('error', function(e) {
  console.log('SESSION STORE ERROR', e);
});

const sessionConfig = {
  store,
  name: 'mySession',
  secret: 'thisshouldbeabettersecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    //secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  console.log(req.query);
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// app.get('/fakeUser', async(req, res) => {
//   const user = new User({email: 'thuyanha2003@gmail.com', username: 'an'});
//   const newUser = await User.register(user, 'chicken');
//   res.send(newUser);
// });

app.use('/', UsersRoutes);
app.use('/campgrounds', CampgroundsRoutes);
app.use('/campgrounds/:id/reviews', ReviewsRoutes);

app.get('/', (req, res) => {
  res.render('home');
});

app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'SOMETHING WENT WRONG!';
  res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
  console.log('ON PORT 3000');
});