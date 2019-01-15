var express = require('express');
var router = express.Router();
const path = require('path');
var sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser')
var urlencodeParser = bodyParser.urlencoded({
  extended: false
});

//connecting to DB
let db = new sqlite3.Database(path.join(__dirname, '../database/data.db'));
//console.log(db);

//create table
db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,string TEXT, integer INTEGER, float INTEGER, date TEXT, boolean TEXT)');

router.get('/', function (req, res, next) {
  const page = req.query.page || 1;
  const limit = 5;
  const offset = (page - 1) * limit;
  const url = req.url == '/' ? '/?page=1' : req.url

  let params = [];
  let isFilter = false;

  if (req.query.checkid && req.query.formid) {
    params.push(`id=${req.query.formid}`);
    isFilter = true;
  }
  if (req.query.checkstring && req.query.formstring) {
    params.push(`string like '%${req.query.formstring}%'`);
    isFilter = true;
  }
  if (req.query.checkinteger && req.query.forminteger) {
    params.push(`integer=${req.query.forminteger}`);
    isFilter = true;
  }
  if (req.query.checkfloat && req.query.formfloat) {
    params.push(`float=${req.query.formfloat}`);
    isFilter = true;
  }
  if (req.query.checkdate && req.query.formdate && req.query.formenddate) {
    params.push(`date between '${req.query.formdate}' and '${req.query.formenddate}'`);
    isFilter = true;
  }
  if (req.query.checkboolean && req.query.boolean) {
    params.push(`boolean='${req.query.boolean}'`);
    isFilter = true;
  }

  let sql = `select count(*) as total from users`;
  if (isFilter) {
    sql += ` where ${params.join(' and ')}`

  }

  db.all(sql, (err, count) => {
    const total = count[0].total;
    const pages = Math.ceil(total / limit);
    sql = `select * from users`;
    if (isFilter) {
      sql += ` where ${params.join(' and ')}`
    }
    sql += ` limit ${limit} offset ${offset}`;

    db.all(sql, (err, rows) => {
      res.render('index', {
        rows,
        page,
        pages,
        query: req.query,
        url
      });
    });
  });

});

router.get('/add', function (req, res, next) {
  res.render('add');
});

router.post('/add', urlencodeParser, function (req, res) {
  let sql = 'INSERT INTO users (id, string,integer, float, date, boolean) VALUES (?,?,?,?,?,?)'
  db.run(sql, req.body.id, req.body.string, req.body.integer, req.body.float, req.body.date, req.body.boolean, (err) => {
    if (err) {
      console.error(err.messsage);
    }
    console.log('post to add success');
    //console.log(db);
  })
  res.redirect('/');
})

router.post('/edit/:id', function (req, res) {
  let id = req.params.id;
  let sql = ' update users set string = ?, integer= ?, float = ?, date = ?, boolean = ? where id = ? '
  db.run(sql,
    req.body.string, req.body.integer, req.body.float, req.body.date, req.body.boolean, id, (err) => {
      if (err) {
        console.error(err.messsage);
      }
      console.log('post to edit success');
    });
  res.redirect('/');
})

router.get('/edit/:id', function (req, res, next) {
  let id = req.params.id;
  db.all('select * from users where id = $id', {
    $id: id
  }, (err, rows) => {
    res.render('edit', {
      item: rows[0],
      id: id
    })
    //console.log(rows[0]);
  })
});

router.get('/delete/:id', function (req, res, next) {
  let id = req.params.id;
  db.run('delete from users where id= $id', {
      $id: id
    },
    req.body.id, (err) => {
      if (err) {
        console.error(err.messsage);
      }
      console.log('delete success');
    })
  res.redirect('/');
});


module.exports = router;