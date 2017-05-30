const express = require('express');
const http = require('http');
const DB = require('./connect.js');

const bodyParser = require('body-parser');
const crypto = require('crypto');
const session = require('express-session');

const app = express();


//基本设置
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(session({
    secret: 'yunhan',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 300 * 600
    }
}));

app.set('view engine', 'hbs');
app.set('views', './static');

function md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}



//注册
app.get('/user/sign', (request, response) => {
    response.render('./user/sign');
});
app.post('/user/sign', (request, response) => {

    console.log(request.body);
    let username = request.body.username;
    let password = request.body.password;

    password = md5(password);

    DB.query('INSERT INTO users set ?', {
        username: username,
        password: password
    }, (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            response.redirect('http://localhost:3000/login.html');
            request.session.username = username;
        }
    });
});



//登录
app.get('/user/login', (request, response) => {
    response.render('./user/login');
});
app.post('/user/login', (request, response) => {

    let username = request.body.username;
    let password = request.body.password;

    console.log(request.body);
    password = md5(password);

    DB.query('SELECT password FROM users WHERE username = ?', username, (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            if (rows[0].password === password) {
                request.session.username = username;
                response.redirect('http://localhost:3000/index');
                response.render('index', {
                    name: username
                });
            } else {
                response.end('Incorrect password');
            }
        }
    });

});



//添加Todo
app.post('/user/todolist/creat', (request, response) => {

    console.log(request.body);
    let todo_user = request.session.username;
    let todo_content = request.body.todo_content;

    if (todo_user !== null) {
        DB.query('INSERT INTO todolist set ?', {
            todo_user: todo_user,
            todo_content: todo_content
        }, (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                console.log('success');
                response.redirect('http://localhost:3000/index');
            }
        });
    }else
    {
        response.redirect('http://localhost:3000/user/login');
    }

});


// //查看Todolist
// app.get('/user/todolist/show', (request, response) => {

//     console.log(request.body);
//     let username = request.session.username;

//     DB.query('SELECT * FROM todolist WHERE todo_status=1 and todo_user = ?', username, (err, rows) => {
//         if (err) {
//             console.log(err);
//         } else {
//             response.render('user/todo.show', {
//                 rows: rows,
//                 name: username
//             });
//         }
//     });

// });

//完成Todo
app.post('/user/todolist/delete', (request, response) => {
    DB.query('UPDATE todolist SET todo_status=0 WHERE todo_id = ?', request.body.todo_id, (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            response.redirect('http://localhost:3000/index');
        }
    });
});

//主页
app.all('/index', (request, response) => {
    console.log(request.body);

    let username = request.session.username;


    DB.query('SELECT * FROM todolist WHERE todo_status = 1', (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            response.render('index', {
                rows: rows,
                name: username || '请登录'
            });
            console.log('success');
        }
    });

});


const checkStatus = (request, response) => {
    let username = request.session.username;
    if (username !== undefined) {
        response.redirect('http://localhost:3000/');
        return true;
    } else {
        response.redirect('http://localhost:3000/login.html');
        return false;
    }
}

http.createServer(app).listen(3000);