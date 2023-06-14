if(process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override');
const fs = require('fs')
const initializePassport = require('./passport-config');

initializePassport(
passport,
getUserByEmail,
getUserById
);

function getUserByEmail(email) {
// Ler os dados dos usuários do arquivo JSON
let usersData = [];
try {
  const usersFile = fs.readFileSync('users.json');
  usersData = JSON.parse(usersFile);
} catch (err) {
  console.error('Erro ao ler o arquivo de usuários:', err);
}

// Encontrar e retornar o usuário com o email correspondente
return usersData.find(user => user.email === email);
}

function getUserById(id) {
// Ler os dados dos usuários do arquivo JSON
let usersData = [];
try {
  const usersFile = fs.readFileSync('users.json');
  usersData = JSON.parse(usersFile);
} catch (err) {
  console.error('Erro ao ler o arquivo de usuários:', err);
}

// Encontrar e retornar o usuário com o id correspondente
return usersData.find(user => user.id === id);
}

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false}))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'));
app.use(express.static('imgs'));

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name });
});

app.get('/main', (req, res) => {
  res.render('main.ejs');
});

app.get('/imag', checkAuthenticated, (req, res) => {
  res.render('imag.ejs', { name: req.user.name });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/cadsap', (req, res) => {
  res.render('cadsap.ejs');
});

app.post('/addshoe', (req, res) => {
  const { marca, cor, tamanho, tipo } = req.body;

  // Ler os dados existentes do arquivo JSON
  let shoesData = [];
  try {
      const shoesFile = fs.readFileSync('shoes.json');
      shoesData = JSON.parse(shoesFile);
  } catch (err) {
      console.error('Erro ao ler o arquivo de sapatos:', err);
  }

  // Criar um novo objeto de sapato com as informações do formulário
  const newShoe = {
      id: Date.now().toString(),
      marca,
      cor,
      tamanho,
      tipo
  };

  // Adicionar o novo sapato aos dados existentes
  shoesData.push(newShoe);

  // Escrever os dados atualizados no arquivo JSON
  try {
      fs.writeFileSync('shoes.json', JSON.stringify(shoesData));
      res.redirect('/logsap');
  } catch (err) {
      console.error('Erro ao escrever o arquivo de sapatos:', err);
      res.redirect('/cadsap');
  }
});

app.get('/logsap', (req, res) => {
  // Ler os dados do arquivo JSON
  let shoesData = [];
  try {
      const shoesFile = fs.readFileSync('shoes.json');
      shoesData = JSON.parse(shoesFile);
  } catch (err) {
      console.error('Erro ao ler o arquivo de sapatos:', err);
  }

  res.render('logsap.ejs', { shoes: shoesData });
});

app.delete('/logsap/:id', (req, res) => {
  const { id } = req.params;

  // Ler os dados do arquivo JSON
  let shoesData = [];
  try {
    const shoesFile = fs.readFileSync('shoes.json');
    shoesData = JSON.parse(shoesFile);
  } catch (err) {
    console.error('Erro ao ler o arquivo de sapatos:', err);
  }

  // Encontrar o índice do sapato com o ID correspondente
  const shoeIndex = shoesData.findIndex(shoe => shoe.id === id);

  if (shoeIndex !== -1) {
    // Remover o sapato da lista
    shoesData.splice(shoeIndex, 1);

    // Escrever os dados atualizados de sapatos no arquivo JSON
    try {
      fs.writeFileSync('shoes.json', JSON.stringify(shoesData));
      res.sendStatus(200); // Envie o status 200 para indicar sucesso na exclusão
    } catch (err) {
      console.error('Erro ao escrever o arquivo de sapatos:', err);
      res.sendStatus(500); // Envie o status 500 para indicar erro no servidor
    }
  } else {
    res.sendStatus(404); // Envie o status 404 para indicar que o sapato não foi encontrado
  }
});


app.get('/register', (req, res) => {
  res.render('register.ejs');
});

app.post('/register', async (req, res) => {
  try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const newUser = {
          id: Date.now().toString(),
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
      };

      let usersData = [];
      try {
          const usersFile = fs.readFileSync('users.json');
          usersData = JSON.parse(usersFile);
      } catch (err) {
          console.error('Erro ao ler o arquivo de usuários:', err);
      }

      usersData.push(newUser);

      try {
          fs.writeFileSync('users.json', JSON.stringify(usersData));
          res.redirect('/login');
      } catch (err) {
          console.error('Erro ao escrever o arquivo de usuários:', err);
          res.redirect('/register');
      }
  } catch {
      res.redirect('/register');
  }
});

app.delete('/logout', (req, res) => {
  req.logout(); // Remova a função de callback, pois não é necessária

  res.redirect('/main');
});


function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }

  res.redirect('/main');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return res.redirect('/');
  }

  next();
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
